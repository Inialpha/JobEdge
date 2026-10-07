"""Step 1 of the loop: understand what the job asks for.

Uses the LLM when one is available and always falls back to (or is topped up by)
a deterministic keyword extractor, so the evaluator has requirements to check
even when the model is unavailable.
"""
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .json_utils import extract_json_dict
from .llm import LLMClient
from .prompts import ANALYZE_SYSTEM, build_analyze_prompt
from .text_utils import STOPWORDS, as_list, stem, tokenize

GENERIC_JD_WORDS = frozenset(
    """experience work working team teams ability skills skill strong looking join company role roles responsibilities
    requirements required preferred qualifications candidate candidates position job years year plus good great excellent
    knowledge understanding understand opportunity opportunities benefits salary apply application equal employer
    environment ensure support provide providing help helping develop development build building manage management
    must should will need needs well make making based related relevant etc part full time remote location
    degree bachelor master related field us we you our their work-life balance competitive
    nice hiring better tools tool proficiency improve improving across close highly passionate""".split()
)

_REQ_HEADINGS = re.compile(
    r"(requirements?|qualifications?|must[- ]haves?|what you(?:'ll| will) need|skills|you have|who you are)",
    re.I,
)


@dataclass
class JobAnalysis:
    title: str = ""
    required_skills: List[str] = field(default_factory=list)
    preferred_skills: List[str] = field(default_factory=list)
    responsibilities: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    source: str = "heuristic"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "required_skills": self.required_skills,
            "preferred_skills": self.preferred_skills,
            "responsibilities": self.responsibilities,
            "keywords": self.keywords,
            "source": self.source,
        }


def _looks_technical(raw_word: str) -> bool:
    return (
        any(c.isdigit() for c in raw_word)
        or any(c in raw_word for c in "+#")
        or ("." in raw_word.strip(".") and any(c.isalpha() for c in raw_word))
        or (raw_word.isalpha() and raw_word.isupper() and len(raw_word) >= 2)
        or (raw_word[:1].isupper() and any(c.isupper() for c in raw_word[1:]))  # CamelCase: JavaScript
    )


def heuristic_keywords(job_description: str, limit: int = 25) -> List[str]:
    """Frequency-based keyword extraction with a boost for technical-looking words
    and words in the requirements section."""
    text = job_description or ""
    match = _REQ_HEADINGS.search(text)
    requirements_text = text[match.start():] if match else ""
    req_tokens = {stem(t) for t in tokenize(requirements_text)}

    raw_words = re.findall(r"[A-Za-z0-9][A-Za-z0-9+#./_-]*", text)
    technical = {stem(w.lower().strip(".")) for w in raw_words if _looks_technical(w.strip("."))}

    counts: Counter = Counter()
    display: Dict[str, str] = {}
    for tok in tokenize(text):
        if tok in STOPWORDS or tok in GENERIC_JD_WORDS or len(tok) < 2:
            continue
        if not any(c.isalpha() for c in tok):  # "3+", "2024", "5-7"
            continue
        key = stem(tok)
        counts[key] += 1
        display.setdefault(key, tok)

    scored = []
    for key, freq in counts.items():
        score = freq + (2.0 if key in technical else 0.0) + (1.5 if key in req_tokens else 0.0)
        if len(display[key]) < 3 and key not in technical:
            continue
        scored.append((score, display[key]))
    scored.sort(key=lambda s: (-s[0], s[1]))
    return [word for _, word in scored[:limit]]


def _clean_list(value: Any, limit: int = 30) -> List[str]:
    out, seen = [], set()
    for item in as_list(value):
        if isinstance(item, str) and item.strip():
            key = item.strip().lower()
            if key not in seen:
                seen.add(key)
                out.append(item.strip())
        if len(out) >= limit:
            break
    return out


def analyze_job(job_description: str, llm: Optional[LLMClient] = None) -> JobAnalysis:
    heuristic = heuristic_keywords(job_description)
    if llm is None:
        return JobAnalysis(keywords=heuristic, required_skills=heuristic[:10], source="heuristic")

    try:
        raw = llm.complete(ANALYZE_SYSTEM, build_analyze_prompt(job_description), temperature=0.0)
        data = extract_json_dict(raw)
    except Exception:
        return JobAnalysis(keywords=heuristic, required_skills=heuristic[:10], source="heuristic")

    required = _clean_list(data.get("required_skills"))
    preferred = _clean_list(data.get("preferred_skills"))
    extra = _clean_list(data.get("keywords"))

    keywords, seen = [], set()
    for word in required + preferred + extra:
        key = stem(word.lower())
        if key not in seen:
            seen.add(key)
            keywords.append(word)
    if len(keywords) < 5:  # LLM gave too little; top up deterministically
        for word in heuristic:
            if stem(word) not in seen:
                seen.add(stem(word))
                keywords.append(word)

    title = data.get("title") if isinstance(data.get("title"), str) else ""
    return JobAnalysis(
        title=title.strip(),
        required_skills=required or heuristic[:10],
        preferred_skills=preferred,
        responsibilities=_clean_list(data.get("responsibilities"), limit=8),
        keywords=keywords,
        source="llm",
    )
