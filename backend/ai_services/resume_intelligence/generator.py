"""The generation agent: writes a tailored resume draft, or revises one using evaluator feedback."""
from typing import Optional

from . import config
from .job_analysis import JobAnalysis
from .json_utils import extract_json_dict
from .llm import LLMClient
from .prompts import GENERATE_SYSTEM, build_generate_prompt, build_revise_prompt

_DROP_KEYS = {"id", "user", "text", "created_at", "updated_at", "is_master", "evaluation"}


def prompt_master(master: dict) -> dict:
    """The master resume as shown to the model (no internal ids or raw text)."""
    return {k: v for k, v in (master or {}).items() if k not in _DROP_KEYS}


class ResumeGenerator:
    def __init__(self, llm: LLMClient, temperature: float = config.GENERATOR_TEMPERATURE):
        self.llm = llm
        self.temperature = temperature

    def generate(
        self,
        master: dict,
        job_description: str,
        analysis: JobAnalysis,
        style_hint: str,
        previous: Optional[dict] = None,
        feedback: Optional[str] = None,
    ) -> dict:
        shown = prompt_master(master)
        if previous is None:
            user = build_generate_prompt(shown, job_description, analysis, style_hint)
            temperature = self.temperature
        else:
            user = build_revise_prompt(shown, job_description, analysis, style_hint, previous, feedback or "")
            temperature = max(0.2, self.temperature - 0.2)  # revisions should be more conservative
        raw = self.llm.complete(GENERATE_SYSTEM, user, temperature=temperature)
        return extract_json_dict(raw)
