"""The benchmark is what lets a prompt/model/workflow change be compared to the last one.

These tests also calibrate the evaluator: a good tailoring must pass, a lazy copy and a
fabricated resume must not, and the benchmark must rank them in that order.
"""
import json
import os
import tempfile
import unittest

from ai_services.resume_intelligence.agent import ResumeAgent
from ai_services.resume_intelligence.benchmark import (
    agent_workflow,
    compare_reports,
    load_cases,
    passthrough_workflow,
    reference_workflow,
    run_benchmark,
    save_report,
)
from ai_services.resume_intelligence import config
from ai_services.tests.helpers import CASES, ScriptedLLM, gold, hallucinated


def hallucinating_workflow(master, jd):
    case = next(c for c in CASES.values() if c["job_description"] == jd)
    from ai_services.tests.helpers import hallucinated as make
    return make(case["id"]) if case["id"] == "backend_engineer" else _hallucinate_generic(case)


def _hallucinate_generic(case):
    from ai_services.resume_intelligence.benchmark import build_reference_resume
    resume = build_reference_resume(case)
    resume["summary"] += " Increased conversion by 340% using Kubernetes."
    resume["skills"][0]["skills"].append("Kubernetes")
    resume["professional_experiences"][0]["responsibilities"][0] = "Cut cloud spend by 62% with Terraform."
    return resume


class BenchmarkCaseTests(unittest.TestCase):
    def test_cases_are_well_formed(self):
        cases = load_cases()
        self.assertGreaterEqual(len(cases), 3)
        self.assertEqual(len({c["id"] for c in cases}), len(cases))
        for case in cases:
            for key in ("id", "description", "master_resume", "job_description", "reference"):
                self.assertIn(key, case)
            self.assertTrue(case["master_resume"]["professional_experiences"])

    def test_cases_include_job_requirements_the_candidate_lacks(self):
        # these are what make the benchmark able to catch invented skills
        text = json.dumps(CASES["backend_engineer"]["master_resume"]).lower()
        self.assertNotIn("kubernetes", text)
        self.assertIn("kubernetes", CASES["backend_engineer"]["job_description"].lower())


class BenchmarkRunTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reference = run_benchmark(reference_workflow(), label="reference")
        cls.lazy = run_benchmark(passthrough_workflow, label="passthrough")
        cls.fake = run_benchmark(hallucinating_workflow, label="hallucinating")

    def test_reference_tailoring_passes_every_case(self):
        self.assertEqual(self.reference["aggregate"]["pass_rate"], 1.0)
        self.assertEqual(self.reference["aggregate"]["total_violations"], 0)

    def test_untailored_baseline_fails_every_case(self):
        self.assertEqual(self.lazy["aggregate"]["pass_rate"], 0.0)

    def test_fabrication_is_caught_even_though_the_loop_repairs_it(self):
        self.assertGreater(self.fake["aggregate"]["total_grounding_repairs"], 0)
        self.assertLess(self.fake["aggregate"]["mean_scores"]["factual_accuracy"], self.reference["aggregate"]["mean_scores"]["factual_accuracy"])

    def test_report_shape(self):
        for report in (self.reference, self.lazy, self.fake):
            self.assertEqual(len(report["cases"]), len(CASES))
            self.assertEqual(set(report["aggregate"]["mean_scores"]), set(config.WEIGHTS))
            self.assertEqual(report["workflow_version"], config.WORKFLOW_VERSION)

    def test_compare_reports_ranks_workflows(self):
        better = compare_reports(self.lazy, self.reference)
        self.assertGreater(better["overall_delta"], 0)
        self.assertEqual(better["winner"], "reference")
        self.assertGreater(better["dimension_deltas"]["relevance"], 0)
        self.assertEqual(compare_reports(self.reference, self.fake)["winner"], "reference")

    def test_results_are_repeatable(self):
        again = run_benchmark(reference_workflow(), label="reference")
        self.assertEqual(again["cases"], self.reference["cases"])

    def test_report_can_be_saved_and_reloaded(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "report.json")
            save_report(self.reference, path)
            with open(path) as f:
                self.assertEqual(json.load(f), self.reference)


class AgentOnBenchmarkTests(unittest.TestCase):
    def test_agent_loop_beats_a_single_untailored_shot(self):
        def generation_fn_factory(drafts):
            def fn(prompt):
                case = next(c for c in CASES.values() if c["job_description"] in prompt)
                calls = drafts.setdefault(case["id"], 0)
                drafts[case["id"]] = calls + 1
                from ai_services.resume_intelligence.benchmark import build_reference_resume
                return passthrough_workflow(case["master_resume"], "") if calls == 0 else build_reference_resume(case)
            return fn

        single = ResumeAgent(ScriptedLLM(generation_fn=generation_fn_factory({})), max_revisions=0)
        loop = ResumeAgent(ScriptedLLM(generation_fn=generation_fn_factory({})), max_revisions=2)
        single_report = run_benchmark(agent_workflow(single), label="single-shot")
        loop_report = run_benchmark(agent_workflow(loop), label="agent-loop")
        delta = compare_reports(single_report, loop_report)
        self.assertEqual(delta["winner"], "agent-loop")
        self.assertEqual(loop_report["aggregate"]["pass_rate"], 1.0)
        self.assertEqual(single_report["aggregate"]["pass_rate"], 0.0)


if __name__ == "__main__":
    unittest.main()
