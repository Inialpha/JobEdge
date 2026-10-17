import json
import re


def extract_json_dict(text):
    """Return the JSON object contained in ``text`` (plain or fenced in markdown)."""
    match = re.search(r"```(?:json)?\s*({.*})\s*```", text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        match = re.search(r"({.*})", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in text.")
        json_str = match.group(1)

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON structure: {e}")


def parse_model_json(raw: str) -> dict:
    """``extract_json_dict`` that logs a short excerpt when the model's reply is not usable JSON."""
    import logging

    from .trace import current_stage, log_stage, preview

    try:
        return extract_json_dict(raw)
    except ValueError as exc:
        log_stage(current_stage(), "json_parse FAILED", logging.WARNING, error=str(exc), response_chars=len(raw or ""), preview=preview(raw))
        raise
