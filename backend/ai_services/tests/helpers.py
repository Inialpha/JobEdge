"""Shared test helpers: a scripted LLM and resume variants built from the benchmark cases."""
import copy
import json
from typing import Callable, List, Optional

from ai_services.resume_intelligence.benchmark import build_reference_resume, load_cases, passthrough_workflow
from ai_services.resume_intelligence.prompts import ANALYZE_SYSTEM, GENERATE_SYSTEM, JUDGE_SYSTEM, LETTER_REVIEW_SYSTEM, LETTER_SYSTEM, REVIEW_SYSTEM

CASES = {c["id"]: c for c in load_cases()}
BACKEND = CASES["backend_engineer"]


class ScriptedLLM:
    """Plays back generation drafts in order. Analysis and judge replies are optional;
    when omitted they raise, which exercises the fallbacks."""

    model = "scripted"

    def __init__(self, generations: Optional[List] = None, judge: Optional[dict] = None, analysis: Optional[dict] = None,
                 generation_fn: Optional[Callable[[str], dict]] = None, letters: Optional[List] = None,
                 reviews: Optional[List] = None, letter_reviews: Optional[List] = None):
        self.reviews, self.letter_reviews = list(reviews or []), list(letter_reviews or [])
        self.review_prompts: List[str] = []
        self.review_calls = 0
        self.analysis_calls = 0
        self.letters = list(letters or [])
        self.letter_prompts: List[str] = []
        self.letter_calls = 0
        self.generations = list(generations or [])
        self.judge = judge
        self.analysis = analysis
        self.generation_fn = generation_fn
        self.generate_prompts: List[str] = []
        self.generate_calls = 0

    def complete(self, system: str, user: str, temperature: float = 0.0) -> str:
        if system == ANALYZE_SYSTEM:
            self.analysis_calls += 1
            if self.analysis is None:
                raise RuntimeError("analysis unavailable")
            return json.dumps(self.analysis)
        if system == JUDGE_SYSTEM:
            if self.judge is None:
                raise RuntimeError("judge unavailable")
            return json.dumps(self.judge)
        if system in (REVIEW_SYSTEM, LETTER_REVIEW_SYSTEM):
            self.review_calls += 1
            self.review_prompts.append(user)
            queue = self.reviews if system == REVIEW_SYSTEM else self.letter_reviews
            if not queue:
                raise RuntimeError("no scripted review")
            item = queue.pop(0) if len(queue) > 1 else queue[0]
            if isinstance(item, Exception):
                raise item
            return json.dumps(item)
        if system == LETTER_SYSTEM:
            self.letter_calls += 1
            self.letter_prompts.append(user)
            if not self.letters:
                raise RuntimeError("no more scripted letters")
            item = self.letters.pop(0) if len(self.letters) > 1 else self.letters[0]
            if isinstance(item, Exception):
                raise item
            return json.dumps(item)
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


GOLD_LETTER = {
    "greeting": "Dear Hiring Manager,",
    "paragraphs": [
        "Building payment APIs that stay fast under load is the work I enjoy most, which is why the Backend Engineer role on your payments team caught my attention. At Brightline Payments I build REST APIs in Python and Django that process 15,000 payment requests per day, and I have spent the last few years making them quicker and easier to trust.",
        "One example I am proud of is the response-time work. By adding Redis caching and tuning slow SQL queries, I brought average API response time down from 800ms to 320ms. I also raised test coverage from 45% to 85% by writing unit and integration tests with pytest, so that later changes shipped with far less risk.",
        "Reliable delivery matters as much as clean code. I set up CI pipelines with GitHub Actions that run the tests and deploy to AWS on every merge, and I mentored two junior developers through code reviews and pair programming. Earlier, at Nova Retail Tech, I kept a PostgreSQL database healthy and built dashboards that 40 store managers used each day.",
        "Your focus on scaling payments is exactly the kind of problem I want to keep solving. I would welcome a conversation about how my experience with Django, Docker and automated testing could help your team, and I thank you for considering my application.",
    ],
}

BAD_LETTER = {
    "greeting": "Dear Hiring Manager,",
    "paragraphs": [
        "I am writing to express my interest in this position. I am a passionate team player and the ideal candidate.",
        "I scaled systems to 2,000,000 users with Kubernetes and Terraform and cut costs by 62%.",
        "I look forward to hearing from you.",
    ],
}
