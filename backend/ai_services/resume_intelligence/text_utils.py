"""Small, dependency-free text helpers shared by grounding and evaluation."""
import difflib
import re
from typing import Any, Iterable, List, Set

STOPWORDS = frozenset(
    """a about above after again all also am an and any are as at be because been before being below between
    both but by can could did do does doing down during each few for from further had has have having he her here
    hers him his how i if in into is it its itself just me more most my no nor not of off on once only or other our
    out over own same she should so some such than that the their them then there these they this those through to
    too under until up us very was we were what when where which while who whom why will with would you your
    across within using used use via per etc able including include includes new""".split()
)

_TOKEN = re.compile(r"[A-Za-z0-9][A-Za-z0-9+#./_-]*[A-Za-z0-9+#]|[A-Za-z0-9]")
_NUMBER = re.compile(r"\d[\d,]*(?:\.\d+)?")


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def stem(token: str) -> str:
    """Very light stemming so 'APIs' matches 'API' and 'pipelines' matches 'pipeline'."""
    token = token.lower().strip(".")
    for suffix in ("ing", "ed"):
        if len(token) > 5 and token.endswith(suffix):
            return token[: -len(suffix)]
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def tokenize(text: str) -> List[str]:
    return [t.lower().rstrip(".") for t in _TOKEN.findall(text or "")]


def content_tokens(text: str) -> List[str]:
    return [t for t in tokenize(text) if t not in STOPWORDS and len(t) > 1]


def stemmed_tokens(text: str) -> Set[str]:
    return {stem(t) for t in content_tokens(text)}


def extract_numbers(text: str) -> Set[str]:
    """Bare numeric values found in ``text`` ("$1,200" -> "1200", "40%" -> "40")."""
    out = set()
    for match in _NUMBER.findall(text or ""):
        value = match.replace(",", "").rstrip(".")
        if "." in value:
            value = value.rstrip("0").rstrip(".")
        out.add(value)
    return out


def word_count(text: str) -> int:
    return len(re.findall(r"\S+", text or ""))


def similarity(a: str, b: str) -> float:
    a, b = normalize(a), normalize(b)
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def split_sentences(text: str) -> List[str]:
    parts = re.split(r"(?<=[.!?])\s+", (text or "").strip())
    return [p.strip() for p in parts if p.strip()]


def flatten_strings(value: Any) -> Iterable[str]:
    """Yield every string found anywhere inside a nested dict/list structure."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for v in value.values():
            yield from flatten_strings(v)
    elif isinstance(value, (list, tuple)):
        for v in value:
            yield from flatten_strings(v)


def flatten_text(value: Any) -> str:
    return "\n".join(flatten_strings(value))


def as_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def as_bullets(value: Any) -> List[str]:
    """Normalise responsibilities/descriptions (str, list of str, None) to a list of strings."""
    out = []
    for item in as_list(value):
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
    return out
