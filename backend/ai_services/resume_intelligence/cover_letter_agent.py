"""Cover-letter agent loop: Generate -> Evaluate -> Revise -> Re-evaluate -> Finalize.

Same structure as the resume agent. The model writes only a greeting and body paragraphs; the
header (name, city and country, phone, email, date) and the sign-off are built from the
candidate's profile. After every draft the grounding step drops any sentence that states a
number, tool or name the sources do not support, and sentences that claim skills the job asks
for but the candidate lacks (first revision onward the model is told about these gaps up front).
"""
import datetime
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

from . import config
from .agent import GenerationError, IterationRecord, _Candidate, _selection_key
from .cover_letter_evaluator import CoverLetterEvaluator
from .cover_letter_generator import CoverLetterGenerator
from .cover_letter_grounding import ground_letter_body, job_gaps
from .cover_letter_text import build_header, compose_letter, normalise_model_paragraphs
from .evaluator import EvaluationResult
from .grounding import build_source_index
from .job_analysis import JobAnalysis, analyze_job
from .llm import LLMClient, model_name
from .prompts import pick_letter_style_hint
from .reviewer import CoverLetterReviewer
from .trace import describe_error, log_evaluation, log_stage, set_stage


@dataclass
class LetterResult:
    text: str
    evaluation: EvaluationResult
    iterations: List[IterationRecord]
    best_iteration: int
    metadata: Dict[str, Any]

    @property
    def passed(self) -> bool:
        return self.evaluation.passed

    def report(self) -> Dict[str, Any]:
        return {
            **self.metadata,
            "document_type": "cover_letter",
            "passed": self.passed,
            "overall": self.evaluation.overall,
            "scores": self.evaluation.scores,
            "failed_dimensions": self.evaluation.failed_dimensions,
            "best_iteration": self.best_iteration,
            "iterations": [i.to_dict() for i in self.iterations],
            "diagnostics": self.evaluation.diagnostics,
            "issues": [i.to_dict() for i in self.evaluation.issues],
        }

    def summary_for_client(self) -> Dict[str, Any]:
        return {
            "overall_score": self.evaluation.overall,
            "passed": self.passed,
            "scores": self.evaluation.scores,
            "revisions": len([i for i in self.iterations if i.kind in ("revision", "review")]),
        }


class CoverLetterAgent:
    def __init__(
        self,
        generator_llm: LLMClient,
        max_revisions: int = config.MAX_REVISIONS,
        evaluator: Optional[CoverLetterEvaluator] = None,
        max_seconds: Optional[float] = config.LETTER_MAX_SECONDS,
        clock: Callable[[], float] = time.monotonic,
        today: Optional[datetime.date] = None,
        reviewer_llm: Optional[LLMClient] = None,
        review_mode: Optional[str] = None,
    ):
        self.review_mode = review_mode or config.REVIEW_MODE
        if self.review_mode not in config.REVIEW_MODES:
            raise ValueError(f"RESUME_REVIEW_MODE must be one of {', '.join(config.REVIEW_MODES)} (got '{self.review_mode}')")
        self.reviewer_llm = reviewer_llm or generator_llm
        self.reviewer = CoverLetterReviewer(self.reviewer_llm)
        self.generator_llm = generator_llm
        self.generator = CoverLetterGenerator(generator_llm)
        self.evaluator = evaluator or CoverLetterEvaluator()
        self.max_revisions = max(0, max_revisions)
        self.max_seconds = max_seconds
        self.clock = clock
        self.today = today

    def _out_of_time(self, started: float, last_call_seconds: float) -> bool:
        return self.max_seconds is not None and (self.clock() - started) + last_call_seconds > self.max_seconds

    def run(
        self,
        master: dict,
        job_description: str,
        analysis: Optional[JobAnalysis] = None,
        seed: Optional[int] = None,
        prompt_resume: Optional[dict] = None,
    ) -> LetterResult:
        """``master`` is the source of truth for grounding and evaluation. ``prompt_resume`` (the
        tailored resume, a subset of master) is what the model writes from, so the letter matches it."""
        started = self.clock()
        log_stage("letter", "start", mode=self.review_mode, max_revisions=self.max_revisions, budget_seconds=self.max_seconds)
        index = build_source_index(master)
        job_index = build_source_index({"job": job_description})
        analysis = analysis or analyze_job(job_description, None)  # keywords found in code, no model call
        gaps = job_gaps(analysis, index, job_description)
        log_stage("letter.analyze", "done", source=analysis.source, gaps=",".join(gaps) or "none")
        style_hint = pick_letter_style_hint(master, job_description, seed)
        pi = master.get("personal_information") or {}
        name = str(pi.get("name") or master.get("name") or "").strip()
        header = build_header(pi, self.today)
        shown = prompt_resume or master

        def assemble(raw: dict):
            greeting, paragraphs = normalise_model_paragraphs(raw.get("greeting"), raw.get("paragraphs"), name)
            paragraphs, repairs = ground_letter_body(paragraphs, index, job_index, gaps, drop_gap_claims=True)
            return compose_letter(header, greeting, paragraphs, name), paragraphs, repairs

        call_started = self.clock()
        set_stage("letter.draft0")
        try:
            raw = self.generator.generate(shown, job_description, analysis, style_hint, gaps)
        except Exception as exc:
            log_stage("letter.draft0", "first draft FAILED, giving up", logging.ERROR, **describe_error(exc))
            raise GenerationError(str(exc)) from exc
        last_call_seconds = self.clock() - call_started
        text, paragraphs, repairs = assemble(raw)
        evaluation = self.evaluator.evaluate(text, master, job_description, analysis, index, repairs, gaps)
        log_evaluation("letter.draft0", evaluation, len(repairs))

        records = [IterationRecord(0, "initial", evaluation, repairs)]
        candidates = [_LetterCandidate(0, text, evaluation)]
        stopped_for_time = False

        # reviewer_revises: the evaluator reads the draft and the job, and rewrites the letter itself (one call).
        reviewer_mode = self.review_mode == "reviewer_revises"
        if reviewer_mode:
            if self._out_of_time(started, last_call_seconds):
                stopped_for_time = True
                log_stage("letter", "review skipped: time budget used", elapsed=self.clock() - started, budget=self.max_seconds)
            else:
                set_stage("letter.review")
                log_stage("letter.review", "reviewer rewriting", failed=",".join(evaluation.failed_dimensions) or "none")
                try:
                    raw = self.reviewer.review(shown, job_description, gaps, paragraphs, evaluation.feedback_text())
                except Exception as exc:
                    log_stage("letter.review", "review FAILED, keeping the writer's draft", logging.WARNING, **describe_error(exc))
                else:
                    text, paragraphs, repairs = assemble(raw)
                    evaluation = self.evaluator.evaluate(text, master, job_description, analysis, index, repairs, gaps)
                    log_evaluation("letter.review", evaluation, len(repairs))
                    records.append(IterationRecord(1, "review", evaluation, repairs))
                    candidates.append(_LetterCandidate(1, text, evaluation))

        for n in range(1, (0 if reviewer_mode else self.max_revisions) + 1):
            if evaluation.passed:
                log_stage("letter", "no revision needed", passed_at=n - 1)
                break
            if self._out_of_time(started, last_call_seconds):
                stopped_for_time = True
                log_stage("letter", "revision skipped: time budget used", elapsed=self.clock() - started, budget=self.max_seconds)
                break
            call_started = self.clock()
            set_stage(f"letter.draft{n}")
            log_stage(f"letter.draft{n}", "revising", failed=",".join(evaluation.failed_dimensions))
            try:
                raw = self.generator.generate(
                    shown, job_description, analysis, style_hint, gaps,
                    previous=paragraphs, feedback=evaluation.feedback_text(),
                )
            except Exception as exc:
                log_stage(f"letter.draft{n}", "revision FAILED, keeping best draft so far", logging.WARNING, **describe_error(exc))
                break
            last_call_seconds = self.clock() - call_started
            text, paragraphs, repairs = assemble(raw)
            evaluation = self.evaluator.evaluate(text, master, job_description, analysis, index, repairs, gaps)
            log_evaluation(f"letter.draft{n}", evaluation, len(repairs))
            records.append(IterationRecord(n, "revision", evaluation, repairs))
            candidates.append(_LetterCandidate(n, text, evaluation))

        best = max(candidates, key=lambda c: _selection_key(c) + (c.iteration,))  # a tie goes to the reviewed letter
        if not any(c.evaluation.diagnostics.get("paragraphs") for c in candidates):
            log_stage("letter", "no usable paragraphs in any draft", logging.ERROR)
            raise GenerationError("The model returned no usable letter paragraphs")
        log_stage(
            "letter", "finished", best_draft=best.iteration, drafts=len(candidates), passed=best.evaluation.passed,
            overall=best.evaluation.overall, stopped_for_time=stopped_for_time, elapsed=self.clock() - started,
        )
        metadata = {
            "workflow_version": config.WORKFLOW_VERSION,
            "prompt_version": config.LETTER_PROMPT_VERSION,
            "generator_model": model_name(self.generator_llm),
            "review_mode": self.review_mode,
            "evaluator_model": model_name(self.reviewer_llm) if reviewer_mode else "none",
            "style_hint": style_hint,
            "max_revisions": self.max_revisions,
            "judge_used": False,
            "stopped_for_time": stopped_for_time,
            "elapsed_seconds": round(self.clock() - started, 2),
        }
        return LetterResult(best.text, best.evaluation, records, best.iteration, metadata)


@dataclass
class _LetterCandidate:
    iteration: int
    text: str
    evaluation: EvaluationResult
