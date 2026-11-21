"""Send the master resume to the model as YAML: the same data in fewer tokens than JSON.

Only the *input* is YAML. The model still answers in JSON (JSON mode keeps that reliable). The
conversion happens here, just before the prompt is built; nothing stored in the database or sent to
the frontend changes.
"""
from typing import Any

import yaml


def prune_empty(value: Any) -> Any:
    """Drop empty strings, lists, dicts and nulls: they cost tokens and say nothing."""
    if isinstance(value, dict):
        cleaned = {k: prune_empty(v) for k, v in value.items()}
        return {k: v for k, v in cleaned.items() if v not in (None, "", [], {})}
    if isinstance(value, (list, tuple)):
        cleaned = [prune_empty(v) for v in value]
        return [v for v in cleaned if v not in (None, "", [], {})]
    return value


def to_yaml(data: Any) -> str:
    """Compact, readable YAML (keys in their original order, no line wrapping)."""
    return yaml.safe_dump(
        prune_empty(data), sort_keys=False, allow_unicode=True, default_flow_style=False, width=10_000
    ).rstrip()
