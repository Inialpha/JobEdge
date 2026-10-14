"""Evaluator for cover letters: a separate process that scores a letter against the job
description and the candidate's source information (the master resume).

Dimensions (weights and thresholds in config.py):

* factual_accuracy - invented numbers/tools/names, claims of skills the candidate lacks, wrong contact details
* relevance        - does it address this job (role, requirements the candidate really meets)?
* specificity      - concrete, real details from the candidate's experience, written rather than pasted
* naturalness      - no cliches, buzzwords, keyword stuffing or text lifted from the job post
* redundancy       - no repeated sentences, openings or phrases
* structure        - header, greeting, 3-5 paragraphs, 220-380 words, sign-off with the candidate's name, no placeholders
"""
import re
from typing import Any, Dict, List, Optional

from . import config
from .cover_letter_grounding import count_violations, mentions
from .cover_letter_text import PLACEHOLDER_RE, DATE_RE, digits, emails_in, parse_letter, phones_in
from .evaluator import EvaluationResult, Issue
from .grounding import SourceIndex, build_source_index, contains_term
from .job_analysis import JobAnalysis
from .text_utils import extract_numbers, similarity, split_sentences, stemmed_tokens, tokenize, word_count

_SENIORITY = {"senior", "junior", "lead", "principal", "staff", "associate", "intern"}


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


def _short(text: str, n: int = 90) -> str:
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


class CoverLetterEvaluator:
    def __init__(self, weights=None, thresholds=None, overall_threshold=None):
        self.weights = weights or config.LETTER_WEIGHTS
        self.thresholds = thresholds or config.LETTER_DIMENSION_THRESHOLDS
        self.overall_threshold = overall_threshold if overall_threshold is not None else config.LETTER_OVERALL_THRESHOLD

    # ------------------------------------------------------------------ public

    def evaluate(
        self,
        letter_text: str,
        master: dict,
        job_description: str,
        analysis: JobAnalysis,
        index: Optional[SourceIndex] = None,
        repairs: Optional[List[dict]] = None,
        gaps: Optional[List[str]] = None,
    ) -> EvaluationResult:
        from .cover_letter_grounding import job_gaps  # local import keeps module import order simple

        index = index or build_source_index(master)
        job_index = build_source_index({"job": job_description})
        repairs = repairs or []
        gaps = job_gaps(analysis, index, job_description) if gaps is None else gaps
        issues: List[Issue] = []

        parsed = parse_letter(letter_text)
        paragraphs = parsed.paragraphs
        body = parsed.body
        sentences = [s for p in paragraphs for s in split_sentences(p)]
        violations = count_violations(paragraphs, index, job_index, gaps)

        scores: Dict[str, float] = {}
        contact_problems = self._contact_problems(letter_text, index)
        scores["factual_accuracy"] = self._factual(violations, contact_problems, repairs, issues)
        relevance_info = {}
        scores["relevance"], relevance_info = self._relevance(body, parsed, analysis, index, issues)
        scores["specificity"], specificity_info = self._specificity(body, sentences, index, issues)
        scores["naturalness"] = self._naturalness(body, sentences, job_description, relevance_info["present"], issues)
        scores["redundancy"], redundancy_info = self._redundancy(sentences, paragraphs, issues)
        scores["structure"], structure_info = self._structure(letter_text, parsed, index, issues)

        scores = {k: round(_clamp(v), 4) for k, v in scores.items()}
        overall = round(sum(self.weights[k] * scores[k] for k in self.weights), 4)
        failed = [k for k in self.weights if scores[k] < self.thresholds[k]]
        passed = overall >= self.overall_threshold and not failed
        remaining = len(violations["invented"]) + len(violations["gap_claims"]) + len(contact_problems)

        diagnostics = {
            "words": word_count(body),
            "paragraphs": len(paragraphs),
            "keywords": relevance_info,
            "specificity": specificity_info,
            "violations": {"invented": violations["invented"], "gap_claims": violations["gap_claims"], "contact": contact_problems, "count": remaining},
            "gaps": gaps,
            "grounding_repairs": len(repairs),
            "redundancy": redundancy_info,
            "structure": structure_info,
        }
        return EvaluationResult(
            overall=overall, scores=scores, passed=passed, failed_dimensions=failed, issues=issues,
            diagnostics=diagnostics, judge_used=False, remaining_violations=remaining,
        )

    # ------------------------------------------------------------------ factual

    @staticmethod
    def _contact_problems(letter_text: str, index: SourceIndex) -> List[dict]:
        pi = index.personal_information or {}
        master_email = str(pi.get("email") or "").strip().lower()
        master_phone = digits(str(pi.get("phone") or pi.get("phone_number") or ""))
        problems = []
        for email in emails_in(letter_text):
            if email.lower() != master_email:
                problems.append({"type": "email", "value": email})
        for phone in phones_in(letter_text):
            d = digits(phone)
            if not master_phone or not (d.endswith(master_phone[-9:]) or master_phone.endswith(d[-9:])):
                problems.append({"type": "phone", "value": phone})
        return problems

    def _factual(self, violations, contact_problems, repairs, issues: List[Issue]) -> float:
        score = 1.0
        for v in violations["invented"]:
            score -= 0.2
            issues.append(Issue(
                "factual_accuracy", "critical",
                f"Unsupported {v['type']} '{v['value']}' in: \"{_short(v['sentence'])}\"",
                "Remove it. Use only facts from the master resume (and the job description for facts about the job).",
            ))
        gap_penalty = 0.0
        for v in violations["gap_claims"]:
            gap_penalty += 0.1
            issues.append(Issue(
                "factual_accuracy", "major",
                f"The letter speaks about '{v['value']}' from the candidate's point of view, but the candidate's profile has no evidence of it: \"{_short(v['sentence'])}\"",
                "Do not claim or hint at experience with it. Focus on skills the candidate really has.",
            ))
        score -= min(0.3, gap_penalty)
        for problem in contact_problems:
            score -= 0.3
            issues.append(Issue(
                "factual_accuracy", "critical",
                f"The letter contains a {problem['type']} ('{problem['value']}') that is not in the candidate's profile.",
                "Do not write contact details; they are added automatically.",
            ))
        if repairs:
            score -= min(0.25, 0.05 * len(repairs))
            issues.append(Issue(
                "factual_accuracy", "major",
                f"The previous draft had {len(repairs)} sentence(s) with unsupported content that had to be removed.",
                "Write only what the master resume supports; do not add numbers, tools or names.",
            ))
        return score

    # ------------------------------------------------------------------ relevance

    def _relevance(self, body: str, parsed, analysis: JobAnalysis, index: SourceIndex, issues: List[Issue]):
        supported = [k for k in analysis.keywords if contains_term(index, k)]
        present = [k for k in supported if mentions(body, k)]
        missed = [k for k in supported if k not in present]
        target = min(len(supported), 8)
        coverage = min(1.0, len(present) / target) if target else 1.0

        role_tokens = {t for t in stemmed_tokens(analysis.title) if t not in _SENIORITY} if analysis.title else set()
        role_score = None
        if role_tokens:
            role_score = len(role_tokens & stemmed_tokens(parsed.greeting + " " + body)) / len(role_tokens)

        score = coverage if role_score is None else 0.75 * coverage + 0.25 * role_score
        if coverage < 0.6 and missed:
            issues.append(Issue(
                "relevance", "major",
                f"The letter mentions few of the job's requirements that the candidate meets. Not mentioned: {', '.join(missed[:8])}.",
                "Connect two or three of these to real achievements from the resume, in natural sentences.",
            ))
        if role_score is not None and role_score < 0.5:
            issues.append(Issue("relevance", "minor", f"The letter never names the role ('{analysis.title}').", "Mention the role once, naturally."))
        return score, {"supported": supported, "present": present, "missed_supported": missed, "coverage": round(coverage, 4)}

    # ------------------------------------------------------------------ specificity

    def _specificity(self, body: str, sentences: List[str], index: SourceIndex, issues: List[Issue]):
        orgs = [str(e.get("organization")) for e in index.experiences if e.get("organization")]
        projects = [str(p.get("name")) for p in index.projects if p.get("name")]
        used_orgs = [o for o in orgs if mentions(body, o)]
        used_projects = [p for p in projects if mentions(body, p)]
        used_numbers = sorted(extract_numbers(body) & index.numbers)
        used_skills = [s for s in index.skill_names if mentions(body, s)]
        anchors = len(used_orgs) + len(used_projects) + min(len(used_numbers), 3) + min(len(used_skills), 4)
        anchor_score = min(1.0, anchors / 4)

        copied = [s for s in sentences if any(similarity(s, b) >= config.LETTER_COPY_SIMILARITY for b in index.bullets)]
        copy_ratio = len(copied) / len(sentences) if sentences else 0.0
        transformation = 1.0 - max(0.0, copy_ratio - 0.2) / 0.8

        if anchors < 2:
            issues.append(Issue(
                "specificity", "major",
                "The letter says little that is specific to the candidate's real experience.",
                "Describe two or three real achievements with their actual details (employer, technology, real numbers).",
            ))
        if copy_ratio > 0.2:
            issues.append(Issue(
                "specificity", "major",
                f"{len(copied)} sentence(s) are copied from resume bullets: \"{_short(copied[0])}\"",
                "Retell achievements in your own words and connect them to the job instead of pasting resume lines.",
            ))
        info = {"anchors": anchors, "organizations": used_orgs, "numbers": used_numbers, "skills": used_skills, "copied_sentences": len(copied)}
        return 0.7 * anchor_score + 0.3 * transformation, info

    # ------------------------------------------------------------------ naturalness

    def _naturalness(self, body: str, sentences: List[str], job_description: str, present_keywords: List[str], issues: List[Issue]) -> float:
        lowered = body.lower()
        buzz = [b for b in config.BUZZWORDS if re.search(r"(?<![a-z0-9])" + re.escape(b) + r"(?![a-z0-9])", lowered)]
        hits = list(dict.fromkeys(buzz))
        penalty = min(0.5, 0.15 * len(hits))
        if hits:
            issues.append(Issue("naturalness", "major", f"Buzzwords: {', '.join(hits)}.", "Use plain, specific words instead."))

        job_sentences = [s for s in split_sentences(job_description) if word_count(s) >= 8]
        lifted = [s for s in sentences if word_count(s) >= 8 and any(similarity(s, j) >= 0.8 for j in job_sentences)]
        if lifted:
            penalty += 0.3
            issues.append(Issue("naturalness", "major", "The letter repeats sentences from the job description.", "Describe the candidate's experience, not the job post."))

        stuffed = [s for s in sentences if sum(1 for k in present_keywords if mentions(s, k)) > 5]
        if stuffed:
            penalty += 0.2
            issues.append(Issue("naturalness", "major", "A sentence is stuffed with job keywords.", "Keep to two or three job terms per sentence."))

        long_sentences = [s for s in sentences if word_count(s) > 45]
        if long_sentences:
            penalty += min(0.2, 0.1 * len(long_sentences))
            issues.append(Issue("naturalness", "minor", "Some sentences are very long.", "Split them."))
        return 1.0 - penalty

    # ------------------------------------------------------------------ redundancy

    def _redundancy(self, sentences: List[str], paragraphs: List[str], issues: List[Issue]):
        pairs = sum(
            1 for i in range(len(sentences)) for j in range(i + 1, len(sentences)) if similarity(sentences[i], sentences[j]) >= 0.8
        )
        openers = [(tokenize(s) or [""])[0] for s in sentences]
        i_share = (openers.count("i") / len(openers)) if len(openers) >= 4 else 0.0
        repeated_openers = {w: openers.count(w) for w in set(openers) if w and w != "i" and openers.count(w) > 2}

        trigrams: Dict[tuple, int] = {}
        total = 0
        for s in sentences:
            toks = tokenize(s)
            for k in range(len(toks) - 2):
                tg = tuple(toks[k:k + 3])
                trigrams[tg] = trigrams.get(tg, 0) + 1
                total += 1
        rate = (sum(c - 1 for c in trigrams.values() if c > 1) / total) if total else 0.0

        penalty = min(0.4, 0.2 * pairs) + (0.3 if i_share > 0.5 else 0.0) + min(0.3, 0.1 * sum(c - 2 for c in repeated_openers.values())) + min(0.4, 2.0 * rate)
        if pairs:
            issues.append(Issue("redundancy", "major", f"{pairs} pair(s) of sentences say nearly the same thing.", "Merge or remove the repeats."))
        if i_share > 0.5:
            issues.append(Issue("redundancy", "minor", f"{int(i_share * 100)}% of the sentences start with \"I\".", "Vary how sentences begin."))
        if repeated_openers:
            issues.append(Issue("redundancy", "minor", f"Repeated sentence openings: {', '.join(repeated_openers)}.", "Vary the openings."))
        return 1.0 - penalty, {"near_duplicate_pairs": pairs, "i_share": round(i_share, 2), "repeated_trigram_rate": round(rate, 3)}

    # ------------------------------------------------------------------ structure

    def _structure(self, letter_text: str, parsed, index: SourceIndex, issues: List[Issue]):
        pi = index.personal_information or {}
        name = str(pi.get("name") or "").strip()
        header_text = "\n".join(parsed.header)
        body = parsed.body
        words = word_count(body)
        checks: Dict[str, bool] = {
            "has_greeting": parsed.has_greeting,
            "has_closing": parsed.has_closing,
            "signed_with_name": (not name) or (name.lower() in parsed.signature.lower()),
            "header_has_name": (not name) or (name.lower() in header_text.lower()),
            "header_has_email": (not pi.get("email")) or (str(pi["email"]).lower() in header_text.lower()),
            "header_has_date": bool(DATE_RE.search(header_text)),
            "no_placeholders": not PLACEHOLDER_RE.search(letter_text),
            "word_count_ok": config.LETTER_WORDS_MIN <= words <= config.LETTER_WORDS_MAX,
            "paragraph_count_ok": config.LETTER_PARAGRAPHS_MIN <= len(parsed.paragraphs) <= config.LETTER_PARAGRAPHS_MAX,
            "no_contact_in_body": not (emails_in(body) or phones_in(body)),
            "ends_cleanly": bool(body) and body.rstrip()[-1] in ".!?",
        }
        labels = {
            "has_greeting": ("major", "The letter has no greeting.", 'Start with "Dear Hiring Manager,".'),
            "has_closing": ("major", "The letter has no sign-off.", 'End with "Sincerely," and the candidate\'s name.'),
            "signed_with_name": ("major", "The letter is not signed with the candidate's name.", "Sign with the candidate's name."),
            "header_has_name": ("minor", "The header does not start with the candidate's name.", ""),
            "header_has_email": ("minor", "The header has no email address.", ""),
            "header_has_date": ("minor", "The header has no date.", ""),
            "no_placeholders": ("critical", "The letter contains placeholder text such as [Your Name].", "Remove all placeholders."),
            "word_count_ok": ("major", f"The body is {words} words.", f"Write {config.LETTER_WORDS_MIN}-{config.LETTER_WORDS_MAX} words (aim for 250-350)."),
            "paragraph_count_ok": ("major", f"The body has {len(parsed.paragraphs)} paragraph(s).", f"Use {config.LETTER_PARAGRAPHS_MIN}-{config.LETTER_PARAGRAPHS_MAX} paragraphs."),
            "no_contact_in_body": ("major", "The body contains an email address or phone number.", "Keep contact details out of the body."),
            "ends_cleanly": ("major", "The last paragraph does not end with a full sentence.", "Finish the final sentence."),
        }
        failed = [k for k, ok in checks.items() if not ok]
        for k in failed:
            severity, detail, suggestion = labels[k]
            issues.append(Issue("structure", severity, detail, suggestion))
        return sum(checks.values()) / len(checks), {"failed_checks": failed, "checks": checks}
