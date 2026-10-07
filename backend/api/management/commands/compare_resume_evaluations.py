"""Compare the stored evaluations of real generated resumes by workflow, prompt and model.

    python manage.py compare_resume_evaluations --days 30
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from ai_services.resume_intelligence.reporting import aggregate_evaluations, format_table
from api.models import ResumeEvaluation


class Command(BaseCommand):
    help = "Summarise stored resume evaluations grouped by workflow version, prompt version and model"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=0, help="Only include evaluations from the last N days (0 = all)")

    def handle(self, *args, **options):
        queryset = ResumeEvaluation.objects.all()
        if options["days"] > 0:
            queryset = queryset.filter(created_at__gte=timezone.now() - timedelta(days=options["days"]))
        rows = queryset.values("workflow_version", "prompt_version", "generator_model", "overall_score", "passed", "scores", "report")
        self.stdout.write(format_table(aggregate_evaluations(rows)))
