"""Minimal LLM interface so the agent loop can be tested without network access."""
import logging
import time
from typing import Optional, Protocol

from .trace import current_stage, describe_error, log_stage, preview


class LLMClient(Protocol):
    """Anything with ``complete`` can drive the generator or the evaluator."""

    model: str

    def complete(self, system: str, user: str, temperature: float = 0.0) -> str:
        ...


class GroqLLM:
    """Groq chat-completion client. The SDK client is created lazily so importing
    this module never requires an API key."""

    def __init__(self, model: str, client=None):
        self.model = model
        self._client = client

    @property
    def client(self):
        if self._client is None:
            from groq import Groq

            self._client = Groq()
        return self._client

    def complete(self, system: str, user: str, temperature: float = 0.0) -> str:
        kwargs = dict(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            top_p=1,
            stream=False,
        )
        stage = current_stage()
        started = time.monotonic()
        try:
            try:
                # JSON mode makes malformed output much less likely (every prompt asks for JSON).
                completion = self.client.chat.completions.create(response_format={"type": "json_object"}, **kwargs)
            except Exception as exc:
                # Rate limits and outages must surface unchanged; only retry when JSON mode itself
                # was rejected (a 400 for this model).
                if getattr(exc, "status_code", None) != 400:
                    raise
                log_stage(stage, "llm_call json_mode_rejected_retrying", logging.WARNING, **describe_error(exc))
                completion = self.client.chat.completions.create(**kwargs)
        except Exception as exc:
            log_stage(
                stage, "llm_call FAILED", logging.WARNING,
                model=self.model, seconds=time.monotonic() - started, prompt_chars=len(system) + len(user), **describe_error(exc),
            )
            raise
        content = (completion.choices[0].message.content or "").strip()
        usage = getattr(completion, "usage", None)
        log_stage(
            stage, "llm_call ok",
            model=self.model, seconds=time.monotonic() - started,
            prompt_chars=len(system) + len(user), response_chars=len(content),
            finish_reason=getattr(completion.choices[0], "finish_reason", None),
            tokens_in=getattr(usage, "prompt_tokens", None), tokens_out=getattr(usage, "completion_tokens", None),
            preview=preview(content),
        )
        return content


def model_name(llm: Optional[LLMClient]) -> str:
    return getattr(llm, "model", "none") if llm is not None else "none"
