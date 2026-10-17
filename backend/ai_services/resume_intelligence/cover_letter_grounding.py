"""Keep a cover letter inside the candidate's real facts.

A letter may talk about the job and the company using the job description's own words, but it
may not state numbers, tools or names that appear in neither the candidate's master resume nor
the job description, and it must not claim skills the job asks for that the candidate lacks.
"""
import re
from typing import Dict, List, Tuple

from .grounding import SourceIndex, contains_term, term_supported, ungrounded_numbers, unsupported_terms
from .job_analysis import JobAnalysis
from .text_utils import split_sentences, stemmed_tokens

_FIRST_PERSON = re.compile(r"\b(I|I'm|I've|I'd|I'll|My|my|Me|me|myself|mine)\b")
_WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9+#./_-]*")


def mentions(text: str, term: str) -> bool:
    """Stem-aware: does ``text`` contain every content word of ``term``?"""
    wanted = stemmed_tokens(term)
    return bool(wanted) and wanted <= stemmed_tokens(text)


def is_first_person(sentence: str) -> bool:
    return bool(_FIRST_PERSON.search(sentence))


def _technical_in_job(term: str, job_description: str) -> bool:
    """True when the job description writes ``term`` like a tool or proper noun (capitalised,
    an acronym, or containing digits/symbols) rather than as an ordinary lower-case word."""
    for match in re.finditer(r"(?<![A-Za-z0-9])" + re.escape(term) + r"(?![A-Za-z0-9])", job_description or "", re.I):
        raw = match.group(0)
        if any(c.isdigit() or c in "+#" for c in raw) or (len(raw) > 1 and raw.isupper()):
            return True
        # a capital letter only counts in mid-sentence ("Experience with Django"), not at the start of a line or sentence
        before = job_description[: match.start()].rstrip(" \t-*•\u2022")
        if raw[:1].isupper() and before and before[-1] not in ".!?\n":
            return True
    return False


def job_gaps(analysis: JobAnalysis, master_index: SourceIndex, job_description: str) -> List[str]:
    """Things the job asks for that the candidate's profile does not support.

    Required or nice-to-have alike (claiming either would be untrue). Limited to tool-like terms so that ordinary words in the job post ("design", "improve")
    are not mistaken for skills the candidate lacks.
    """
    gaps: List[str] = []
    for keyword in analysis.keywords:
        parts = [p for p in re.split(r"[/&]", keyword) if p.strip()] or [keyword]
        supported = any(contains_term(master_index, p.strip()) for p in parts)  # "CI/CD" is covered by "CI pipelines"
        if not supported and _technical_in_job(keyword, job_description):
            gaps.append(keyword)
    return gaps


def sentence_violations(sentence: str, master_index: SourceIndex, job_index: SourceIndex) -> List[dict]:
    """Unsupported numbers and terms in one sentence of a letter body."""
    found = [{"type": "number", "value": n} for n in ungrounded_numbers(sentence, master_index)]
    for term in unsupported_terms(sentence, master_index):
        if not term_supported(job_index, term):  # terms the job description uses are fine to mention
            found.append({"type": "term", "value": term})
    return found


def gap_claims(sentence: str, gaps: List[str]) -> List[str]:
    """Gap terms mentioned in a sentence written from the candidate's point of view."""
    if not gaps or not is_first_person(sentence):
        return []
    return [g for g in gaps if mentions(sentence, g)]


def ground_letter_body(
    paragraphs: List[str],
    master_index: SourceIndex,
    job_index: SourceIndex,
    gaps: List[str] = (),
    drop_gap_claims: bool = False,
) -> Tuple[List[str], List[dict]]:
    """Remove sentences that state something the sources do not support. Never adds text."""
    repairs: List[dict] = []
    kept_paragraphs: List[str] = []
    for paragraph in paragraphs:
        kept: List[str] = []
        for sentence in split_sentences(paragraph):
            violations = sentence_violations(sentence, master_index, job_index)
            claims = gap_claims(sentence, list(gaps)) if drop_gap_claims else []
            if violations or claims:
                repairs.append({
                    "type": "ungrounded_letter_sentence",
                    "action": "dropped_sentence",
                    "violations": violations + [{"type": "gap", "value": g} for g in claims],
                    "text": sentence,
                })
                continue
            kept.append(sentence)
        if kept:
            kept_paragraphs.append(" ".join(kept))
    return kept_paragraphs, repairs


def count_violations(paragraphs: List[str], master_index: SourceIndex, job_index: SourceIndex, gaps: List[str]) -> Dict[str, list]:
    """Everything in the body that the sources cannot support (used by the evaluator)."""
    invented: List[dict] = []
    claimed_gaps: List[dict] = []
    for paragraph in paragraphs:
        for sentence in split_sentences(paragraph):
            for v in sentence_violations(sentence, master_index, job_index):
                invented.append({**v, "sentence": sentence})
            for g in gap_claims(sentence, list(gaps)):
                claimed_gaps.append({"type": "gap", "value": g, "sentence": sentence})
    return {"invented": invented, "gap_claims": claimed_gaps}
