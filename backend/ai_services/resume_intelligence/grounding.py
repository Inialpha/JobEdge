"""Grounding: keep every generated resume anchored to the candidate's real facts.

The model is allowed to rewrite wording. It is never allowed to change who the
candidate is, where they worked, what they studied, or to introduce numbers and
technologies that are not in the master resume. This module enforces that
deterministically, after every generation or revision, so it does not depend on
the model obeying the prompt.
"""
import copy
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from .text_utils import (
    as_bullets,
    as_list,
    extract_numbers,
    flatten_text,
    normalize,
    similarity,
    split_sentences,
    stem,
    stemmed_tokens,
    tokenize,
)

_WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9+#./_-]*")
_IGNORED_TERMS = {
    "us", "uk", "eu", "usa", "i",
    "january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
}


@dataclass
class SourceIndex:
    """Searchable view of the master resume."""

    text: str
    tokens: Set[str]
    numbers: Set[str]
    bullets: List[str]
    summary_sentences: List[str]
    experiences: List[dict]
    educations: List[dict]
    certifications: List[dict]
    awards: List[dict]
    projects: List[dict]
    languages: List[str]
    keywords: List[str]
    personal_information: dict
    skill_names: List[str] = field(default_factory=list)


def _dicts(value: Any) -> List[dict]:
    return [v for v in as_list(value) if isinstance(v, dict)]


def _skill_names(skills: Any) -> List[str]:
    names: List[str] = []
    for item in as_list(skills):
        if isinstance(item, dict):
            names.extend(s for s in as_list(item.get("skills")) if isinstance(s, str))
        elif isinstance(item, str):
            names.append(item)
    return [n.strip() for n in names if n and n.strip()]


def build_source_index(master: dict) -> SourceIndex:
    master = master or {}
    experiences = _dicts(master.get("professional_experiences") or master.get("professionalExperience"))
    educations = _dicts(master.get("educations") or master.get("education"))
    projects = _dicts(master.get("projects"))

    bullets: List[str] = []
    for exp in experiences:
        bullets.extend(as_bullets(exp.get("responsibilities")))
    for proj in projects:
        bullets.extend(as_bullets(proj.get("description")))

    text = flatten_text(master)
    return SourceIndex(
        text=normalize(text),
        tokens=stemmed_tokens(text),
        numbers=extract_numbers(text),
        bullets=bullets,
        summary_sentences=split_sentences(master.get("summary") or ""),
        experiences=experiences,
        educations=educations,
        certifications=_dicts(master.get("certifications")),
        awards=_dicts(master.get("awards")),
        projects=projects,
        languages=[l for l in as_list(master.get("languages")) if isinstance(l, str)],
        keywords=[k for k in as_list(master.get("keywords")) if isinstance(k, str)],
        personal_information=master.get("personal_information")
        if isinstance(master.get("personal_information"), dict)
        else {},
        skill_names=_skill_names(master.get("skills")),
    )


# --------------------------------------------------------------------------- terms


def contains_term(index: SourceIndex, term: str) -> bool:
    """True if ``term`` (a skill, keyword or phrase) is supported by the master resume."""
    t = normalize(term)
    if not t:
        return False
    if re.search(r"(?<![a-z0-9])" + re.escape(t) + r"(?![a-z0-9])", index.text):
        return True
    parts = stemmed_tokens(term)
    return bool(parts) and parts <= index.tokens


def _term_grounded(index: SourceIndex, word: str) -> bool:
    w = word.strip(".,;:()[]\"'").lower()
    if not w:
        return True
    if stem(w) in index.tokens or contains_term(index, w):
        return True
    if "-" in w or "/" in w:
        parts = [p for p in re.split(r"[-/]", w) if p]
        return bool(parts) and all(stem(p) in index.tokens for p in parts)
    return False


def unsupported_terms(text: str, index: SourceIndex) -> List[str]:
    """Technology-like or proper-noun-like words in ``text`` that the source never mentions."""
    found: List[str] = []
    sentence_start = True
    for match in _WORD.finditer(text or ""):
        word = match.group(0).rstrip(".")
        start = match.start()
        before = (text[:start]).rstrip()
        sentence_start = (not before) or before[-1] in ".!?:;\n•-–"

        core = word.strip(".,;:()[]\"'")
        if not core or core.lower() in _IGNORED_TERMS or core.isdigit():
            continue
        has_digit = any(c.isdigit() for c in core)
        has_symbol = any(c in core for c in "+#") or (
            "." in core.strip(".") and any(c.isalpha() for c in core)
        )
        is_acronym = core.isalpha() and core.isupper() and len(core) >= 2
        is_proper = core[0].isupper() and not sentence_start and any(c.islower() for c in core)
        if not (has_digit or has_symbol or is_acronym or is_proper):
            continue
        if has_digit and not any(c.isalpha() for c in core):
            continue
        if not _term_grounded(index, core):
            found.append(core)
    seen, unique = set(), []
    for term in found:
        if term.lower() not in seen:
            seen.add(term.lower())
            unique.append(term)
    return unique


def ungrounded_numbers(text: str, index: SourceIndex) -> List[str]:
    return sorted(extract_numbers(text) - index.numbers)


def text_violations(text: str, index: SourceIndex) -> List[dict]:
    out = [{"type": "number", "value": n} for n in ungrounded_numbers(text, index)]
    out += [{"type": "term", "value": t} for t in unsupported_terms(text, index)]
    return out


# --------------------------------------------------------------------------- matching


def _best_source_bullet(text: str, candidates: List[str]) -> Tuple[Optional[str], float]:
    best, best_score = None, 0.0
    for cand in candidates:
        score = similarity(text, cand)
        if score > best_score:
            best, best_score = cand, score
    return best, best_score


def best_source_bullet(text: str, index: SourceIndex) -> Tuple[Optional[str], float]:
    return _best_source_bullet(text, index.bullets)


def _name_score(a: str, b: str) -> float:
    na, nb = normalize(a), normalize(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    score = similarity(na, nb)
    if na in nb or nb in na:
        score = max(score, 0.85)
    return score


def _match_index(name: str, names: List[str], used: Set[int], threshold: float = 0.75) -> Optional[int]:
    best_i, best = None, 0.0
    for i, other in enumerate(names):
        if i in used:
            continue
        score = _name_score(name, other)
        if score > best:
            best_i, best = i, score
    return best_i if best >= threshold else None


def _match_experience(cand: dict, masters: List[dict], used: Set[int]) -> Optional[int]:
    best_i, best = None, 0.0
    for i, m in enumerate(masters):
        if i in used:
            continue
        org = _name_score(str(cand.get("organization") or ""), str(m.get("organization") or ""))
        if org < 0.75:
            continue
        role = _name_score(str(cand.get("role") or ""), str(m.get("role") or ""))
        score = 0.6 * org + 0.4 * role
        if score > best:
            best_i, best = i, score
    return best_i


# --------------------------------------------------------------------------- repair


def _ground_bullets(bullets: List[str], own_source: List[str], index: SourceIndex, repairs: List[dict], where: str) -> List[str]:
    """Keep rewritten bullets that stay inside the facts; revert or drop the others."""
    out: List[str] = []
    for bullet in bullets:
        violations = text_violations(bullet, index)
        if not violations:
            out.append(bullet)
            continue
        pool = own_source or index.bullets
        source, score = _best_source_bullet(bullet, pool)
        if source and score >= 0.25:
            out.append(source)
            action = "reverted_to_source_bullet"
        else:
            action = "dropped_bullet"
        repairs.append({"type": "ungrounded_bullet", "where": where, "action": action, "violations": violations, "text": bullet})
    # drop exact duplicates created by reverting two bullets to the same source line
    seen, unique = set(), []
    for b in out:
        key = normalize(b)
        if key not in seen:
            seen.add(key)
            unique.append(b)
    return unique


def _ground_skills(skills: Any, index: SourceIndex, repairs: List[dict]) -> List[dict]:
    categories: List[dict] = []
    for item in as_list(skills):
        if isinstance(item, str):
            item = {"category": "General", "skills": [item]}
        if not isinstance(item, dict):
            continue
        kept: List[str] = []
        for skill in as_list(item.get("skills")):
            if not isinstance(skill, str) or not skill.strip():
                continue
            if contains_term(index, skill):
                if skill.strip().lower() not in {k.lower() for k in kept}:
                    kept.append(skill.strip())
            else:
                repairs.append({"type": "ungrounded_skill", "action": "removed_skill", "value": skill})
        if kept:
            categories.append({"category": str(item.get("category") or "General"), "skills": kept})
    return categories


def ground_resume(candidate: dict, master: dict, index: Optional[SourceIndex] = None) -> Tuple[dict, List[dict]]:
    """Return ``(grounded_resume, repairs)``.

    Facts (names, employers, roles, dates, institutions, certificates) always come
    from the master resume. Only wording (summary, bullets, project descriptions)
    and the *selection and order* of items come from the model.
    """
    index = index or build_source_index(master)
    candidate = candidate if isinstance(candidate, dict) else {}
    repairs: List[dict] = []

    # Contact details are never taken from the model.
    pi = {k: str(v) for k, v in index.personal_information.items() if v is not None}
    if not pi.get("profession"):
        cand_pi = candidate.get("personal_information") if isinstance(candidate.get("personal_information"), dict) else {}
        profession = str(cand_pi.get("profession") or candidate.get("profession") or "").strip()
        if profession and stemmed_tokens(profession) <= index.tokens:
            pi["profession"] = profession
        elif index.experiences and index.experiences[0].get("role"):
            pi["profession"] = str(index.experiences[0]["role"])

    # Professional experience: copy master facts, keep generated bullets that are grounded.
    experiences: List[dict] = []
    used: Set[int] = set()
    for cand in _dicts(candidate.get("professional_experiences")):
        i = _match_experience(cand, index.experiences, used)
        if i is None:
            repairs.append({"type": "invented_experience", "action": "dropped_entry", "value": str(cand.get("organization"))})
            continue
        used.add(i)
        master_exp = copy.deepcopy(index.experiences[i])
        source_bullets = as_bullets(master_exp.get("responsibilities"))
        bullets = _ground_bullets(as_bullets(cand.get("responsibilities")), source_bullets, index, repairs, f"experience:{master_exp.get('organization')}")
        master_exp["responsibilities"] = bullets or source_bullets[:4]
        experiences.append(master_exp)

    # Education
    educations: List[dict] = []
    used = set()
    names = [str(e.get("institution") or e.get("school_name") or "") for e in index.educations]
    for cand in _dicts(candidate.get("educations")):
        i = _match_index(str(cand.get("institution") or cand.get("school_name") or ""), names, used)
        if i is None:
            repairs.append({"type": "invented_education", "action": "dropped_entry", "value": str(cand.get("institution"))})
            continue
        used.add(i)
        educations.append(copy.deepcopy(index.educations[i]))

    # Certifications and awards
    def _filter(candidates: List[dict], masters: List[dict], key: str, label: str) -> List[dict]:
        kept, used_ = [], set()
        master_names = [str(m.get(key) or "") for m in masters]
        for cand in candidates:
            i = _match_index(str(cand.get(key) or ""), master_names, used_, threshold=0.8)
            if i is None:
                repairs.append({"type": f"invented_{label}", "action": "dropped_entry", "value": str(cand.get(key))})
                continue
            used_.add(i)
            kept.append(copy.deepcopy(masters[i]))
        return kept

    certifications = _filter(_dicts(candidate.get("certifications")), index.certifications, "name", "certification")
    awards = _filter(_dicts(candidate.get("awards")), index.awards, "title", "award")

    # Projects
    projects: List[dict] = []
    used = set()
    project_names = [str(p.get("name") or "") for p in index.projects]
    for cand in _dicts(candidate.get("projects")):
        i = _match_index(str(cand.get("name") or ""), project_names, used)
        if i is None:
            repairs.append({"type": "invented_project", "action": "dropped_entry", "value": str(cand.get("name"))})
            continue
        used.add(i)
        master_proj = copy.deepcopy(index.projects[i])
        source_desc = as_bullets(master_proj.get("description"))
        description = " ".join(as_bullets(cand.get("description")))
        if description and text_violations(description, index):
            repairs.append({"type": "ungrounded_project_description", "action": "reverted_to_source", "value": master_proj.get("name"), "violations": text_violations(description, index)})
            description = ""
        if description:
            master_proj["description"] = description
        elif isinstance(master_proj.get("description"), list):
            master_proj["description"] = " ".join(source_desc)
        projects.append(master_proj)

    skills = _ground_skills(candidate.get("skills"), index, repairs)

    languages = [l for l in as_list(candidate.get("languages")) if isinstance(l, str) and l.strip() and contains_term(index, l)]
    keywords = [k for k in as_list(candidate.get("keywords")) if isinstance(k, str) and k.strip() and contains_term(index, k)]

    summary = candidate.get("summary")
    summary = summary.strip() if isinstance(summary, str) else ""

    grounded = {
        "keywords": keywords or index.keywords,
        "name": pi.get("name", ""),
        "email": pi.get("email", ""),
        "summary": summary,
        "personal_information": pi,
        "professional_experiences": experiences,
        "skills": skills,
        "projects": projects,
        "educations": educations,
        "certifications": certifications,
        "awards": awards,
        "languages": languages or index.languages,
    }
    return grounded, repairs


# --------------------------------------------------------------------------- summary guard


def safe_summary_from_source(master: dict, index: SourceIndex) -> str:
    """A plain but strictly true summary, used only as a last resort."""
    if isinstance(master.get("summary"), str) and master["summary"].strip():
        return master["summary"].strip()
    role = (index.personal_information or {}).get("profession") or (index.experiences[0].get("role") if index.experiences else "")
    orgs = [str(e.get("organization")) for e in index.experiences[:2] if e.get("organization")]
    parts = [str(role or "Professional")]
    if orgs:
        parts.append("with experience at " + " and ".join(orgs))
    return " ".join(parts) + "."


def sanitize_summary(summary: str, master: dict, index: SourceIndex) -> Tuple[str, List[dict]]:
    """Drop sentences with unverifiable numbers or technologies. Never invents text."""
    repairs: List[dict] = []
    kept: List[str] = []
    for sentence in split_sentences(summary):
        violations = text_violations(sentence, index)
        if violations:
            repairs.append({"type": "ungrounded_summary_sentence", "action": "dropped_sentence", "violations": violations, "text": sentence})
        else:
            kept.append(sentence)
    if kept:
        return " ".join(kept), repairs
    return safe_summary_from_source(master, index), repairs + [{"type": "summary_fallback", "action": "used_source_summary"}]


def find_violations(resume: dict, index: SourceIndex) -> Dict[str, Any]:
    """Everything in ``resume`` that the source cannot support (used by the evaluator)."""
    items: List[dict] = []

    def check(text: str, where: str):
        for v in text_violations(text, index):
            items.append({**v, "where": where})

    check(resume.get("summary") or "", "summary")
    for exp in _dicts(resume.get("professional_experiences")):
        for bullet in as_bullets(exp.get("responsibilities")):
            check(bullet, f"experience:{exp.get('organization')}")
    for proj in _dicts(resume.get("projects")):
        check(" ".join(as_bullets(proj.get("description"))), f"project:{proj.get('name')}")
    for cat in _dicts(resume.get("skills")):
        for skill in as_list(cat.get("skills")):
            if isinstance(skill, str) and not contains_term(index, skill):
                items.append({"type": "skill", "value": skill, "where": "skills"})

    master_orgs = [str(e.get("organization") or "") for e in index.experiences]
    for exp in _dicts(resume.get("professional_experiences")):
        if _match_index(str(exp.get("organization") or ""), master_orgs, set()) is None:
            items.append({"type": "experience", "value": str(exp.get("organization")), "where": "experience"})
    return {"items": items, "count": len(items)}
