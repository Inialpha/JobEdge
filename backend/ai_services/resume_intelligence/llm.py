"""Minimal LLM interface so the agent loop can be tested without network access."""
from typing import Optional, Protocol


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
        try:
            # JSON mode makes malformed output much less likely (every prompt asks for JSON).
            completion = self.client.chat.completions.create(response_format={"type": "json_object"}, **kwargs)
        except Exception as exc:
            # Rate limits and outages must surface unchanged; only retry when JSON mode itself
            # was rejected (a 400 for this model).
            if getattr(exc, "status_code", None) != 400:
                raise
            completion = self.client.chat.completions.create(**kwargs)
        return (completion.choices[0].message.content or "").strip()


def model_name(llm: Optional[LLMClient]) -> str:
    return getattr(llm, "model", "none") if llm is not None else "none"
