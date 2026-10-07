"""A small, repeatable benchmark so prompt, model and workflow changes can be compared.

Each case is a Master Resume + Job Description (see ``benchmarks/cases.json``) with a
hand-written reference tailoring. The same cases and the same scoring rules are used
for every candidate workflow:

    report_a = run_benchmark(my_workflow_a)
    report_b = run_benchmark(my_workflow_b)
    compare_reports(report_a, report_b)

A *workflow* is any callable ``(master_resume, job_description) -> resume_dict``.
Whatever it returns is re-scored here by one fixed evaluator, so a workflow cannot
grade its own homework. By default the scoring is deterministic and offline
(``ResumeEvaluator(llm=None)``) which makes results repeatable.
"""
import copy
import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from . import config
from .evaluator import ResumeEvaluator
from .grounding import build_source_index, ground_resume
from .job_analysis import analyze_job

CASES_PATH = Path(__file__).parent / "benchmarks" / "cases.json"

Workflow = Callable[[dict, str], dict]


def load_cases(path: Optional[Path] = None) -> List[dict]:
    with open(path or CASES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def build_reference_resume(case: dict) -> dict:
    """Assemble the hand-written reference tailoring on top of the master resume's real facts."""
    master, ref = copy.deepcopy(case["master_resume"]), copy.deepcopy(case["reference"])  # never share lists with the case data
    experiences = []
    for exp in master["professional_experiences"]:
        bullets = ref["experience_bullets"].get(exp["organization"])
        if bullets:
            entry = copy.deepcopy(exp)
            entry["responsibilities"] = bullets
            experiences.append(entry)
    projects = []
    for proj in master["projects"]:
        description = ref["projects"].get(proj["name"])
        if description:
            projects.append({**proj, "description": description})
    certifications = [c for c in master.get("certifications", []) if c["name"] in ref.get("certifications", [])]
    return {
        "keywords": master.get("keywords", []),
        "name": master["personal_information"].get("name", ""),
        "email": master["personal_information"].get("email", ""),
        "summary": ref["summary"],
        "personal_information": master["personal_information"],
        "professional_experiences": experiences,
        "skills": ref["skills"],
        "projects": projects,
        "educations": copy.deepcopy(master["educations"]),
        "certifications": certifications,
        "awards": [],
        "languages": master.get("languages", []),
    }


def reference_workflow(cases: Optional[List[dict]] = None) -> Workflow:
    """A workflow that returns the hand-written reference (used to calibrate the evaluator)."""
    by_jd = {c["job_description"]: c for c in (cases or load_cases())}
    return lambda master, jd: build_reference_resume(by_jd[jd])


def passthrough_workflow(master: dict, job_description: str) -> dict:
    """Naive baseline: return the master resume untouched (no tailoring at all)."""
    out = copy.deepcopy(master)
    out["name"] = master.get("personal_information", {}).get("name", "")
    out["email"] = master.get("personal_information", {}).get("email", "")
    return out


def agent_workflow(agent) -> Workflow:
    """Adapt a ``ResumeAgent`` to the benchmark's workflow signature.

    Returns ``(resume, stats)``. The stats record how much repairing the loop had to do, so a
    model that needs constant correction scores worse than one that is right the first time.
    """

    def run(master: dict, job_description: str):
        result = agent.run(master, job_description)
        stats = {
            "agent_grounding_repairs": sum(len(i.repairs) for i in result.iterations),
            "revisions": sum(1 for i in result.iterations if i.kind == "revision"),
            "elapsed_seconds": result.metadata.get("elapsed_seconds", 0.0),
        }
        return result.resume, stats

    return run


def run_benchmark(
    workflow: Workflow,
    cases: Optional[List[dict]] = None,
    evaluator: Optional[ResumeEvaluator] = None,
    label: str = "",
) -> Dict[str, Any]:
    cases = cases if cases is not None else load_cases()
    evaluator = evaluator or ResumeEvaluator(llm=None)
    results = []
    for case in cases:
        master, jd = case["master_resume"], case["job_description"]
        output = workflow(copy.deepcopy(master), jd)
        raw, stats = output if isinstance(output, tuple) else (output, {})
        index = build_source_index(master)
        # Same step the production loop applies, so every workflow is judged on facts-only output.
        resume, repairs = ground_resume(raw, master, index)
        analysis = analyze_job(jd, llm=None)
        ev = evaluator.evaluate(resume, master, jd, analysis, index, repairs)
        results.append({
            "case_id": case["id"],
            "overall": ev.overall,
            "scores": ev.scores,
            "passed": ev.passed,
            "failed_dimensions": ev.failed_dimensions,
            "remaining_violations": ev.remaining_violations,
            "grounding_repairs": len(repairs) + stats.get("agent_grounding_repairs", 0),
            "revisions": stats.get("revisions", 0),
            "elapsed_seconds": stats.get("elapsed_seconds", 0.0),
            "transformation_ratio": ev.diagnostics["bullets"]["transformation_ratio"],
            "keyword_coverage": ev.diagnostics["keywords"]["coverage"],
        })

    dims = list(config.WEIGHTS)
    n = len(results) or 1
    return {
        "label": label,
        "workflow_version": config.WORKFLOW_VERSION,
        "prompt_version": config.PROMPT_VERSION,
        "cases": results,
        "aggregate": {
            "mean_overall": round(sum(r["overall"] for r in results) / n, 4),
            "pass_rate": round(sum(1 for r in results if r["passed"]) / n, 4),
            "mean_scores": {d: round(sum(r["scores"][d] for r in results) / n, 4) for d in dims},
            "total_grounding_repairs": sum(r["grounding_repairs"] for r in results),
            "total_violations": sum(r["remaining_violations"] for r in results),
            "mean_revisions": round(sum(r["revisions"] for r in results) / n, 2),
            "mean_elapsed_seconds": round(sum(r["elapsed_seconds"] for r in results) / n, 2),
        },
    }


def compare_reports(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    """Difference ``b - a`` per dimension; positive means ``b`` is better."""
    agg_a, agg_b = a["aggregate"], b["aggregate"]
    return {
        "a": a.get("label", "a"),
        "b": b.get("label", "b"),
        "overall_delta": round(agg_b["mean_overall"] - agg_a["mean_overall"], 4),
        "pass_rate_delta": round(agg_b["pass_rate"] - agg_a["pass_rate"], 4),
        "dimension_deltas": {
            d: round(agg_b["mean_scores"][d] - agg_a["mean_scores"][d], 4) for d in agg_a["mean_scores"]
        },
        "repairs_delta": agg_b["total_grounding_repairs"] - agg_a["total_grounding_repairs"],
        "winner": b.get("label", "b") if agg_b["mean_overall"] > agg_a["mean_overall"] else a.get("label", "a"),
    }


def save_report(report: Dict[str, Any], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
