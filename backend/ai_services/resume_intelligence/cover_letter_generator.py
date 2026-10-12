"""The letter-writing agent: drafts the body of a cover letter, or revises one using evaluator feedback."""
from dataclasses import dataclass
from typing import List, Optional

from . import config
from .generator import prompt_master
from .job_analysis import JobAnalysis
from .json_utils import parse_model_json
from .llm import LLMClient
from .prompts import LETTER_SYSTEM, build_letter_prompt, build_letter_revise_prompt


@dataclass
class LetterDraft:
    greeting: str
    paragraphs: List[str]
    raw_greeting: Optional[str] = None


class CoverLetterGenerator:
    def __init__(self, llm: LLMClient, temperature: float = config.GENERATOR_TEMPERATURE):
        self.llm = llm
        self.temperature = temperature

    def generate(
        self,
        master: dict,
        job_description: str,
        analysis: JobAnalysis,
        style_hint: str,
        gaps: List[str],
        previous: Optional[List[str]] = None,
        feedback: Optional[str] = None,
    ) -> dict:
        shown = prompt_master(master)
        if previous is None:
            user, temperature = build_letter_prompt(shown, job_description, analysis, style_hint, gaps), self.temperature
        else:
            user = build_letter_revise_prompt(shown, job_description, analysis, style_hint, gaps, previous, feedback or "")
            temperature = max(0.2, self.temperature - 0.2)
        return parse_model_json(self.llm.complete(LETTER_SYSTEM, user, temperature=temperature))
