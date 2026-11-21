"""The reviewing "senior": reads the writer's draft, the job and the master resume, and rewrites it.

Used when RESUME_REVIEW_MODE=reviewer_revises. One call per document; the result is grounded and
scored exactly like the writer's draft, and the better of the two is kept.
"""
from typing import List

from . import config
from .generator import prompt_master
from .json_utils import parse_model_json
from .llm import LLMClient
from .prompts import LETTER_REVIEW_SYSTEM, REVIEW_SYSTEM, build_letter_review_prompt, build_review_prompt


class ResumeReviewer:
    def __init__(self, llm: LLMClient, temperature: float = config.EVALUATOR_TEMPERATURE):
        self.llm = llm
        self.temperature = temperature

    def review(self, master: dict, job_description: str, draft: dict, feedback: str) -> dict:
        user = build_review_prompt(prompt_master(master), job_description, draft, feedback)
        return parse_model_json(self.llm.complete(REVIEW_SYSTEM, user, temperature=self.temperature))


class CoverLetterReviewer:
    def __init__(self, llm: LLMClient, temperature: float = config.EVALUATOR_TEMPERATURE):
        self.llm = llm
        self.temperature = temperature

    def review(self, master: dict, job_description: str, gaps: List[str], paragraphs: List[str], feedback: str) -> dict:
        user = build_letter_review_prompt(prompt_master(master), job_description, gaps, paragraphs, feedback)
        return parse_model_json(self.llm.complete(LETTER_REVIEW_SYSTEM, user, temperature=self.temperature))
