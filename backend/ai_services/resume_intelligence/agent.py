"""The agent loop, written directly (no LangChain / LangGraph / orchestration framework).

    Analyze -> Generate -> Evaluate -> Revise -> Re-evaluate -> Finalize

* A generation agent writes the resume.
* A separate evaluator scores it against the job and the candidate's source data.
* If it fails the quality bar, the evaluator's structured feedback goes back to the
  generator for a limited number of revisions.
* After *every* draft the grounding step restores the candidate's real facts and
  removes anything unsupported, so no revision can drift away from the source.
* Finalize picks the best draft: passing and fully grounded beats high-scoring but ungrounded.
"""
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from . import config
from .evaluator import EvaluationResult, ResumeEvaluator
from .generator import ResumeGenerator
from .grounding import build_source_index, ground_resume, sanitize_summary, text_violations
from .job_analysis import JobAnalysis, analyze_job
from .llm import LLMClient, model_name
from .prompts import pick_style_hint


class GenerationError(Exception):
    """The first draft could not be produced (model unavailable or unusable output)."""


@dataclass
class IterationRecord:
    iteration: int
    kind: str  # initial | revision | finalize
    evaluation: EvaluationResult
    repairs: List[dict] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        ev = self.evaluation
        return {
            "iteration": self.iteration,
            "kind": self.kind,
            "overall": ev.overall,
            "scores": ev.scores,
            "passed": ev.passed,
            "failed_dimensions": ev.failed_dimensions,
            "remaining_violations": ev.remaining_violations,
            "grounding_repairs": len(self.repairs),
            "issue_count": len(ev.issues),
        }


@dataclass
class AgentResult:
    resume: dict
    evaluation: EvaluationResult
    iterations: List[IterationRecord]
    analysis: JobAnalysis
    best_iteration: int
    metadata: Dict[str, Any]

    @property
    def passed(self) -> bool:
        return self.evaluation.passed

    def report(self) -> Dict[str, Any]:
        """Everything worth storing so different prompts, models and workflows can be compared."""
        return {
            **self.metadata,
            "passed": self.passed,
            "overall": self.evaluation.overall,
            "scores": self.evaluation.scores,
            "failed_dimensions": self.evaluation.failed_dimensions,
            "best_iteration": self.best_iteration,
            "iterations": [i.to_dict() for i in self.iterations],
            "diagnostics": self.evaluation.diagnostics,
            "issues": [i.to_dict() for i in self.evaluation.issues],
            "analysis": self.analysis.to_dict(),
        }

    def summary_for_client(self) -> Dict[str, Any]:
        """The small slice shown to the end user."""
        kw = self.evaluation.diagnostics.get("keywords", {})
        return {
            "overall_score": self.evaluation.overall,
            "passed": self.passed,
            "scores": self.evaluation.scores,
            "matched_keywords": kw.get("present", []),
            "missing_keywords": kw.get("missed_supported", []),
            "gaps": kw.get("unsupported_requirements", []),
            "revisions": max(0, len([i for i in self.iterations if i.kind == "revision"])),
        }


def _selection_key(record: "_Candidate"):
    ev = record.evaluation
    return (ev.passed, ev.remaining_violations == 0, ev.overall)


@dataclass
class _Candidate:
    iteration: int
    resume: dict
    evaluation: EvaluationResult


class ResumeAgent:
    def __init__(
        self,
        generator_llm: LLMClient,
        evaluator_llm: Optional[LLMClient] = None,
        max_revisions: int = config.MAX_REVISIONS,
        evaluator: Optional[ResumeEvaluator] = None,
        max_seconds: Optional[float] = config.MAX_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ):
        self.generator_llm = generator_llm
        self.generator = ResumeGenerator(generator_llm)
        self.evaluator_llm = evaluator_llm
        self.evaluator = evaluator or ResumeEvaluator(llm=evaluator_llm)
        self.max_revisions = max(0, max_revisions)
        self.max_seconds = max_seconds
        self.clock = clock

    def _out_of_time(self, started: float, last_call_seconds: float) -> bool:
        if self.max_seconds is None:
            return False
        return (self.clock() - started) + last_call_seconds > self.max_seconds

    def run(self, master: dict, job_description: str, seed: Optional[int] = None) -> AgentResult:
        started = self.clock()
        index = build_source_index(master)

        # 1. Analyze
        analysis = analyze_job(job_description, self.generator_llm)
        style_hint = pick_style_hint(master, job_description, seed)

        # 2. Generate (+ ground) and 3. Evaluate
        call_started = self.clock()
        try:
            raw = self.generator.generate(master, job_description, analysis, style_hint)
        except Exception as exc:  # network, rate limit, unusable output
            raise GenerationError(str(exc)) from exc
        last_call_seconds = self.clock() - call_started
        resume, repairs = ground_resume(raw, master, index)
        evaluation = self.evaluator.evaluate(resume, master, job_description, analysis, index, repairs)

        records = [IterationRecord(0, "initial", evaluation, repairs)]
        candidates = [_Candidate(0, resume, evaluation)]
        stopped_for_time = False

        # 4. Revise -> 5. Re-evaluate, a limited number of times
        for n in range(1, self.max_revisions + 1):
            if evaluation.passed:
                break
            if self._out_of_time(started, last_call_seconds):
                stopped_for_time = True
                break
            call_started = self.clock()
            try:
                raw = self.generator.generate(
                    master, job_description, analysis, style_hint,
                    previous=resume, feedback=evaluation.feedback_text(),
                )
            except Exception:
                break  # keep the best draft we already have
            last_call_seconds = self.clock() - call_started
            resume, repairs = ground_resume(raw, master, index)
            evaluation = self.evaluator.evaluate(resume, master, job_description, analysis, index, repairs)
            records.append(IterationRecord(n, "revision", evaluation, repairs))
            candidates.append(_Candidate(n, resume, evaluation))

        # 6. Finalize
        best = max(candidates, key=_selection_key)
        final_resume, final_eval = best.resume, best.evaluation
        if text_violations(final_resume.get("summary") or "", index):
            summary, fixes = sanitize_summary(final_resume["summary"], master, index)
            final_resume = {**final_resume, "summary": summary}
            final_eval = self.evaluator.evaluate(final_resume, master, job_description, analysis, index, fixes)
            records.append(IterationRecord(len(records), "finalize", final_eval, fixes))

        metadata = {
            "workflow_version": config.WORKFLOW_VERSION,
            "prompt_version": config.PROMPT_VERSION,
            "generator_model": model_name(self.generator_llm),
            "evaluator_model": model_name(self.evaluator_llm),
            "style_hint": style_hint,
            "max_revisions": self.max_revisions,
            "judge_used": final_eval.judge_used,
            "stopped_for_time": stopped_for_time,
            "elapsed_seconds": round(self.clock() - started, 2),
        }
        return AgentResult(
            resume=final_resume,
            evaluation=final_eval,
            iterations=records,
            analysis=analysis,
            best_iteration=best.iteration,
            metadata=metadata,
        )
