# Resume intelligence

Turns "AI generates a resume" into "AI generates, evaluates, improves and **measures** a truthful
resume against a specific job". It lives next to the existing AI services and is written as plain
application logic: no LangChain, LangGraph or other agent framework.

## The loop

```
Analyze -> Generate -> Evaluate -> Revise -> Re-evaluate -> Finalize
```

| Step | Where | What happens |
| --- | --- | --- |
| Analyze | `job_analysis.py` | Extracts required/preferred skills, responsibilities and keywords from the job description (LLM, with a deterministic fallback). |
| Generate | `generator.py`, `prompts.py` | The generation agent rewrites the master resume for this job. |
| Ground | `grounding.py` | Runs after **every** draft. Facts (employers, roles, dates, schools, certifications, contact details) are restored from the master resume. Invented skills, employers, numbers and tools are removed or reverted. A revision cannot drift from the source. |
| Evaluate | `evaluator.py` | A separate process scores the draft against the job description *and* the master resume. |
| Revise | `agent.py` | If the draft fails, structured feedback (severity, dimension, concrete instruction) goes back to the generator. Limited to `RESUME_MAX_REVISIONS` (default 2) and a time budget. |
| Finalize | `agent.py` | Picks the best draft: passing and fully grounded beats high-scoring but ungrounded. Any summary sentence with an unverifiable claim is dropped. |

Entry point for the API: `ai_services/resume_generation.py` (`generate_tailored_resume`).

## What the evaluator measures

Seven dimensions, each 0 to 1. A resume passes only if the weighted overall score reaches
**0.75** *and* every dimension reaches its own minimum (`config.py`).

| Dimension | Weight | Minimum | Measures |
| --- | --- | --- | --- |
| factual_accuracy | 0.25 | 0.95 | Numbers, technologies, employers, skills and bullets the master resume does not support. Strictest on purpose. |
| relevance | 0.20 | 0.55 | Does the content match what the job asks for, and was it tailored rather than copied? |
| keyword_alignment | 0.20 | 0.50 | Job terms the candidate really has and the resume shows. |
| summary_quality | 0.10 | 0.55 | Specific to the candidate and role; not generic, not copied from the master summary or the job post. |
| naturalness | 0.10 | 0.55 | No keyword stuffing, buzzwords or very long bullets. |
| redundancy | 0.10 | 0.60 | Duplicate bullets, repeated opening verbs and phrases. |
| structure | 0.05 | 0.80 | Summary, experience, skills present; roles complete; bullets concise; contact preserved. |

For every bullet the evaluator separates four cases:

* **transformed**: grounded in the source and meaningfully reworded
* **copied**: essentially verbatim from the source (some are fine; too many fail `relevance`)
* **invented**: not supported by the source (critical, fails `factual_accuracy`)
* **missed**: a job requirement the candidate *does* have but the resume omits. Requirements the
  candidate does **not** have are reported separately as *gaps* and must never be added.

Scoring is deterministic and offline, so results are repeatable. An optional LLM judge
(`RESUME_JUDGE_ENABLED=true`) can lower the subjective scores but can never raise them above the
offline evidence, and its "unsupported claim" reports are checked against the source before they count.

## Comparing prompts, models and workflows

* `benchmarks/cases.json`: three Master Resume + Job Description cases (strong match, partial
  match, large gaps), each with a hand-written reference tailoring.
* `benchmark.py`: `run_benchmark(workflow)` scores any `(master, job) -> resume` callable with the
  same fixed evaluator; `compare_reports(a, b)` returns per-dimension deltas.
* Every production generation stores a `ResumeEvaluation` row (scores, iterations, diagnostics,
  workflow/prompt/model versions). Bump `WORKFLOW_VERSION` / `PROMPT_VERSION` in `config.py` when
  you change the loop or prompts so the runs stay separable.

```bash
# unit tests (offline, no API key, no database)
cd backend && python -m unittest discover -s ai_services/tests -t .

# benchmark a real model (needs GROQ_API_KEY) and compare with an earlier run
python manage.py run_resume_benchmark --model <model name> --out runs/baseline.json
python manage.py run_resume_benchmark --model <other-model> --out runs/other.json --compare runs/baseline.json

# summarise stored production evaluations by workflow / prompt / model
python manage.py compare_resume_evaluations --days 30
```

## Configuration (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `RESUME_AGENT_ENABLED` | `true` | Set to `false` to go back to the previous single-shot generator. |
| `RESUME_MAX_REVISIONS` | `2` | Revision rounds after the first draft. |
| `RESUME_AGENT_TIME_BUDGET_SECONDS` | `40` | A revision is skipped if it would exceed this, so a slow model means fewer revisions, not a timeout. |
| `RESUME_JUDGE_ENABLED` | `false` | Adds one LLM judge call per evaluation. Useful when benchmarking. |
| `RESUME_GENERATOR_MODEL` / `RESUME_EVALUATOR_MODEL` | none (required) | Model names. Also `RESUME_EXTRACTION_MODEL` and `JOB_EXTRACTION_MODEL`. Read only in `ai_services/model_config.py`; see `backend/.env.example`. |
| `RESUME_MAX_OUTPUT_TOKENS` | `4096` | Output cap per call. Reasoning models need room to think and answer; too small gives an empty reply. |
| `RESUME_REASONING_EFFORT` | unset | low / medium / high. Sent with every call when set; set it only for reasoning models. |
| `RESUME_LOG_PREVIEW_CHARS` | `200` | Characters of each model reply written to the log; `0` logs no content. |

## Known limits

* The offline evaluator checks grounding by comparing words, numbers and names with the master
  resume. It catches invented numbers, tools, employers and skills well. It cannot judge whether a
  reworded sentence *means* the same thing; the optional judge and human review cover that.
* Keyword extraction from the job description is a heuristic when the model's analysis is
  unavailable, so it can include a few generic words.
* The calibration cases are small on purpose. Add cases to `cases.json` as real failures are found.

## Application creation (resume + cover letter)

`POST /applications/` (`api/views/applications.py`) calls `ai_services.application_generation.generate_application_documents`, which runs **both** documents through an agent loop:

1. `ResumeAgent` (analyze → generate → evaluate → revise → finalize) produces the tailored resume.
2. `CoverLetterAgent` reuses the job analysis and writes from the tailored resume, then runs the same loop with a separate `CoverLetterEvaluator`.

Cover letter specifics: the model returns only a greeting and body paragraphs. The header (name, city/country, phone, email, date) and the "Sincerely," + name sign-off are built from the master resume, so contact details cannot be invented and placeholders cannot appear. After every draft, sentences with numbers/tools/names unsupported by the master resume (or the job post) are dropped, as are first-person sentences claiming job tools the candidate lacks. The evaluator scores factual accuracy, relevance, specificity, naturalness, redundancy and structure (`LETTER_*` in `config.py`).

The resume and application are saved in one transaction only after both documents exist. Both evaluations are stored as `ResumeEvaluation` rows (`document_type` = `resume` / `cover_letter`, linked to the `application`) and a score summary is returned as `evaluation` in the response. `compare_resume_evaluations` groups by document type. `RESUME_AGENT_ENABLED=false` restores the single-shot generators; `RESUME_LETTER_TIME_BUDGET_SECONDS` bounds letter revisions. Apply migration `0024` before deploying.


## Generator and evaluator (v3: select, then tailor)

The resume generator first **selects** what is relevant to the job (experiences, projects, education, certifications, awards, skills) and then **tailors** it: bullets and project descriptions are reworded with the job description's keywords wherever the candidate's own work supports them, and the summary is rewritten. Facts, names, dates and numbers stay as in the master resume. The only style instruction is the buzzword list (`BUZZWORDS` in `config.py`); openings such as "I am excited to apply" are normal and not penalised, in the summary or the cover letter.

The separate evaluator checks: factual accuracy (numbers keep their `%`, so "40 store managers" cannot vouch for an invented "40%"), selectivity (unrelated projects, skills and experiences are flagged), relevance and tailoring (bullets copied unchanged are flagged), keyword alignment, summary quality, buzzwords, repetition and structure. Grounding then removes anything unsupported. Failures go back to the generator as feedback for up to `RESUME_MAX_REVISIONS` revisions.
