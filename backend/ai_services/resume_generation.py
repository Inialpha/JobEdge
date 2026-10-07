"""Entry point used by the API views to produce a tailored resume.

Runs the Analyze -> Generate -> Evaluate -> Revise -> Finalize loop and returns the resume
together with its evaluation. Setting RESUME_AGENT_ENABLED=false restores the previous
single-shot generator, so the feature can be switched off without a deploy.
"""
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.agent import GenerationError, ResumeAgent
from ai_services.resume_intelligence.llm import GroqLLM

logger = logging.getLogger("api")


@dataclass
class GenerationOutcome:
    resume: Optional[dict]                 # None when the model could not produce a draft
    report: Optional[Dict[str, Any]] = None   # full evaluation report (stored)
    summary: Optional[Dict[str, Any]] = None  # small slice shown to the user
    used_agent: bool = False


def build_agent() -> ResumeAgent:
    generator = GroqLLM(config.GENERATOR_MODEL)
    judge = GroqLLM(config.EVALUATOR_MODEL) if config.JUDGE_ENABLED else None
    return ResumeAgent(generator, evaluator_llm=judge)


def generate_tailored_resume(job_description: str, master: dict) -> GenerationOutcome:
    if not config.AGENT_ENABLED:
        from ai_services.resume_extractor import generate_resume  # legacy single-shot path

        return GenerationOutcome(resume=generate_resume(job_description, master), used_agent=False)

    try:
        result = build_agent().run(master, job_description)
    except GenerationError as exc:
        logger.warning("Resume generation failed: %s", exc)
        return GenerationOutcome(resume=None, used_agent=True)
    except Exception:  # never let an evaluation bug take resume generation down
        logger.exception("Resume agent crashed")
        return GenerationOutcome(resume=None, used_agent=True)

    return GenerationOutcome(
        resume=result.resume,
        report=result.report(),
        summary=result.summary_for_client(),
        used_agent=True,
    )
