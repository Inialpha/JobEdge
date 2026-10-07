"""The evaluator: a process separate from the generator that scores a resume
against the job description and against the candidate's source information.

Most of the scoring is deterministic and offline, so scores are repeatable and
runs can be compared. An optional LLM judge adds a second opinion on the
subjective dimensions (relevance, summary quality, naturalness) and can report
unsupported claims, which are verified against the source before they count.

For every bullet the evaluator separates four cases:

* transformed - grounded in the source and meaningfully reworded
* copied      - essentially verbatim from the source
* invented    - content the source does not support
* missed      - job requirements the candidate's source supports but the resume omits
  (requirements the source does NOT support are reported separately as gaps and
  must never be added)
"""
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import config
from .grounding import (
    SourceIndex,
    build_source_index,
    contains_term,
    find_violations,
    text_violations,
)
from .job_analysis import JobAnalysis
from .json_utils import extract_json_dict
from .llm import LLMClient
from .prompts import JUDGE_SYSTEM, build_judge_prompt
from .text_utils import (
    STOPWORDS,
    as_bullets,
    as_list,
    extract_numbers,
    similarity,
    split_sentences,
    stem,
    stemmed_tokens,
    tokenize,
    word_count,
)


@dataclass
class Issue:
    dimension: str
    severity: str  # critical | major | minor
    detail: str
    suggestion: str = ""

    def to_dict(self) -> Dict[str, str]:
        return {"dimension": self.dimension, "severity": self.severity, "detail": self.detail, "suggestion": self.suggestion}


@dataclass
class EvaluationResult:
    overall: float
    scores: Dict[str, float]
    passed: bool
    failed_dimensions: List[str]
    issues: List[Issue]
    diagnostics: Dict[str, Any]
    judge_used: bool
    remaining_violations: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall": self.overall,
            "scores": self.scores,
            "passed": self.passed,
            "failed_dimensions": self.failed_dimensions,
            "issues": [i.to_dict() for i in self.issues],
            "diagnostics": self.diagnostics,
            "judge_used": self.judge_used,
            "remaining_violations": self.remaining_violations,
        }

    def feedback_text(self) -> str:
        """Structured feedback in the form the generator receives for a revision."""
        order = {"critical": 0, "major": 1, "minor": 2}
        lines = []
        for issue in sorted(self.issues, key=lambda i: order.get(i.severity, 3)):
            line = f"- [{issue.severity.upper()}] ({issue.dimension}) {issue.detail}"
            if issue.suggestion:
                line += f" -> {issue.suggestion}"
            lines.append(line)
        return "\n".join(lines) or "- No specific issues."


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


def _contains_phrase(text: str, phrase: str) -> bool:
    return bool(re.search(r"(?<![a-z0-9])" + re.escape(phrase.lower()) + r"(?![a-z0-9])", text.lower()))


def _verify_claim(claim: str, index: SourceIndex) -> bool:
    """True when most of the claim's salient content is absent from the source."""
    salient = {stem(t) for t in tokenize(claim) if t not in STOPWORDS and len(t) > 3}
    numbers = extract_numbers(claim)
    total = len(salient) + len(numbers)
    if total == 0:
        return False
    missing = sum(1 for t in salient if t not in index.tokens) + len(numbers - index.numbers)
    return missing / total >= 0.5


class ResumeEvaluator:
    def __init__(
        self,
        llm: Optional[LLMClient] = None,
        weights: Optional[Dict[str, float]] = None,
        thresholds: Optional[Dict[str, float]] = None,
        overall_threshold: Optional[float] = None,
    ):
        self.llm = llm
        self.weights = weights or config.WEIGHTS
        self.thresholds = thresholds or config.DIMENSION_THRESHOLDS
        self.overall_threshold = overall_threshold if overall_threshold is not None else config.OVERALL_THRESHOLD

    # ------------------------------------------------------------------ public

    def evaluate(
        self,
        resume: dict,
        master: dict,
        job_description: str,
        analysis: JobAnalysis,
        index: Optional[SourceIndex] = None,
        repairs: Optional[List[dict]] = None,
    ) -> EvaluationResult:
        index = index or build_source_index(master)
        repairs = repairs or []
        issues: List[Issue] = []
        # Keyword alignment is judged on what a recruiter or ATS can actually read, and the
        # hidden "keywords" list is not rendered on the resume.
        out_index = build_source_index({k: v for k, v in resume.items() if k != "keywords"})

        summary = resume.get("summary") or ""
        entries = self._bullet_entries(resume)
        bullets = [b for _, b in entries]

        judge = self._run_judge(resume, master, job_description, analysis)

        classes = self._classify_bullets(entries, index)
        keyword_info = self._keyword_info(analysis, index, out_index)

        scores: Dict[str, float] = {}
        scores["factual_accuracy"] = self._factual(resume, index, classes, repairs, judge, issues)
        scores["keyword_alignment"] = self._keywords(keyword_info, issues)
        scores["relevance"] = self._relevance(bullets, resume, index, classes, keyword_info, judge, issues)
        scores["summary_quality"] = self._summary(summary, master, job_description, keyword_info, index, judge, issues)
        scores["naturalness"] = self._naturalness(summary, bullets, keyword_info, judge, issues)
        scores["redundancy"], redundancy_info = self._redundancy(summary, bullets, issues)
        scores["structure"], structure_info = self._structure(resume, index, issues)

        scores = {k: round(_clamp(v), 4) for k, v in scores.items()}
        overall = round(sum(self.weights[k] * scores[k] for k in self.weights), 4)
        failed = [k for k in self.weights if scores[k] < self.thresholds[k]]
        passed = overall >= self.overall_threshold and not failed

        violations = find_violations(resume, index)
        diagnostics = {
            "bullets": classes["summary"],
            "keywords": keyword_info,
            "violations": violations,
            "grounding_repairs": len(repairs),
            "redundancy": redundancy_info,
            "structure": structure_info,
            "judge": {"used": judge is not None, "feedback": (judge or {}).get("feedback", [])},
            "analysis_source": analysis.source,
        }
        return EvaluationResult(
            overall=overall,
            scores=scores,
            passed=passed,
            failed_dimensions=failed,
            issues=issues,
            diagnostics=diagnostics,
            judge_used=judge is not None,
            remaining_violations=violations["count"],
        )

    # ------------------------------------------------------------------ judge

    def _run_judge(self, resume, master, job_description, analysis) -> Optional[Dict[str, Any]]:
        if self.llm is None:
            return None
        try:
            raw = self.llm.complete(JUDGE_SYSTEM, build_judge_prompt(resume, master, job_description, analysis), temperature=config.EVALUATOR_TEMPERATURE)
            data = extract_json_dict(raw)
        except Exception:
            return None

        def num(key: str) -> Optional[float]:
            try:
                return _clamp(float(data.get(key)))
            except (TypeError, ValueError):
                return None

        return {
            "relevance": num("relevance"),
            "summary_quality": num("summary_quality"),
            "naturalness": num("naturalness"),
            "unsupported_claims": [c for c in as_list(data.get("unsupported_claims")) if isinstance(c, str)],
            "copied": [c for c in as_list(data.get("copied_without_transformation")) if isinstance(c, str)],
            "generic_phrases": [c for c in as_list(data.get("generic_phrases")) if isinstance(c, str)],
            "feedback": [c for c in as_list(data.get("feedback")) if isinstance(c, str)][:5],
        }

    @staticmethod
    def _blend(deterministic: float, judge_value: Optional[float]) -> float:
        """The judge can pull a score down but never push it above the offline evidence.

        A lenient model must not be able to rescue a resume that the repeatable checks
        say is weak (for example an untailored copy of the master resume).
        """
        if judge_value is None:
            return deterministic
        return min(deterministic, 0.5 * deterministic + 0.5 * judge_value)

    # ------------------------------------------------------------------ extraction

    @staticmethod
    def _bullet_entries(resume: dict) -> List[tuple]:
        entries = []
        for exp in as_list(resume.get("professional_experiences")):
            if isinstance(exp, dict):
                for b in as_bullets(exp.get("responsibilities")):
                    entries.append((f"experience:{exp.get('organization')}", b))
        for proj in as_list(resume.get("projects")):
            if isinstance(proj, dict):
                for b in as_bullets(proj.get("description")):
                    entries.append((f"project:{proj.get('name')}", b))
        return entries

    # ------------------------------------------------------------------ bullets

    def _classify_bullets(self, entries, index: SourceIndex) -> Dict[str, Any]:
        transformed, copied, invented = [], [], []
        for where, bullet in entries:
            tokens = stemmed_tokens(bullet)
            grounded_ratio = (len(tokens & index.tokens) / len(tokens)) if tokens else 1.0
            sim = max((similarity(bullet, s) for s in index.bullets), default=0.0)
            if text_violations(bullet, index) or grounded_ratio < config.MIN_GROUNDED_TOKEN_RATIO:
                invented.append({"where": where, "text": bullet, "grounded_ratio": round(grounded_ratio, 2)})
            elif sim >= config.COPY_SIMILARITY:
                copied.append({"where": where, "text": bullet})
            else:
                transformed.append({"where": where, "text": bullet})
        total = len(entries)
        done = len(transformed) + len(copied)
        return {
            "transformed": transformed,
            "copied": copied,
            "invented": invented,
            "summary": {
                "total": total,
                "transformed": len(transformed),
                "copied": len(copied),
                "invented": len(invented),
                "transformation_ratio": round(len(transformed) / done, 3) if done else 1.0,
                "copied_examples": [c["text"] for c in copied[:3]],
                "invented_examples": [c["text"] for c in invented[:3]],
            },
        }

    # ------------------------------------------------------------------ keywords

    @staticmethod
    def _keyword_info(analysis: JobAnalysis, index: SourceIndex, out_index: SourceIndex) -> Dict[str, Any]:
        required = {k.lower() for k in analysis.required_skills}
        keywords, seen = [], set()
        for k in analysis.keywords or []:
            if k.lower() not in seen:
                seen.add(k.lower())
                keywords.append(k)
        supported = [k for k in keywords if contains_term(index, k)]
        present = [k for k in supported if contains_term(out_index, k)]
        missed_supported = [k for k in supported if k not in present]
        gaps = [k for k in keywords if k not in supported and k.lower() in required]
        weight = lambda k: 2.0 if k.lower() in required else 1.0  # noqa: E731
        denominator = sum(weight(k) for k in supported)
        coverage = (sum(weight(k) for k in present) / denominator) if denominator else 1.0
        return {
            "keywords": keywords,
            "supported": supported,
            "present": present,
            "missed_supported": missed_supported,
            "unsupported_requirements": gaps,
            "coverage": round(coverage, 4),
        }

    def _keywords(self, info: Dict[str, Any], issues: List[Issue]) -> float:
        if info["missed_supported"] and info["coverage"] < 0.85:
            issues.append(Issue(
                "keyword_alignment", "major" if info["coverage"] < self.thresholds["keyword_alignment"] else "minor",
                f"The job asks for these terms and the master resume supports them, but the resume omits them: {', '.join(info['missed_supported'][:12])}.",
                "Work them in where the candidate's own experience genuinely shows them, in natural sentences.",
            ))
        if info["unsupported_requirements"]:
            issues.append(Issue(
                "keyword_alignment", "minor",
                f"The candidate's source has no evidence for: {', '.join(info['unsupported_requirements'][:8])}.",
                "These are gaps. Do NOT add them.",
            ))
        return info["coverage"]

    # ------------------------------------------------------------------ factual accuracy

    def _factual(self, resume, index, classes, repairs, judge, issues) -> float:
        violations = find_violations(resume, index)
        score = 1.0 - 0.2 * violations["count"]
        for item in violations["items"]:
            issues.append(Issue(
                "factual_accuracy", "critical",
                f"Unsupported {item['type']} '{item['value']}' in {item['where']}.",
                "Remove it or use the master resume's own wording.",
            ))

        for bullet in classes["invented"]:
            score -= 0.15
            issues.append(Issue(
                "factual_accuracy", "critical",
                f"Bullet is not supported by the master resume: \"{bullet['text']}\"",
                "Rewrite it using only what the matching master bullet says.",
            ))

        if repairs:
            score -= min(0.25, 0.05 * len(repairs))
            kinds = sorted({r.get("type", "") for r in repairs})
            issues.append(Issue(
                "factual_accuracy", "major",
                f"The previous draft contained {len(repairs)} unsupported item(s) that had to be removed or reverted ({', '.join(kinds)}).",
                "Do not add facts, numbers or tools that are not in the master resume.",
            ))

        if judge:
            for claim in judge["unsupported_claims"]:
                if _verify_claim(claim, index):
                    score -= 0.1
                    issues.append(Issue("factual_accuracy", "critical", f"Reviewer flagged an unsupported claim: \"{claim}\"", "Remove it."))
        return score

    # ------------------------------------------------------------------ relevance

    def _relevance(self, bullets, resume, index, classes, kw, judge, issues) -> float:
        if index.experiences and not as_list(resume.get("professional_experiences")):
            issues.append(Issue("relevance", "critical", "The resume has no professional experience although the master resume does.", "Include the experiences most relevant to the job."))
            return 0.0

        supported = kw["supported"]
        if supported and (bullets or as_list(resume.get("projects"))):
            texts = bullets + [str(p.get("name") or "") for p in as_list(resume.get("projects")) if isinstance(p, dict)]
            hits = sum(1 for t in texts if any(_contains_phrase(t, k) or contains_term_text(t, k) for k in supported))
            selection = hits / len(texts) if texts else 1.0
        else:
            selection = 1.0

        total = classes["summary"]["total"]
        copy_ratio = classes["summary"]["copied"] / total if total else 0.0
        transformation = 1.0 - max(0.0, copy_ratio - config.ALLOWED_COPY_RATIO) / (1.0 - config.ALLOWED_COPY_RATIO)

        deterministic = 0.65 * selection + 0.35 * transformation
        if selection < 0.4:
            issues.append(Issue("relevance", "major", f"Only {int(selection * 100)}% of the bullets mention anything the job asks for.", "Prioritise and rewrite content that matches the job's requirements; drop unrelated bullets."))
        if copy_ratio > config.ALLOWED_COPY_RATIO:
            examples = "; ".join(f'"{c}"' for c in classes["summary"]["copied_examples"])
            issues.append(Issue("relevance", "major", f"{int(copy_ratio * 100)}% of the bullets are copied from the master resume without tailoring. Examples: {examples}", "Rewrite them to foreground what matters for this job, keeping every fact."))
        if judge and judge["copied"]:
            issues.append(Issue("relevance", "minor", f"Reviewer says these were copied without tailoring: {'; '.join(judge['copied'][:3])}", "Tailor the wording to the job."))
        return self._blend(deterministic, judge["relevance"] if judge else None)

    # ------------------------------------------------------------------ summary

    def _summary(self, summary, master, job_description, kw, index, judge, issues) -> float:
        if not summary.strip():
            issues.append(Issue("summary_quality", "critical", "The summary is empty.", "Write a 2-3 sentence summary specific to this candidate and role."))
            return 0.0

        words = word_count(summary)
        length = 1.0 if config.SUMMARY_WORDS_MIN <= words <= config.SUMMARY_WORDS_MAX else 0.4
        if length < 1.0:
            issues.append(Issue("summary_quality", "minor", f"The summary is {words} words.", f"Aim for {config.SUMMARY_WORDS_MIN}-{config.SUMMARY_WORDS_MAX} words."))

        lowered = summary.lower()
        generic_hits = [p for p in config.GENERIC_SUMMARY_PHRASES if p in lowered]
        generic = max(0.0, 1.0 - 0.34 * len(generic_hits))
        if generic_hits:
            issues.append(Issue("summary_quality", "major", f"The summary uses generic phrases: {', '.join(generic_hits)}.", "Replace them with specific strengths drawn from the candidate's real experience."))

        in_summary = [k for k in kw["supported"] if _contains_phrase(summary, k) or contains_term_text(summary, k)]
        keyword_part = min(1.0, len(in_summary) / 2)
        specific_terms = {stem(t) for t in tokenize(" ".join(index.skill_names))} | {
            stem(t) for e in index.experiences for t in tokenize(str(e.get("organization") or ""))
        }
        candidate_specific = 1.0 if (stemmed_tokens(summary) & specific_terms) or extract_numbers(summary) & index.numbers else 0.3
        specificity = (keyword_part + candidate_specific) / 2
        if specificity < 0.6:
            issues.append(Issue("summary_quality", "major", "The summary does not tie the candidate's real strengths to what this job asks for.", "Mention at least two job-relevant strengths from the candidate's actual experience."))

        originality = 1.0
        master_summary = master.get("summary") or ""
        if master_summary and similarity(summary, master_summary) >= 0.9:
            originality = 0.3
            issues.append(Issue("summary_quality", "major", "The summary is the master resume's summary, unchanged.", "Rewrite it for this job."))
        for sentence in split_sentences(job_description):
            if len(sentence.split()) >= 8 and similarity(summary, sentence) >= 0.8:
                originality *= 0.4
                issues.append(Issue("summary_quality", "major", "The summary copies a sentence from the job description.", "Describe the candidate, not the job."))
                break

        deterministic = (length + generic + specificity + originality) / 4
        return self._blend(deterministic, judge["summary_quality"] if judge else None)

    # ------------------------------------------------------------------ naturalness

    def _naturalness(self, summary, bullets, kw, judge, issues) -> float:
        text = " ".join([summary] + bullets)
        buzz = [w for w in config.BUZZWORDS if _contains_phrase(text, w)]
        penalty = min(0.45, 0.15 * len(buzz))
        if buzz:
            issues.append(Issue("naturalness", "minor", f"Buzzwords found: {', '.join(buzz)}.", "Use plain, specific verbs."))

        present = kw["present"]
        stuffed = [b for b in bullets if sum(1 for k in present if _contains_phrase(b, k)) > 4]
        if bullets:
            penalty += min(0.4, 0.8 * len(stuffed) / len(bullets))
        if stuffed:
            issues.append(Issue("naturalness", "major", f"{len(stuffed)} bullet(s) are stuffed with keywords.", "Keep at most two or three job terms per bullet, in a natural sentence."))
        if sum(1 for k in present if _contains_phrase(summary, k)) > 8:
            penalty += 0.2
            issues.append(Issue("naturalness", "major", "The summary lists too many job keywords in a row.", "Write it as a sentence a person would say."))

        long_bullets = [b for b in bullets if word_count(b) > config.BULLET_WORDS_MAX]
        if bullets and long_bullets:
            penalty += min(0.3, 0.3 * len(long_bullets) / len(bullets))

        deterministic = max(0.0, 1.0 - penalty)
        return self._blend(deterministic, judge["naturalness"] if judge else None)

    # ------------------------------------------------------------------ redundancy

    def _redundancy(self, summary, bullets, issues):
        info: Dict[str, Any] = {}
        pairs = 0
        for i in range(len(bullets)):
            for j in range(i + 1, len(bullets)):
                if similarity(bullets[i], bullets[j]) >= 0.8:
                    pairs += 1
        info["near_duplicate_pairs"] = pairs

        openers: Dict[str, int] = {}
        for b in bullets:
            toks = tokenize(b)
            if toks:
                openers[toks[0]] = openers.get(toks[0], 0) + 1
        repeated = {w: c for w, c in openers.items() if c > 2}
        excess = sum(c - 2 for c in repeated.values())
        info["repeated_openers"] = repeated

        trigrams: Dict[tuple, int] = {}
        total_trigrams = 0
        for b in bullets:
            toks = tokenize(b)
            for k in range(len(toks) - 2):
                tg = tuple(toks[k:k + 3])
                trigrams[tg] = trigrams.get(tg, 0) + 1
                total_trigrams += 1
        repeated_trigrams = sum(c - 1 for c in trigrams.values() if c > 1)
        rate = repeated_trigrams / total_trigrams if total_trigrams else 0.0
        info["repeated_trigram_rate"] = round(rate, 3)

        overlap = sum(1 for s in split_sentences(summary) if any(similarity(s, b) >= 0.8 for b in bullets))
        info["summary_bullet_overlap"] = overlap

        penalty = min(0.4, 0.2 * pairs) + min(0.5, 0.1 * excess) + min(0.4, 2.0 * rate) + 0.15 * overlap
        if pairs:
            issues.append(Issue("redundancy", "major", f"{pairs} pair(s) of bullets say nearly the same thing.", "Merge or drop the duplicates."))
        if repeated:
            issues.append(Issue("redundancy", "major", f"Too many bullets start with the same word: {', '.join(f'{w} x{c}' for w, c in repeated.items())}.", "Vary the opening verbs."))
        if rate > 0.15:
            issues.append(Issue("redundancy", "minor", "Phrases are repeated across bullets.", "Reword repeated phrases."))
        if overlap:
            issues.append(Issue("redundancy", "minor", "The summary repeats a bullet almost word for word.", "Keep the summary at a higher level."))
        return max(0.0, 1.0 - penalty), info

    # ------------------------------------------------------------------ structure

    def _structure(self, resume, index, issues):
        checks: Dict[str, bool] = {}
        summary = resume.get("summary") or ""
        checks["has_summary"] = bool(summary.strip())
        experiences = [e for e in as_list(resume.get("professional_experiences")) if isinstance(e, dict)]
        if index.experiences:
            checks["has_experience"] = bool(experiences)
        if index.skill_names:
            checks["has_skills"] = bool(as_list(resume.get("skills")))
        checks["experiences_complete"] = all(e.get("role") and e.get("organization") and as_bullets(e.get("responsibilities")) for e in experiences)
        checks["bullets_per_role_ok"] = all(len(as_bullets(e.get("responsibilities"))) <= config.BULLETS_PER_ROLE_MAX for e in experiences)
        checks["bullets_concise"] = all(word_count(b) <= config.BULLET_WORDS_MAX for e in experiences for b in as_bullets(e.get("responsibilities")))
        pi = resume.get("personal_information") or {}
        checks["contact_preserved"] = all(pi.get(k) for k in ("name", "email") if index.personal_information.get(k))
        names = [s.lower() for c in as_list(resume.get("skills")) if isinstance(c, dict) for s in as_list(c.get("skills")) if isinstance(s, str)]
        checks["no_duplicate_skills"] = len(names) == len(set(names))

        failed = [k for k, ok in checks.items() if not ok]
        for k in failed:
            issues.append(Issue("structure", "major" if k in ("has_summary", "has_experience") else "minor", f"Structure check failed: {k.replace('_', ' ')}.", ""))
        score = sum(checks.values()) / len(checks) if checks else 1.0
        return score, {"failed_checks": failed, "checks": checks}


def contains_term_text(text: str, term: str) -> bool:
    """Stem-aware phrase match inside a single piece of text (not the whole resume)."""
    parts = stemmed_tokens(term)
    return bool(parts) and parts <= stemmed_tokens(text)
