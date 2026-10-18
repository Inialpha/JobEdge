"""Entry point used by the API views to produce a tailored resume.

Runs the Analyze -> Generate -> Evaluate -> Revise -> Finalize loop and returns the resume
together with its evaluation. Setting RESUME_AGENT_ENABLED=false restores the previous
single-shot generator, so the feature can be switched off without a deploy.
"""
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from ai_services import model_config
from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.agent import GenerationError, ResumeAgent
from ai_services.resume_intelligence.llm import GroqLLM
from ai_services.resume_intelligence.trace import describe_error, log_stage

logger = logging.getLogger("api")


@dataclass
class GenerationOutcome:
    resume: Optional[dict]                 # None when the model could not produce a draft
    report: Optional[Dict[str, Any]] = None   # full evaluation report (stored)
    summary: Optional[Dict[str, Any]] = None  # small slice shown to the user
    used_agent: bool = False
    analysis: Any = None                   # job analysis, reused by the cover letter step
    error: Optional[Dict[str, Any]] = None  # why no resume was produced (kind, error type, status code)


def build_agent() -> ResumeAgent:
    generator = GroqLLM(model_config.generator_model())
    reviewer = GroqLLM(model_config.reviewer_model()) if config.REVIEW_MODE == "reviewer_revises" else None
    return ResumeAgent(generator, reviewer_llm=reviewer)


def generate_tailored_resume(job_description: str, master: dict) -> GenerationOutcome:
    from ai_services.resume_intelligence.trace import current_trace, start_trace

    if current_trace() == "-":  # called on its own (resume/generate endpoint), not from an application
        start_trace("resume")
    if not config.AGENT_ENABLED:
        from ai_services.resume_extractor import generate_resume  # legacy single-shot path

        return GenerationOutcome(resume=generate_resume(job_description, master), used_agent=False)

    try:
        result = build_agent().run(master, job_description)
    except GenerationError as exc:
        logger.warning("Resume generation failed: %s", exc)
        return GenerationOutcome(resume=None, used_agent=True, error=describe_error(exc))
    except Exception as exc:  # never let an evaluation bug take resume generation down
        logger.exception("Resume agent crashed")
        log_stage("resume", "CRASHED (bug in the pipeline, not the model)", logging.ERROR, **describe_error(exc))
        return GenerationOutcome(resume=None, used_agent=True, error={**describe_error(exc), "kind": "pipeline_bug"})

    return GenerationOutcome(
        resume=result.resume,
        report=result.report(),
        summary=result.summary_for_client(),
        used_agent=True,
        analysis=result.analysis,
    )


@dataclass
class LetterOutcome:
    text: Optional[str]                      # None when no letter could be produced
    report: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    used_agent: bool = False
    error: Optional[Dict[str, Any]] = None


def build_letter_agent():
    from ai_services.resume_intelligence.cover_letter_agent import CoverLetterAgent

    reviewer = GroqLLM(model_config.reviewer_model()) if config.REVIEW_MODE == "reviewer_revises" else None
    return CoverLetterAgent(GroqLLM(model_config.generator_model()), reviewer_llm=reviewer)


def generate_tailored_cover_letter(master: dict, tailored_resume: dict, job_description: str, analysis=None) -> LetterOutcome:
    """Write, evaluate and revise the cover letter for an application.

    ``master`` grounds and scores the letter; ``tailored_resume`` is what the model writes from.
    RESUME_AGENT_ENABLED=false falls back to the previous single-shot letter writer.
    """
    if not config.AGENT_ENABLED:
        from ai_services.cover_letters import generate_cover_letter  # legacy path

        return LetterOutcome(text=generate_cover_letter(tailored_resume, job_description), used_agent=False)
    try:
        result = build_letter_agent().run(master, job_description, analysis=analysis, prompt_resume=tailored_resume)
    except GenerationError as exc:
        logger.warning("Cover letter generation failed: %s", exc)
        return LetterOutcome(text=None, used_agent=True, error=describe_error(exc))
    except Exception as exc:
        logger.exception("Cover letter agent crashed")
        log_stage("letter", "CRASHED (bug in the pipeline, not the model)", logging.ERROR, **describe_error(exc))
        return LetterOutcome(text=None, used_agent=True, error={**describe_error(exc), "kind": "pipeline_bug"})
    return LetterOutcome(text=result.text, report=result.report(), summary=result.summary_for_client(), used_agent=True)
