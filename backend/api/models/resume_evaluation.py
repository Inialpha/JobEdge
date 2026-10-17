import logging

from django.db import models

from . import User
from .base_model import BaseModel

logger = logging.getLogger("api")


class ResumeEvaluation(BaseModel):
    """The measured quality of one generated document (a tailored resume or a cover letter).

    Rows are kept so different prompts, models and workflows can be compared objectively
    (see the ``compare_resume_evaluations`` management command).
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resume_evaluations", help_text="User the resume was generated for")
    DOCUMENT_TYPES = [("resume", "Resume"), ("cover_letter", "Cover letter")]

    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default="resume", db_index=True, help_text="Which document was evaluated")
    application = models.ForeignKey("Application", null=True, blank=True, on_delete=models.SET_NULL, related_name="evaluations", help_text="Application the document was created for, if any")
    job_description = models.TextField(help_text="Job description the document was tailored to")
    workflow_version = models.CharField(max_length=64, help_text="Version of the generation/evaluation loop")
    prompt_version = models.CharField(max_length=64, help_text="Version of the prompts used")
    generator_model = models.CharField(max_length=128, help_text="Model that wrote the resume")
    evaluator_model = models.CharField(max_length=128, blank=True, default="", help_text="Model used as judge, if any")
    overall_score = models.FloatField(help_text="Weighted overall score from 0 to 1")
    passed = models.BooleanField(default=False, help_text="Whether the resume met every quality threshold")
    scores = models.JSONField(default=dict, help_text="Score per evaluation dimension")
    report = models.JSONField(default=dict, help_text="Full evaluation report: iterations, diagnostics, issues")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Evaluation {self.overall_score:.2f} ({'pass' if self.passed else 'fail'}) {self.workflow_version}"

    @classmethod
    def record(cls, user, job_description: str, report: dict, document_type: str = "resume", application=None):
        """Store an evaluation report. Returns None (and logs) if saving fails, because a
        storage problem must never block the user from getting their resume."""
        try:
            return cls.objects.create(
                user=user,
                document_type=document_type,
                application=application,
                job_description=job_description,
                workflow_version=str(report.get("workflow_version", ""))[:64],
                prompt_version=str(report.get("prompt_version", ""))[:64],
                generator_model=str(report.get("generator_model", ""))[:128],
                evaluator_model=str(report.get("evaluator_model", ""))[:128],
                overall_score=float(report.get("overall", 0.0)),
                passed=bool(report.get("passed", False)),
                scores=report.get("scores", {}),
                report=report,
            )
        except Exception:
            logger.exception("Could not store %s evaluation", document_type)
            return None
