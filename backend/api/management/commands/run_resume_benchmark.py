"""Run the resume benchmark against a real model and (optionally) compare it with an earlier run.

    python manage.py run_resume_benchmark --model llama-3.3-70b-versatile --out runs/baseline.json
    python manage.py run_resume_benchmark --model other-model --out runs/other.json --compare runs/baseline.json

Every run is scored by the same offline evaluator on the same cases
(ai_services/resume_intelligence/benchmarks/cases.json), so the numbers are comparable.
"""
import json

from django.core.management.base import BaseCommand, CommandError

from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.agent import ResumeAgent
from ai_services.resume_intelligence.benchmark import agent_workflow, compare_reports, run_benchmark, save_report
from ai_services.resume_intelligence.llm import GroqLLM


class Command(BaseCommand):
    help = "Run the resume benchmark with the generation loop and print/save the scores"

    def add_arguments(self, parser):
        parser.add_argument("--model", default=config.GENERATOR_MODEL, help="Generator model name")
        parser.add_argument("--max-revisions", type=int, default=config.MAX_REVISIONS)
        parser.add_argument("--judge", action="store_true", help="Also use an LLM judge while the loop runs")
        parser.add_argument("--label", default="", help="Name for this run (defaults to the model name)")
        parser.add_argument("--out", help="Write the JSON report to this path")
        parser.add_argument("--compare", help="Path of an earlier JSON report to compare against")

    def handle(self, *args, **options):
        generator = GroqLLM(options["model"])
        judge = GroqLLM(config.EVALUATOR_MODEL) if options["judge"] else None
        agent = ResumeAgent(generator, evaluator_llm=judge, max_revisions=options["max_revisions"])
        label = options["label"] or options["model"]

        report = run_benchmark(agent_workflow(agent), label=label)

        self.stdout.write(f"{'case':<32} {'overall':>8} {'pass':>6} {'revs':>5} {'repairs':>8}")
        for case in report["cases"]:
            self.stdout.write(
                f"{case['case_id']:<32} {case['overall']:>8.3f} {str(case['passed']):>6} "
                f"{case['revisions']:>5} {case['grounding_repairs']:>8}"
            )
        agg = report["aggregate"]
        self.stdout.write(f"\nmean overall {agg['mean_overall']:.3f} | pass rate {agg['pass_rate']:.0%} | repairs {agg['total_grounding_repairs']}")
        self.stdout.write("dimensions: " + ", ".join(f"{k} {v:.2f}" for k, v in agg["mean_scores"].items()))

        if options["out"]:
            save_report(report, options["out"])
            self.stdout.write(f"report saved to {options['out']}")

        if options["compare"]:
            try:
                with open(options["compare"], "r", encoding="utf-8") as f:
                    previous = json.load(f)
            except (OSError, ValueError) as exc:
                raise CommandError(f"Could not read {options['compare']}: {exc}")
            diff = compare_reports(previous, report)
            self.stdout.write(f"\nvs {diff['a']}: overall {diff['overall_delta']:+.3f}, pass rate {diff['pass_rate_delta']:+.0%}, winner: {diff['winner']}")
            for name, delta in diff["dimension_deltas"].items():
                self.stdout.write(f"  {name:<20} {delta:+.3f}")
