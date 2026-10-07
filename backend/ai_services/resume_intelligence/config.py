"""Central configuration for the resume intelligence workflow.

Everything that decides "is this resume good enough?" lives here so that
prompts, models and workflows can be compared against the same criteria.
Bump ``WORKFLOW_VERSION`` / ``PROMPT_VERSION`` whenever the loop or prompts
change, because evaluation runs are stored with these labels.
"""
import os

WORKFLOW_VERSION = "agent-loop-v1"
PROMPT_VERSION = "grounded-transform-v1"

GENERATOR_MODEL = os.getenv("RESUME_GENERATOR_MODEL", "llama-3.3-70b-versatile")
EVALUATOR_MODEL = os.getenv("RESUME_EVALUATOR_MODEL", "llama-3.3-70b-versatile")

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
    "relevance": 0.20,
    "keyword_alignment": 0.20,
    "factual_accuracy": 0.25,
    "summary_quality": 0.10,
    "naturalness": 0.10,
    "redundancy": 0.10,
    "structure": 0.05,
}

# A resume passes only if the weighted overall score reaches OVERALL_THRESHOLD
# AND every dimension reaches its own minimum. Factual accuracy is the strictest
# because a polished but untrue resume is worse than a plain one.
OVERALL_THRESHOLD = 0.75
DIMENSION_THRESHOLDS = {
    "relevance": 0.55,
    "keyword_alignment": 0.50,
    "factual_accuracy": 0.95,
    "summary_quality": 0.55,
    "naturalness": 0.55,
    "redundancy": 0.60,
    "structure": 0.80,
}

# Bullet classification (similarity of an output bullet to its closest source bullet).
COPY_SIMILARITY = 0.92          # at or above: copied without transformation
MATCH_SIMILARITY = 0.30         # below: not traceable to any source bullet
MIN_GROUNDED_TOKEN_RATIO = 0.50  # share of a bullet's content words found in the source
ALLOWED_COPY_RATIO = 0.40       # up to 40% of bullets may be kept as-is (they may already be strong)

SUMMARY_WORDS_MIN = 25
SUMMARY_WORDS_MAX = 120
BULLET_WORDS_MAX = 45
BULLETS_PER_ROLE_MAX = 7

GENERIC_SUMMARY_PHRASES = (
    "results-driven", "results driven", "detail-oriented", "detail oriented",
    "team player", "hard-working", "hard working", "passionate", "dynamic",
    "self-motivated", "proven track record", "seeking", "looking for",
    "fast-paced", "highly motivated", "go-getter", "think outside the box",
    "excellent communication skills", "motivated professional",
)

BUZZWORDS = (
    "synergy", "synergize", "spearheaded", "cutting-edge", "best-in-class",
    "world-class", "seamless", "holistic", "game-changing", "paradigm",
    "revolutionary", "next-generation", "leverage", "leveraged", "robust",
)
