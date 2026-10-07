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
