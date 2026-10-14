"""Central configuration for the resume intelligence workflow.

Everything that decides "is this resume good enough?" lives here so that
prompts, models and workflows can be compared against the same criteria.
Bump ``WORKFLOW_VERSION`` / ``PROMPT_VERSION`` whenever the loop or prompts
change, because evaluation runs are stored with these labels.
"""
import os
from dotenv import load_dotenv
load_dotenv()

WORKFLOW_VERSION = "generator-evaluator-v2"
PROMPT_VERSION = "select-tailor-v3"

GENERATOR_MODEL = os.getenv("RESUME_GENERATOR_MODEL", "llama-3.3-70b-versatile")
EVALUATOR_MODEL = os.getenv("RESUME_EVALUATOR_MODEL", "llama-3.3-70b-versatile")

# Output cap per model call. Reasoning models (e.g. openai/gpt-oss-*) spend part of this on hidden
# thinking before writing the answer; with a small cap they return an EMPTY reply (finish_reason=length).
MAX_OUTPUT_TOKENS = int(os.getenv("RESUME_MAX_OUTPUT_TOKENS", "4096"))
# "low" keeps reasoning models from thinking for most of the budget. Sent only to gpt-oss models,
# or to any model when RESUME_REASONING_EFFORT is set (low | medium | high).
REASONING_EFFORT = os.getenv("RESUME_REASONING_EFFORT", "low")

GENERATOR_TEMPERATURE = 0.5  # some variation in wording
EVALUATOR_TEMPERATURE = 0.0  # judging should be repeatable

# Number of Revise -> Re-evaluate rounds after the first draft.
MAX_REVISIONS = int(os.getenv("RESUME_MAX_REVISIONS", "2"))

# The loop makes several model calls inside one web request. A revision is skipped when
# (time already spent + the duration of the last generation call) would exceed this budget,
# so a slow model degrades to "fewer revisions" instead of a gateway timeout.
MAX_SECONDS = float(os.getenv("RESUME_AGENT_TIME_BUDGET_SECONDS", "40"))

# The LLM judge adds one extra model call per evaluation. It is off by default in production
# (the deterministic checks already cover grounding, keywords, redundancy and structure) and
# is mainly useful when benchmarking models offline.
JUDGE_ENABLED = os.getenv("RESUME_JUDGE_ENABLED", "false").lower() in ("1", "true", "yes")

# Safety valve: set to "false" to fall back to the previous single-shot generator.
AGENT_ENABLED = os.getenv("RESUME_AGENT_ENABLED", "true").lower() in ("1", "true", "yes")

# Weights must sum to 1.0.
WEIGHTS = {
    "relevance": 0.15,
    "selectivity": 0.20,   # only the projects and skills that relate to the job were kept
    "keyword_alignment": 0.15,
    "factual_accuracy": 0.25,
    "summary_quality": 0.10,
    "naturalness": 0.05,
    "redundancy": 0.05,
    "structure": 0.05,
}

# A resume passes only if the weighted overall score reaches OVERALL_THRESHOLD
# AND every dimension reaches its own minimum. Factual accuracy is the strictest
# because a polished but untrue resume is worse than a plain one.
OVERALL_THRESHOLD = 0.75
DIMENSION_THRESHOLDS = {
    "relevance": 0.55,
    "selectivity": 0.50,
    "keyword_alignment": 0.50,
    "factual_accuracy": 0.95,
    "summary_quality": 0.55,
    "naturalness": 0.55,
    "redundancy": 0.60,
    "structure": 0.80,
}

# Bullet classification (similarity of an output bullet to its closest source bullet).
COPY_SIMILARITY = 0.92          # at or above: copied without tailoring
MATCH_SIMILARITY = 0.30         # below: not traceable to any source bullet
MIN_GROUNDED_TOKEN_RATIO = 0.50  # share of a bullet's content words found in the source
ALLOWED_COPY_RATIO = 0.4        # a few strong bullets may stay as they are

SUMMARY_WORDS_MIN = 25
SUMMARY_WORDS_MAX = 120
BULLET_WORDS_MAX = 45
BULLETS_PER_ROLE_MAX = 7


# The only words the generator is told to avoid, and the only style the evaluator checks.
BUZZWORDS = (
    "synergy", "synergize", "spearheaded", "cutting-edge", "best-in-class",
    "world-class", "seamless", "holistic", "game-changing", "paradigm",
    "revolutionary", "next-generation", "leverage", "leveraged", "robust",
)


# --------------------------------------------------------------------------- cover letters

LETTER_PROMPT_VERSION = "cover-letter-simple-v2"

# Same idea as the resume budget; the application endpoint runs the resume loop and then this one.
LETTER_MAX_SECONDS = float(os.getenv("RESUME_LETTER_TIME_BUDGET_SECONDS", "30"))

LETTER_WEIGHTS = {
    "factual_accuracy": 0.30,
    "relevance": 0.20,
    "specificity": 0.15,
    "naturalness": 0.10,
    "redundancy": 0.05,
    "structure": 0.20,
}
LETTER_OVERALL_THRESHOLD = 0.75
LETTER_DIMENSION_THRESHOLDS = {
    "factual_accuracy": 0.95,
    "relevance": 0.50,
    "specificity": 0.50,
    "naturalness": 0.55,
    "redundancy": 0.60,
    "structure": 0.85,
}

# The prompt asks for 250-350 words; the check allows a little slack either way.
LETTER_WORDS_MIN = 220
LETTER_WORDS_MAX = 380
LETTER_PARAGRAPHS_MIN = 3
LETTER_PARAGRAPHS_MAX = 5
LETTER_COPY_SIMILARITY = 0.85  # a sentence this close to a resume bullet was pasted, not written

