"""Resume intelligence: analyze -> generate -> evaluate -> revise -> finalize.

Public entry points:

* ``ResumeAgent`` - the direct (framework-free) agent loop.
* ``ResumeEvaluator`` - measures a resume against a job description and its source.
* ``run_benchmark`` - runs a workflow over the fixed benchmark cases.
"""
from .agent import AgentResult, ResumeAgent  # noqa: F401
from .evaluator import EvaluationResult, ResumeEvaluator  # noqa: F401
