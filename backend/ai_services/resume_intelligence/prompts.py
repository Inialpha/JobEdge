"""All prompts used by the loop live here so they can be versioned and compared."""
import hashlib
import json
from typing import List, Optional

from .yaml_utils import to_yaml
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
{to_yaml(master)}

Job Description:
{job_description}

Return the tailored resume as JSON in exactly this schema:
{SCHEMA_BLOCK}"""


def build_revise_prompt(master: dict, job_description: str, analysis, style_hint: str, previous: dict, feedback: str) -> str:
    return f"""Master Resume:
{to_yaml(master)}

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
{to_yaml(master)}

Job description:
{job_description}

Job analysis:
{_analysis_block(analysis)}
{gap_block}
Return JSON: {{"greeting": "Dear Hiring Manager,", "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"]}}"""


def build_letter_revise_prompt(master: dict, job_description: str, analysis, style_hint: str, gaps: List[str], previous_paragraphs: List[str], feedback: str) -> str:
    gap_block = f"\nDo not mention or imply these (no evidence in the resume): {', '.join(gaps)}.\n" if gaps else ""
    return f"""Candidate's resume (the only source of truth about the candidate):
{to_yaml(master)}

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


# --------------------------------------------------------------------------- review (evaluator rewrites)

REVIEW_SYSTEM = f"""You are a senior resume editor. A junior writer tailored a candidate's master resume to a job description. Review the draft against the master resume and the job description, then return the corrected, final resume.

Check and fix:
- Selection: only the experiences, projects, education, certifications, awards and skills relevant to the job are kept.
- Truth: every fact, number, tool, employer, title, date and name must be in the master resume. Remove or correct anything that is not. Use a job keyword only where the candidate's own work supports it.
- Tailoring: bullets and project descriptions use the job description's keywords and terminology where supported, with the most relevant points first, one clear sentence each.
- Summary: a natural professional summary of 2-4 sentences stating who the candidate is, the relevant experience and strengths, and the value they bring to this job.
- Avoid these words: {_avoid_words()}.

A checker has also listed problems it found. Fix them, and anything else you notice. Return valid JSON in the same schema as the draft."""


def build_review_prompt(master: dict, job_description: str, draft: dict, feedback: str) -> str:
    return f"""Master Resume:
{to_yaml(master)}

Job Description:
{job_description}

Junior's draft:
{json.dumps(draft, indent=2, default=str)}

Checker's findings:
{feedback}

Return the final resume as JSON in exactly this schema:
{SCHEMA_BLOCK}"""


LETTER_REVIEW_SYSTEM = f"""You are a senior editor of cover letters. A junior writer drafted a cover letter for a candidate. Review the draft against the candidate's resume and the job description, then return the corrected, final letter.

Check and fix:
- A proper warm opening that shows enthusiasm for the role, 2-3 real achievements from the resume tied to the job, why the candidate fits, and a closing call to action with thanks.
- 3-4 paragraphs, about 250-350 words.
- Only experience, tools and numbers that appear in the candidate's resume. Remove anything else.
- The header, date, sign-off and the candidate's name are added automatically, so do not write them.
- Avoid these words: {_avoid_words()}.

A checker has also listed problems it found. Fix them, and anything else you notice.

Return only JSON: {{"greeting": "Dear Hiring Manager,", "paragraphs": ["...", "..."]}}"""


def build_letter_review_prompt(master: dict, job_description: str, gaps: List[str], paragraphs: List[str], feedback: str) -> str:
    gap_block = f"\nThe job asks for these but the resume has no evidence of them, so the letter must not mention or imply them: {', '.join(gaps)}.\n" if gaps else ""
    return f"""Candidate's resume (the only source of truth about the candidate):
{to_yaml(master)}

Job description:
{job_description}
{gap_block}
Junior's draft (body paragraphs):
{json.dumps(paragraphs, indent=2)}

Checker's findings:
{feedback}

Return JSON: {{"greeting": "Dear Hiring Manager,", "paragraphs": ["...", "..."]}}"""


# --------------------------------------------------------------------------- single call (v4)
# One model call writes the whole resume, working through the tasks in order. All teaching material
# (principles and wrong/right examples) lives in the SYSTEM prompt; the user prompt carries only the
# candidate's data and the task. Examples are from unrelated fields and show shape only.

SINGLE_SYSTEM = f"""You are an expert resume writer and recruiter. You tailor a candidate's master resume to one job description so that it is truthful, relevant, measurable where possible, and readable by both applicant tracking systems (ATS) and human recruiters.

You will receive the candidate's master resume (YAML) and a job description. Work through the tasks below in order, and use what you decided in earlier tasks in later ones. Return the result as JSON whose fields follow the same order.

TASKS

1. Read the job description. Note the required and preferred skills and tools, the main responsibilities, the qualifications and the industry terminology it uses.

2. Skills. Select only the skills from the master resume that this job needs. Do not list every skill the candidate has. Compare the candidate's wording with the job's wording. When they mean the same thing, use the job's wording (for example the master resume says "Software Developer" or "ReactJS" and the job says "Software Engineer" or "React"), and record every such change in keyword_alignments as {{"from": "term as in the master resume", "to": "term as in the job description"}}. Never add a skill, tool or technology the master resume does not support.

3. Professional experience. Select the experiences that align with the job, then check the keywords and tailor the bullets of each selected experience. Keep organizations, job titles, dates and locations exactly as in the master resume.

4. Projects. Select the projects that are relevant to the job and tailor their descriptions in the same way.

5. Education, certifications and awards. Keep the qualifications that support this job. Omit secondary school certificates when the candidate has a higher qualification, unless the job asks for them. Keep only the certifications and awards that are relevant to the job.

6. Summary, written last. Use everything you selected above. The summary is at most three sentences and states: (a) the candidate's professional identity, (b) two or three of the most important tools or skills for this job, and (c) their relevant experience and impact, with a measurable result only if the master resume contains one. Adapt it to the candidate: an experienced professional emphasises years of experience, proven expertise, tools and results; a recent graduate or entry-level candidate emphasises education, training, projects, relevant skills and the role being targeted; a career changer emphasises transferable skills and relevant training or certification for the new direction. Never claim achievements the candidate does not have.

HOW TO WRITE EXPERIENCE BULLETS AND PROJECT DESCRIPTIONS
- Start with a strong action verb (Developed, Designed, Implemented, Optimised, Automated, Managed, Led) instead of a passive phrase such as "Responsible for" or "Worked on".
- Each bullet shows the action, the method (the tools or approach used) and the result. Include a metric only when the master resume contains it; otherwise describe the concrete outcome without a number.
- Use present tense for the current job and past tense for previous jobs.
- A project description says what was built, the tools and methods used, and what it achieved or solved. A project does not need thousands of users to be worth showing.
- Weave job keywords into bullets naturally, where the candidate really did that work. Do not repeat keywords for the sake of it.

TRUTH
- Every fact, number, tool, employer, title, date and name comes from the master resume. You change wording, order and emphasis, and you may swap terminology as described in task 2. You never add achievements, tools, numbers or responsibilities.
- Do not use these words: {_avoid_words()}.

EXAMPLES (from unrelated fields; they show the shape of good and bad writing only. Never reuse their facts, numbers or wording.)

Summary, wrong:
- "Hardworking professional looking for an opportunity to grow in a dynamic company where I can use my skills."
  Why it fails: no identity, no tools, no evidence, could describe anyone.
- "Nurse with many skills who is good at working with patients and team members and is passionate about healthcare and learning new things and growing."
  Why it fails: vague, filler, no specifics, too long.
Summary, right:
- "Registered nurse with 6 years of emergency-ward experience in triage, patient monitoring and electronic health records, who cut average triage time through a revised intake checklist."
- "Logistics coordinator with 4 years of experience in route planning, SAP and warehouse reporting, improving on-time delivery by streamlining dispatch schedules."

Experience bullet, wrong:
- "Responsible for handling customer complaints."
  Why it fails: passive, no method, no result.
- "Worked on the website and did many different tasks for the team."
  Why it fails: vague, no action, tools or outcome.
Experience bullet, right:
- "Resolved an average of 40 customer complaints daily by applying a ticket-priority system, keeping first-response time within one hour."
- "Redesigned the monthly stock-count process in Excel with lookup formulas, removing manual re-entry and reducing counting errors."

Project description, wrong:
- "Made a website for a school."
  Why it fails: no tools, no purpose, no outcome.
- "A mobile app project that I worked on with friends."
  Why it fails: says nothing about what it does or what was built.
Project description, right:
- "Built a class-attendance tracker with Flask and SQLite that lets teachers record attendance in two taps and export weekly reports."
- "Designed a booking site for a local clinic in HTML, CSS and JavaScript, replacing phone scheduling with an online appointment form."
"""

SINGLE_SCHEMA = """{
  "keyword_alignments": [{"from": "term as in the master resume", "to": "term as in the job description"}],
  "skills": [{"category": "category name", "skills": ["only relevant skills from the master resume"]}],
  "professional_experiences": [{"organization": "exact", "role": "exact", "responsibilities": ["tailored bullets"]}],
  "projects": [{"name": "exact name", "description": "tailored description"}],
  "educations": [{"institution": "exact"}],
  "certifications": [{"name": "exact"}],
  "awards": [{"title": "exact"}],
  "summary": "written last, from everything above"
}"""


def build_single_prompt(master: dict, job_description: str) -> str:
    return f"""Master resume (YAML):
{to_yaml(master)}

Job description:
{job_description}

Do the tasks in order and return only JSON in exactly this shape (fields in this order, leave out nothing that applies, use an empty list when a section does not apply):
{SINGLE_SCHEMA}"""
