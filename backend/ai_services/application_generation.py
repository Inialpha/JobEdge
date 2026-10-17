"""Documents for a new job application: a tailored resume AND a cover letter.

Both go through the evaluation agent. The resume agent analyzes the job, generates, evaluates,
revises and finalizes; the cover letter agent then does the same for the letter, reusing the
job analysis and writing from the final tailored resume while being grounded in and scored
against the candidate's master resume. This module has no Django imports so the whole
workflow can be tested without a database.
"""
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional

from .resume_intelligence.trace import log_stage, start_trace
from .resume_generation import (
    GenerationOutcome,
    LetterOutcome,
    generate_tailored_cover_letter,
    generate_tailored_resume,
)


class DocumentsUnavailable(Exception):
    """A document could not be produced (model busy or unusable output). ``stage`` says which."""

    def __init__(self, stage: str, error=None, trace_id: str = "-"):
        super().__init__(f"{stage} could not be generated")
        self.stage = stage
        self.error = error or {}
        self.trace_id = trace_id

    def to_dict(self) -> dict:
        """Safe to show to the client: where it broke and why, nothing from the documents."""
        return {"failed_stage": self.stage, "reason": self.error.get("kind", "error"), "error_type": self.error.get("error_type"), "status_code": self.error.get("status_code"), "trace_id": self.trace_id}


@dataclass
class ApplicationDocuments:
    resume: dict
    cover_letter: str
    resume_outcome: GenerationOutcome
    letter_outcome: LetterOutcome

    def evaluation_summary(self) -> Dict[str, Any]:
        """What the client is told about the checks that were run on each document."""
        return {
            "resume": self.resume_outcome.summary,
            "cover_letter": self.letter_outcome.summary,
        }


def generate_application_documents(
    job_description: str,
    master: dict,
    resume_fn: Callable[[str, dict], GenerationOutcome] = generate_tailored_resume,
    letter_fn: Callable[..., LetterOutcome] = generate_tailored_cover_letter,
) -> ApplicationDocuments:
    trace_id = start_trace("app")
    started = time.monotonic()
    log_stage("application", "start", job_chars=len(job_description or ""))

    resume_outcome = resume_fn(job_description, master)
    if not resume_outcome.resume:
        log_stage("application", "ABORTED at resume", logging.ERROR, **(resume_outcome.error or {}), elapsed=time.monotonic() - started)
        raise DocumentsUnavailable("resume", resume_outcome.error, trace_id)

    letter_outcome = letter_fn(master, resume_outcome.resume, job_description, analysis=resume_outcome.analysis)
    if not letter_outcome.text:
        log_stage("application", "ABORTED at cover_letter (resume was generated but is discarded)", logging.ERROR, **(letter_outcome.error or {}), elapsed=time.monotonic() - started)
        raise DocumentsUnavailable("cover_letter", letter_outcome.error, trace_id)

    log_stage(
        "application", "documents ready", elapsed=time.monotonic() - started,
        resume_passed=(resume_outcome.summary or {}).get("passed"), letter_passed=(letter_outcome.summary or {}).get("passed"),
    )
    return ApplicationDocuments(
        resume=resume_outcome.resume,
        cover_letter=letter_outcome.text,
        resume_outcome=resume_outcome,
        letter_outcome=letter_outcome,
    )
