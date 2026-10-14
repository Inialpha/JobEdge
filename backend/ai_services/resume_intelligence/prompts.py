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

def _avoid_words() -> str:
    from .config import BUZZWORDS

    return ", ".join(BUZZWORDS)


GENERATE_SYSTEM = f"""You are a human resource expert specializing in tailoring resumes to fit specific job descriptions. Create a tailored resume from the candidate's master resume that aligns with the job description.

How to build it:
1. Select. Keep only the professional experiences, educations, projects, certifications and awards that are relevant to the job, and the skills that are relevant to the job. Leave out the rest.
2. Tailor. Rewrite the selected experience bullets and project descriptions so they speak to this job. Use the job description's keywords and terminology wherever the candidate's own bullet supports them, put the most relevant points first, and keep each bullet to one clear sentence. Keep the original meaning and every real number, and keep names, employers, titles, dates, institutions and certification names exactly as in the master resume.
3. Stay true to the master resume. The tailoring changes wording and emphasis only. It never adds achievements, tools, numbers or responsibilities that the master resume does not contain, and it uses a job keyword only where the candidate really did that.
4. Summary. Write an optimised professional summary (2-4 sentences) that captures the candidate's value proposition and relevance to this job: who they are, the experience and strengths that matter here, and what they bring.
5. Do not use these words: {_avoid_words()}.

Return valid JSON in the requested schema."""

SCHEMA_BLOCK = """{
  "keywords": ["terms from the candidate's real skills and experience that matter for this job"],
  "summary": "the optimised professional summary",
  "personal_information": {"name": "...", "email": "...", "phone": "...", "address": "...", "linkedin": "...", "website": "...", "profession": "..."},
  "professional_experiences": [
    {"organization": "exact", "role": "exact", "start_date": "exact", "end_date": "exact", "location": "exact",
     "responsibilities": ["tailored bullets: job keywords where supported, same facts and numbers"]}
  ],
  "skills": [{"category": "category name", "skills": ["only skills from the master resume that are relevant to the job"]}],
  "projects": [{"name": "exact name", "description": "tailored description: job keywords where supported, same facts and numbers"}],
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


def build_generate_prompt(master: dict, job_description: str, analysis, style_hint: str = "") -> str:
    return f"""Master Resume:
{json.dumps(master, indent=2, default=str)}

Job Description:
{job_description}

Return the tailored resume as JSON in exactly this schema:
{SCHEMA_BLOCK}"""


def build_revise_prompt(master: dict, job_description: str, analysis, style_hint: str, previous: dict, feedback: str) -> str:
    return f"""Master Resume:
{json.dumps(master, indent=2, default=str)}

Job Description:
{job_description}

Your previous draft:
{json.dumps(previous, indent=2, default=str)}

A reviewer checked the draft and found these problems:
{feedback}

Fix them. Keep what already works. Facts, names, dates and numbers must stay as in the master resume; anything the reviewer lists as not in the master resume must be removed, and use job keywords only where the candidate's own experience supports them.

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


# --------------------------------------------------------------------------- cover letters

LETTER_SYSTEM = f"""You are a professional cover letter writer with expertise in creating compelling, personalized cover letters that highlight a candidate's qualifications and align them with job requirements. Your letters are professional, warm, engaging and tailored to each role.

What to write:
1. Start with a proper opening that greets the reader and shows enthusiasm for the role and an understanding of it (for example that you are excited to apply).
2. Highlight 2-3 key experiences or achievements from the candidate's resume that relate directly to the job.
3. Explain why the candidate is a good fit for this role and company, using what the job description says about them.
4. Close with a call to action and a polite thank-you.
5. Write 3-4 paragraphs, about 250-350 words, in a professional but warm tone.
6. Only mention experience, tools and numbers that appear in the candidate's resume.
7. The header, date, sign-off and the candidate's name are added automatically, so do not write them.
8. Do not use these words: {_avoid_words()}.

Return only JSON: {{"greeting": "Dear Hiring Manager,", "paragraphs": ["...", "..."]}}"""

LETTER_STYLE_HINTS: List[str] = [
    "Open with the single most relevant achievement from the resume.",
    "Open with what attracts the candidate to this kind of work, then connect it to their real background.",
    "Open with the candidate's core strengths for this role in one confident sentence.",
]


def pick_letter_style_hint(master: dict, job_description: str, seed: Optional[int] = None) -> str:
    if seed is None:
        digest = hashlib.sha256(("letter" + json.dumps(master, sort_keys=True, default=str) + job_description).encode()).hexdigest()
        seed = int(digest[:8], 16)
    return LETTER_STYLE_HINTS[seed % len(LETTER_STYLE_HINTS)]


def build_letter_prompt(master: dict, job_description: str, analysis, style_hint: str, gaps: List[str]) -> str:
    gap_block = ""
    if gaps:
        gap_block = f"\nThe job asks for these, but the candidate's resume has no evidence of them. Do not mention or imply them: {', '.join(gaps)}.\n"
    return f"""Candidate's resume (the only source of truth about the candidate):
{json.dumps(master, indent=2, default=str)}

Job description:
{job_description}

Job analysis:
{_analysis_block(analysis)}
{gap_block}
Return JSON: {{"greeting": "Dear Hiring Manager,", "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"]}}"""


def build_letter_revise_prompt(master: dict, job_description: str, analysis, style_hint: str, gaps: List[str], previous_paragraphs: List[str], feedback: str) -> str:
    gap_block = f"\nDo not mention or imply these (no evidence in the resume): {', '.join(gaps)}.\n" if gaps else ""
    return f"""Candidate's resume (the only source of truth about the candidate):
{json.dumps(master, indent=2, default=str)}

Job description:
{job_description}

Job analysis:
{_analysis_block(analysis)}
{gap_block}
Your previous letter (body paragraphs):
{json.dumps(previous_paragraphs, indent=2)}

An independent evaluator found these problems:
{feedback}

Rewrite the letter to fix every problem. Keep what already works. Only use facts from the resume; remove anything the evaluator marks as unsupported. Still no header, contact details, date, sign-off or name.

Return JSON: {{"greeting": "Dear Hiring Manager,", "paragraphs": ["...", "..."]}}"""
