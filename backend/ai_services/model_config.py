"""The only place model names are read. Nothing else in the project names a model.

Set these in the environment (or the .env file); there are deliberately no defaults:

    RESUME_GENERATOR_MODEL     writes tailored resumes and cover letters (also the older single-shot writers)
    RESUME_EVALUATOR_MODEL     the reviewing "senior" that checks and rewrites drafts (falls back to the generator's model if unset)
    RESUME_EXTRACTION_MODEL    turns an uploaded resume's text into structured data
    JOB_EXTRACTION_MODEL       turns a job posting into structured data

A getter raises ``ModelNotConfigured`` naming the missing variable when it is called, so the app still
starts without it and the error says exactly what to set.
"""
import os

from dotenv import load_dotenv

load_dotenv()


class ModelNotConfigured(RuntimeError):
    pass


def _read(variable: str) -> str:
    return os.getenv(variable, "").strip()


def _require(variable: str) -> str:
    value = _read(variable)
    if not value:
        raise ModelNotConfigured(f"The {variable} environment variable is not set. Set it to the model name to use.")
    return value


def generator_model() -> str:
    return _require("RESUME_GENERATOR_MODEL")


def evaluator_model() -> str:
    return _require("RESUME_EVALUATOR_MODEL")


def reviewer_model() -> str:
    """The evaluator that reviews and rewrites: RESUME_EVALUATOR_MODEL, or the generator's model if that is unset."""
    return _read("RESUME_EVALUATOR_MODEL") or generator_model()


def resume_extraction_model() -> str:
    return _require("RESUME_EXTRACTION_MODEL")


def job_extraction_model() -> str:
    return _require("JOB_EXTRACTION_MODEL")
