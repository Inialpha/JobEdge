"""Time budget, stored-evaluation reporting, and the API-facing entry point."""
import sys
import types
import unittest
from unittest import mock

from ai_services import resume_generation
from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.agent import GenerationError, ResumeAgent
from ai_services.resume_intelligence.benchmark import agent_workflow, run_benchmark
from ai_services.resume_intelligence.reporting import aggregate_evaluations, format_table
from ai_services.tests.helpers import BACKEND, CASES, ScriptedLLM, copied, gold

MASTER = BACKEND["master_resume"]
JD = BACKEND["job_description"]


class FakeClock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now


class TimeBudgetTests(unittest.TestCase):
    def slow_llm(self, clock, seconds_per_call, drafts):
        llm = ScriptedLLM(generations=drafts)
        original = llm.complete

        def complete(system, user, temperature=0.0):
            clock.now += seconds_per_call
            return original(system, user, temperature)

        llm.complete = complete
        return llm

    def test_revision_is_skipped_when_it_would_blow_the_budget(self):
        clock = FakeClock()
        llm = self.slow_llm(clock, 25.0, [copied(), gold()])   # analysis 25s + first draft 25s
        agent = ResumeAgent(llm, max_revisions=2, max_seconds=60.0, clock=clock)
        result = agent.run(MASTER, JD)
        self.assertTrue(result.metadata["stopped_for_time"])
        self.assertEqual([i.kind for i in result.iterations], ["initial"])
        self.assertTrue(result.resume["summary"])      # still returns the best draft it has

    def test_revision_runs_when_there_is_time(self):
        clock = FakeClock()
        llm = self.slow_llm(clock, 5.0, [copied(), gold()])
        result = ResumeAgent(llm, max_revisions=2, max_seconds=60.0, clock=clock).run(MASTER, JD)
        self.assertFalse(result.metadata["stopped_for_time"])
        self.assertEqual(len(result.iterations), 2)
        self.assertTrue(result.passed)

    def test_no_budget_means_no_limit(self):
        clock = FakeClock()
        llm = self.slow_llm(clock, 1000.0, [copied(), gold()])
        result = ResumeAgent(llm, max_revisions=2, max_seconds=None, clock=clock).run(MASTER, JD)
        self.assertEqual(len(result.iterations), 2)


class EntryPointTests(unittest.TestCase):
    def test_success_returns_resume_report_and_client_summary(self):
        agent = ResumeAgent(ScriptedLLM(generations=[gold()]))
        with mock.patch.object(resume_generation, "build_agent", return_value=agent):
            outcome = resume_generation.generate_tailored_resume(JD, MASTER)
        self.assertTrue(outcome.used_agent)
        self.assertTrue(outcome.resume["summary"])
        self.assertEqual(outcome.report["workflow_version"], config.WORKFLOW_VERSION)
        self.assertTrue(outcome.summary["passed"])

    def test_model_failure_returns_no_resume_so_the_view_can_answer_503_style_message(self):
        agent = ResumeAgent(ScriptedLLM(generations=[RuntimeError("rate limited")]))
        with mock.patch.object(resume_generation, "build_agent", return_value=agent):
            outcome = resume_generation.generate_tailored_resume(JD, MASTER)
        self.assertIsNone(outcome.resume)
        self.assertIsNone(outcome.summary)

    def test_unexpected_bug_never_escapes_to_the_request(self):
        with mock.patch.object(resume_generation, "build_agent", side_effect=ValueError("boom")):
            outcome = resume_generation.generate_tailored_resume(JD, MASTER)
        self.assertIsNone(outcome.resume)

    def test_kill_switch_restores_the_single_shot_generator(self):
        legacy = types.ModuleType("ai_services.resume_extractor")
        legacy.generate_resume = lambda job, resume: {"summary": "legacy"}
        with mock.patch.object(config, "AGENT_ENABLED", False), mock.patch.dict(sys.modules, {"ai_services.resume_extractor": legacy}):
            outcome = resume_generation.generate_tailored_resume(JD, MASTER)
        self.assertFalse(outcome.used_agent)
        self.assertEqual(outcome.resume, {"summary": "legacy"})
        self.assertIsNone(outcome.summary)


class AggregationTests(unittest.TestCase):
    def row(self, model, overall, passed, revisions=0, prompt="p1"):
        return {
            "workflow_version": "agent-loop-v1", "prompt_version": prompt, "generator_model": model,
            "overall_score": overall, "passed": passed, "scores": {d: overall for d in config.WEIGHTS},
            "report": {"iterations": [{"kind": "initial"}] + [{"kind": "revision"}] * revisions},
        }

    def test_groups_are_ranked_and_averaged(self):
        rows = [self.row("model-a", 0.9, True), self.row("model-a", 0.7, False, revisions=2), self.row("model-b", 0.6, False)]
        summaries = aggregate_evaluations(rows)
        self.assertEqual([s["generator_model"] for s in summaries], ["model-a", "model-b"])
        a = summaries[0]
        self.assertEqual(a["count"], 2)
        self.assertAlmostEqual(a["mean_overall"], 0.8)
        self.assertAlmostEqual(a["pass_rate"], 0.5)
        self.assertAlmostEqual(a["mean_revisions"], 1.0)
        self.assertEqual(set(a["mean_scores"]), set(config.WEIGHTS))

    def test_prompt_versions_are_kept_apart(self):
        summaries = aggregate_evaluations([self.row("m", 0.9, True, prompt="v1"), self.row("m", 0.5, False, prompt="v2")])
        self.assertEqual({s["prompt_version"] for s in summaries}, {"v1", "v2"})

    def test_table_handles_empty_and_populated(self):
        self.assertEqual(format_table([]), "No evaluations found.")
        self.assertIn("model-a", format_table(aggregate_evaluations([self.row("model-a", 0.9, True)])))


class AgentBenchmarkStatsTests(unittest.TestCase):
    def test_agent_repairs_and_revisions_are_part_of_the_report(self):
        from ai_services.tests.helpers import hallucinated

        def generation_fn(prompt):
            case = next(c for c in CASES.values() if c["job_description"] in prompt)
            from ai_services.resume_intelligence.benchmark import build_reference_resume
            resume = build_reference_resume(case)
            if case["id"] == "backend_engineer":
                return hallucinated()
            return resume

        agent = ResumeAgent(ScriptedLLM(generation_fn=generation_fn), max_revisions=1)
        report = run_benchmark(agent_workflow(agent), label="agent")
        by_case = {c["case_id"]: c for c in report["cases"]}
        self.assertGreater(by_case["backend_engineer"]["grounding_repairs"], 0)
        self.assertEqual(by_case["data_analyst"]["grounding_repairs"], 0)
        self.assertEqual(by_case["data_analyst"]["revisions"], 0)
        self.assertEqual(report["aggregate"]["total_violations"], 0)   # repaired before it reached the user
        self.assertIn("mean_revisions", report["aggregate"])


if __name__ == "__main__":
    unittest.main()
