"""All prompts used by the loop live here so they can be versioned and compared."""
import hashlib
import json
from typing import List, Optional

from .config import PROMPT_VERSION  # noqa: F401  (re-exported for convenience)

# --------------------------------------------------------------------------- analysis

ANALYZE_SYSTEM = (
    "You analyse job descriptions for a resume-tailoring system. "
    "Return only valid JSON. Do not add commentary."
)


def build_analyze_prompt(job_description: str) -> str:
    return f"""Read this job description and extract what a resume should be matched against.

Job Description:
{job_description}

Return JSON with exactly these keys:
{{
  "title": "the job title",
  "required_skills": ["skills, tools, technologies and qualifications the job clearly requires"],
  "preferred_skills": ["nice-to-have skills and tools"],
  "responsibilities": ["the 3-6 main responsibilities, short phrases"],
  "keywords": ["other domain terms an applicant tracking system would look for"]
}}
Use the job description's own wording. Do not invent requirements."""


# --------------------------------------------------------------------------- generation

GENERATE_SYSTEM = """You are an expert resume writer who tailors a candidate's resume to one specific job.

TRUTH RULES (absolute, they override everything else):
- Use only facts that are in the master resume. Never add achievements, responsibilities, tools, technologies, metrics, numbers, percentages, employers, roles, dates, degrees or certifications that are not there.
- Never state years of experience, team sizes, revenue, or any figure unless that exact figure is in the master resume.
- Names, employers, job titles, dates, locations, institutions, degrees, certification names and project names must be copied exactly from the master resume.
- If the job asks for something the candidate does not have, leave it out. Do not hint at it.

HOW TO TAILOR (this is the real job):
- Do not copy bullets verbatim. Rewrite each selected bullet so it highlights what matters for THIS job, using the job's terminology only where the candidate's own bullet already supports it. Keep the original meaning and every real number.
- Select and order content by relevance to the job: most relevant experiences, projects and skills first. Drop what is irrelevant.
- Vary sentence structure. Do not start more than two bullets with the same verb. One sentence per bullet, at most 35 words.
- Do not stuff keywords. A bullet should read like something a person wrote.

SUMMARY:
- 2-3 sentences, 40-80 words, written for this candidate and this role. No first person.
- Name at least two real strengths of the candidate that matter to the job, grounded in their actual experience.
- Do not copy the master resume's summary or sentences from the job description.
- Avoid cliches such as "results-driven", "detail-oriented", "team player", "passionate", "proven track record", "seeking".

Return only valid JSON in the requested schema."""

SCHEMA_BLOCK = """{
  "keywords": ["terms from the candidate's real skills and experience that matter for this job"],
  "summary": "tailored summary",
  "personal_information": {"name": "...", "email": "...", "phone": "...", "address": "...", "linkedin": "...", "website": "...", "profession": "..."},
  "professional_experiences": [
    {"organization": "exact", "role": "exact", "start_date": "exact", "end_date": "exact", "location": "exact",
     "responsibilities": ["rewritten, grounded bullets"]}
  ],
  "skills": [{"category": "category name", "skills": ["only skills present in the master resume"]}],
  "projects": [{"name": "exact name", "description": "rewritten, grounded description"}],
  "educations": [{"institution": "exact", "certificate": "exact", "start_date": "exact", "end_date": "exact"}],
  "certifications": [{"name": "exact", "issuer": "exact", "year": "exact"}],
  "awards": [{"title": "exact", "organization": "exact", "year": "exact"}],
  "languages": ["languages from the master resume"]
}"""

STYLE_HINTS: List[str] = [
    "Open the summary with the candidate's strongest accomplishment that is relevant to this job.",
    "Open the summary with the candidate's core technical stack and the domain they have applied it in.",
    "Open the summary with the kind of problems the candidate has solved that match the job's main responsibilities.",
    "Open the summary with the candidate's profession and two job-relevant strengths, and close with a concrete outcome from their work.",
]


def pick_style_hint(master: dict, job_description: str, seed: Optional[int] = None) -> str:
    """Controlled variation: the hint is deterministic for a (resume, job) pair unless a seed is given."""
    if seed is None:
        digest = hashlib.sha256((json.dumps(master, sort_keys=True, default=str) + job_description).encode()).hexdigest()
        seed = int(digest[:8], 16)
    return STYLE_HINTS[seed % len(STYLE_HINTS)]


def _analysis_block(analysis) -> str:
    return json.dumps(
        {
            "title": analysis.title,
            "required_skills": analysis.required_skills,
            "preferred_skills": analysis.preferred_skills,
            "responsibilities": analysis.responsibilities,
            "keywords": analysis.keywords,
        },
        indent=2,
    )


def build_generate_prompt(master: dict, job_description: str, analysis, style_hint: str) -> str:
    return f"""Master resume (the only source of truth):
{json.dumps(master, indent=2, default=str)}

Job description:
{job_description}

Job analysis (what the job asks for; only use items the master resume supports):
{_analysis_block(analysis)}

Style for this draft: {style_hint}

Return the tailored resume as JSON in exactly this schema:
{SCHEMA_BLOCK}"""


def build_revise_prompt(master: dict, job_description: str, analysis, style_hint: str, previous: dict, feedback: str) -> str:
    return f"""Master resume (the only source of truth):
{json.dumps(master, indent=2, default=str)}

Job description:
{job_description}

Job analysis:
{_analysis_block(analysis)}

Style for this draft: {style_hint}

Your previous draft:
{json.dumps(previous, indent=2, default=str)}

An independent evaluator found these problems with the previous draft:
{feedback}

Revise the draft to fix every problem. Keep what already works. You may only use facts from the master resume: if the evaluator lists something as invented or unsupported, remove it or restore the master resume's wording. Do not add keywords that the master resume does not support.

Return the revised resume as JSON in exactly this schema:
{SCHEMA_BLOCK}"""


# --------------------------------------------------------------------------- judging

JUDGE_SYSTEM = (
    "You are a strict resume reviewer. You compare a generated resume with the candidate's master resume "
    "and a job description. You never reward a claim that is not in the master resume. Return only valid JSON."
)


def build_judge_prompt(resume: dict, master: dict, job_description: str, analysis) -> str:
    return f"""Job description:
{job_description}

Key requirements: {json.dumps(analysis.keywords)}

Master resume (source of truth):
{json.dumps(master, default=str)}

Generated resume to evaluate:
{json.dumps(resume, default=str)}

Score each item from 0.0 to 1.0.
- relevance: does the generated resume select and prioritise the master resume content that matters most for this job?
- summary_quality: is the summary specific to this candidate and role (not generic, not copied)?
- naturalness: does it read like a person wrote it (no keyword stuffing, no buzzword pile-ups)?

Also list:
- unsupported_claims: any statement in the generated resume that the master resume does not support (quote it).
- copied_without_transformation: bullets copied from the master resume that should have been tailored to the job.
- generic_phrases: generic or cliched phrases.
- feedback: up to 5 concrete, actionable instructions for improving the resume.

Return JSON:
{{"relevance": 0.0, "summary_quality": 0.0, "naturalness": 0.0, "unsupported_claims": [], "copied_without_transformation": [], "generic_phrases": [], "feedback": []}}"""
