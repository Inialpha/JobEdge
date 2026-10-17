"""Aggregate stored evaluations so prompts, models and workflows can be compared objectively.

Pure functions over plain dicts, so they work for rows loaded from the database and for
benchmark reports alike.
"""
from collections import defaultdict
from typing import Any, Dict, Iterable, List, Tuple

from . import config

GROUP_KEYS = ("document_type", "workflow_version", "prompt_version", "generator_model")


def aggregate_evaluations(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group evaluation rows by (document type, workflow, prompt, model) and summarise each group.

    Each row needs: workflow_version, prompt_version, generator_model, overall_score,
    passed, scores (dict) and optionally ``report`` with ``iterations``. ``document_type``
    defaults to "resume" for rows stored before cover letters were evaluated.
    """
    groups: Dict[Tuple[str, ...], List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = tuple(str(row.get(k) or ("resume" if k == "document_type" else "unknown")) for k in GROUP_KEYS)
        groups[key].append(row)

    summaries = []
    for key, items in groups.items():
        n = len(items)
        weights = config.LETTER_WEIGHTS if key[0] == "cover_letter" else config.WEIGHTS
        dims = {
            d: round(sum(float((r.get("scores") or {}).get(d, 0.0)) for r in items) / n, 4)
            for d in weights
        }
        revisions = []
        for r in items:
            iterations = ((r.get("report") or {}).get("iterations")) or []
            revisions.append(sum(1 for i in iterations if i.get("kind") == "revision"))
        summaries.append({
            **dict(zip(GROUP_KEYS, key)),
            "count": n,
            "mean_overall": round(sum(float(r.get("overall_score") or 0.0) for r in items) / n, 4),
            "pass_rate": round(sum(1 for r in items if r.get("passed")) / n, 4),
            "mean_scores": dims,
            "mean_revisions": round(sum(revisions) / n, 2),
        })
    summaries.sort(key=lambda s: (-s["mean_overall"], -s["count"]))
    return summaries


def format_table(summaries: List[Dict[str, Any]]) -> str:
    """Plain-text table for terminal output."""
    if not summaries:
        return "No evaluations found."
    header = f"{'document':<13} {'workflow':<16} {'prompt':<24} {'model':<28} {'n':>4} {'overall':>8} {'pass':>6} {'revs':>5}"
    lines = [header, "-" * len(header)]
    for s in summaries:
        lines.append(
            f"{s['document_type']:<13} {s['workflow_version']:<16} {s['prompt_version']:<24} {s['generator_model']:<28} "
            f"{s['count']:>4} {s['mean_overall']:>8.3f} {s['pass_rate']:>6.0%} {s['mean_revisions']:>5.1f}"
        )
    return "\n".join(lines)
