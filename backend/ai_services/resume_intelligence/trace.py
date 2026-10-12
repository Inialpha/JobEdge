"""Stage-by-stage logging for the generation pipeline.

Every line goes to the ``api`` logger (console and ``logs/app.log``) in one greppable shape:

    [gen-3fa9c1] resume.draft0 llm_call ok seconds=2.31 prompt_chars=5120 response_chars=1840 ...

``gen-3fa9c1`` is a trace id shared by every line of one application creation, so one request can
be followed from the first model call to the final decision. Lines are short on purpose: model
responses are shortened to a preview (RESUME_LOG_PREVIEW_CHARS, default 200; set 0 to log no
content at all, since resumes contain personal data).
"""
import contextvars
import logging
import os
import re
import uuid
from typing import Any, Optional

logger = logging.getLogger("api")

PREVIEW_CHARS = int(os.getenv("RESUME_LOG_PREVIEW_CHARS", "200"))

_trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("generation_trace_id", default="-")
_stage: contextvars.ContextVar[str] = contextvars.ContextVar("generation_stage", default="-")


def start_trace(prefix: str = "gen") -> str:
    trace_id = f"{prefix}-{uuid.uuid4().hex[:6]}"
    _trace_id.set(trace_id)
    _stage.set("-")
    return trace_id


def current_trace() -> str:
    return _trace_id.get()


def set_stage(stage: str) -> None:
    """Name the step now running (e.g. ``resume.draft1``); model-call logs carry it."""
    _stage.set(stage)


def current_stage() -> str:
    return _stage.get()


def preview(text: Any, limit: Optional[int] = None) -> str:
    """A short single-line excerpt of ``text`` for logs."""
    limit = PREVIEW_CHARS if limit is None else limit
    if limit <= 0:
        return "<hidden>"
    flat = re.sub(r"\s+", " ", str(text or "")).strip()
    return flat if len(flat) <= limit else flat[:limit] + f"...(+{len(flat) - limit} chars)"


def _fmt(value: Any) -> str:
    if isinstance(value, float):
        return f"{value:.2f}"
    text = str(value)
    return f'"{text}"' if (" " in text or not text) else text


def log_stage(stage: str, event: str, level: int = logging.INFO, **fields: Any) -> None:
    pairs = " ".join(f"{k}={_fmt(v)}" for k, v in fields.items() if v is not None)
    logger.log(level, "[%s] %s %s %s", current_trace(), stage, event, pairs)


def describe_error(exc: BaseException) -> dict:
    """What went wrong, in a form that separates 'rate limited' from 'unusable output' from 'down'."""
    cause = exc.__cause__ or exc
    status = getattr(cause, "status_code", None)
    name = type(cause).__name__
    if status == 429 or "RateLimit" in name:
        kind = "rate_limited"
    elif isinstance(cause, ValueError):
        kind = "unusable_output"
    elif status is not None and int(status) >= 500 or "Connection" in name or "Timeout" in name:
        kind = "model_unavailable"
    else:
        kind = "error"
    info = {"kind": kind, "error_type": name, "status_code": status, "message": preview(str(cause), 160)}
    headers = getattr(getattr(cause, "response", None), "headers", None)
    if headers is not None:
        for key in ("retry-after", "x-ratelimit-remaining-requests", "x-ratelimit-remaining-tokens", "x-ratelimit-reset-tokens", "x-ratelimit-reset-requests"):
            try:
                if headers.get(key) is not None:
                    info[key.replace("x-ratelimit-", "").replace("-", "_")] = headers.get(key)
            except Exception:
                break
    return info


def log_evaluation(stage: str, evaluation, repairs: int = 0) -> None:
    """One line per scored draft: the verdict, the weakest dimensions and what was repaired."""
    scores = evaluation.scores or {}
    weakest = sorted(scores.items(), key=lambda kv: kv[1])[:3]
    log_stage(
        stage, "evaluated" if evaluation.passed else "evaluated (below bar)",
        overall=evaluation.overall, passed=evaluation.passed,
        failed=",".join(evaluation.failed_dimensions) or "none",
        weakest=",".join(f"{k}:{v:.2f}" for k, v in weakest),
        violations=evaluation.remaining_violations, grounding_repairs=repairs, issues=len(evaluation.issues),
    )
