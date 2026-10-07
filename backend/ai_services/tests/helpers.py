"""Shared test helpers: a scripted LLM and resume variants built from the benchmark cases."""
import copy
import json
from typing import Callable, List, Optional

from ai_services.resume_intelligence.benchmark import build_reference_resume, load_cases, passthrough_workflow
from ai_services.resume_intelligence.prompts import ANALYZE_SYSTEM, GENERATE_SYSTEM, JUDGE_SYSTEM

CASES = {c["id"]: c for c in load_cases()}
BACKEND = CASES["backend_engineer"]


class ScriptedLLM:
    """Plays back generation drafts in order. Analysis and judge replies are optional;
    when omitted they raise, which exercises the fallbacks."""

    model = "scripted"

    def __init__(self, generations: Optional[List] = None, judge: Optional[dict] = None, analysis: Optional[dict] = None,
                 generation_fn: Optional[Callable[[str], dict]] = None):
        self.generations = list(generations or [])
        self.judge = judge
        self.analysis = analysis
        self.generation_fn = generation_fn
        self.generate_prompts: List[str] = []
        self.generate_calls = 0

    def complete(self, system: str, user: str, temperature: float = 0.0) -> str:
        if system == ANALYZE_SYSTEM:
            if self.analysis is None:
                raise RuntimeError("analysis unavailable")
            return json.dumps(self.analysis)
        if system == JUDGE_SYSTEM:
            if self.judge is None:
                raise RuntimeError("judge unavailable")
            return json.dumps(self.judge)
        assert system == GENERATE_SYSTEM
        self.generate_calls += 1
        self.generate_prompts.append(user)
        if self.generation_fn:
            return json.dumps(self.generation_fn(user))
        if not self.generations:
            raise RuntimeError("no more scripted drafts")
        # play drafts in order; the last one repeats if the agent asks for more
        item = self.generations.pop(0) if len(self.generations) > 1 else self.generations[0]
        if isinstance(item, Exception):
            raise item
        return json.dumps(item)


def gold(case_id: str = "backend_engineer") -> dict:
    return build_reference_resume(CASES[case_id])


def copied(case_id: str = "backend_engineer") -> dict:
    return passthrough_workflow(copy.deepcopy(CASES[case_id]["master_resume"]), CASES[case_id]["job_description"])


def hallucinated(case_id: str = "backend_engineer") -> dict:
    """The reference tailoring plus fabricated numbers, tools, an employer and a certification."""
    resume = gold(case_id)
    resume["summary"] += " Scaled platforms to 2,000,000 users using Kubernetes."
    resume["professional_experiences"][0]["responsibilities"][0] = "Led a team of 25 engineers and cut cloud costs by 62% with Terraform."
    resume["professional_experiences"].append({
        "organization": "Globex Corporation", "role": "Staff Engineer", "start_date": "2015", "end_date": "2018",
        "location": "Remote", "responsibilities": ["Designed distributed systems."],
    })
    resume["skills"][0]["skills"] += ["Kubernetes", "Kafka"]
    resume["certifications"].append({"name": "Certified Kubernetes Administrator", "issuer": "CNCF", "year": "2023"})
    return resume


def all_bullets(resume: dict) -> List[str]:
    out = []
    for exp in resume["professional_experiences"]:
        out.extend(exp["responsibilities"])
    for proj in resume.get("projects", []):
        out.append(proj["description"])
    return out
