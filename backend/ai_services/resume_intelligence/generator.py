"""The generation agent: writes a tailored resume draft, or revises one using evaluator feedback."""
from typing import Optional

from . import config
from .job_analysis import JobAnalysis
from .json_utils import parse_model_json
from .llm import LLMClient
from .prompts import GENERATE_SYSTEM, SINGLE_SYSTEM, build_generate_prompt, build_revise_prompt, build_single_prompt

_DROP_KEYS = {"id", "user", "text", "created_at", "updated_at", "is_master", "evaluation"}


_CONTACT_KEYS = {"email", "phone", "phone_number", "address", "linkedin", "website", "github", "portfolio"}


def prompt_master(master: dict) -> dict:
    """The master resume as shown to the model: no internal ids, raw text or contact details.

    Contact details are never taken from the model (they are copied from the master resume), so
    sending them would only cost tokens. The name and profession stay.
    """
    shown = {k: v for k, v in (master or {}).items() if k not in _DROP_KEYS}
    pi = shown.get("personal_information")
    if isinstance(pi, dict):
        shown["personal_information"] = {k: v for k, v in pi.items() if k not in _CONTACT_KEYS}
    return shown


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
        return parse_model_json(raw)

    def generate_single(self, master: dict, job_description: str) -> dict:
        """One call writes the whole resume (tasks in order, summary last). The teaching material is in the system prompt."""
        user = build_single_prompt(prompt_master(master), job_description)
        return parse_model_json(self.llm.complete(SINGLE_SYSTEM, user, temperature=self.temperature))
