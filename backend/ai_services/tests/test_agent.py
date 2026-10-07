import unittest

from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.agent import GenerationError, ResumeAgent, _Candidate, _selection_key
from ai_services.resume_intelligence.evaluator import EvaluationResult
from ai_services.resume_intelligence.prompts import STYLE_HINTS, pick_style_hint
from ai_services.tests.helpers import BACKEND, ScriptedLLM, all_bullets, copied, gold, hallucinated

MASTER = BACKEND["master_resume"]
JD = BACKEND["job_description"]


def agent(generations, max_revisions=2, judge=None):
    llm = ScriptedLLM(generations=generations)
    evaluator_llm = ScriptedLLM(judge=judge) if judge else None
    return ResumeAgent(llm, evaluator_llm=evaluator_llm, max_revisions=max_revisions), llm


class LoopTests(unittest.TestCase):
    def test_passing_first_draft_is_not_revised(self):
        a, llm = agent([gold()])
        result = a.run(MASTER, JD)
        self.assertTrue(result.passed)
        self.assertEqual(llm.generate_calls, 1)
        self.assertEqual([i.kind for i in result.iterations], ["initial"])

    def test_failing_draft_is_revised_with_evaluator_feedback_and_improves(self):
        a, llm = agent([copied(), gold()])
        result = a.run(MASTER, JD)
        self.assertEqual(llm.generate_calls, 2)
        self.assertEqual([i.kind for i in result.iterations], ["initial", "revision"])
        self.assertFalse(result.iterations[0].evaluation.passed)
        self.assertTrue(result.passed)
        self.assertGreater(result.iterations[1].evaluation.overall, result.iterations[0].evaluation.overall)
        self.assertEqual(result.best_iteration, 1)

        revision_prompt = llm.generate_prompts[1]
        self.assertIn("Your previous draft", revision_prompt)
        self.assertIn("[MAJOR]", revision_prompt)                 # structured feedback reached the generator
        self.assertIn("copied from the master resume", revision_prompt)

    def test_revisions_are_limited(self):
        a, llm = agent([copied()], max_revisions=2)
        result = a.run(MASTER, JD)
        self.assertEqual(llm.generate_calls, 1 + 2)
        self.assertFalse(result.passed)
        self.assertEqual(len(result.iterations), 3)

        a0, llm0 = agent([copied()], max_revisions=0)
        a0.run(MASTER, JD)
        self.assertEqual(llm0.generate_calls, 1)

    def test_every_revision_stays_grounded(self):
        a, _ = agent([copied(), hallucinated()])
        result = a.run(MASTER, JD)
        text = " ".join(all_bullets(result.resume)) + result.resume["summary"]
        for invented in ("62%", "2,000,000", "Kubernetes", "Terraform", "25 engineers"):
            self.assertNotIn(invented, text)
        self.assertNotIn("Globex Corporation", [e["organization"] for e in result.resume["professional_experiences"]])
        self.assertEqual(result.evaluation.remaining_violations, 0)
        # and the repairs are recorded so different models can be compared
        self.assertGreater(result.iterations[1].to_dict()["grounding_repairs"], 0)

    def test_final_resume_prefers_a_grounded_passing_draft_over_a_later_worse_one(self):
        a, _ = agent([gold(), copied()], max_revisions=2)
        result = a.run(MASTER, JD)             # first draft already passes, so no revision happens
        self.assertEqual(result.best_iteration, 0)

        a, _ = agent([copied(), gold(), copied()], max_revisions=2)
        result = a.run(MASTER, JD)             # passes at iteration 1 and stops there
        self.assertEqual(result.best_iteration, 1)
        self.assertEqual(len(result.iterations), 2)

    def test_selection_key_ranks_passing_then_grounded_then_score(self):
        def cand(passed, violations, overall):
            ev = EvaluationResult(overall, {}, passed, [], [], {}, False, violations)
            return _Candidate(0, {}, ev)

        ranked = sorted(
            [cand(False, 0, 0.9), cand(True, 0, 0.78), cand(False, 3, 0.95), cand(True, 2, 0.99)],
            key=_selection_key, reverse=True,
        )
        self.assertEqual([(c.evaluation.passed, c.evaluation.remaining_violations) for c in ranked],
                         [(True, 0), (True, 2), (False, 0), (False, 3)])

    def test_summary_with_unverifiable_claims_is_cleaned_at_finalize(self):
        draft = gold()
        draft["summary"] = "Backend developer who builds Django REST APIs. Scaled revenue by 340% across the company."
        a, _ = agent([draft], max_revisions=0)
        result = a.run(MASTER, JD)
        self.assertNotIn("340", result.resume["summary"])
        self.assertEqual(result.resume["summary"], "Backend developer who builds Django REST APIs.")
        self.assertEqual(result.iterations[-1].kind, "finalize")
        self.assertEqual(result.evaluation.remaining_violations, 0)


class FailureTests(unittest.TestCase):
    def test_first_draft_failure_raises(self):
        a, _ = agent([RuntimeError("rate limited")])
        with self.assertRaises(GenerationError):
            a.run(MASTER, JD)

    def test_unparseable_first_draft_raises(self):
        llm = ScriptedLLM(generation_fn=lambda prompt: {})
        llm.complete = lambda system, user, temperature=0.0: "not json at all"
        with self.assertRaises(GenerationError):
            ResumeAgent(llm).run(MASTER, JD)

    def test_failed_revision_keeps_the_first_draft(self):
        a, _ = agent([copied(), RuntimeError("timeout")])
        result = a.run(MASTER, JD)
        self.assertEqual(len(result.iterations), 1)
        self.assertEqual(result.best_iteration, 0)
        self.assertTrue(result.resume["summary"])

    def test_evaluator_judge_outage_does_not_break_the_loop(self):
        llm = ScriptedLLM(generations=[gold()])
        result = ResumeAgent(llm, evaluator_llm=ScriptedLLM()).run(MASTER, JD)   # judge raises
        self.assertTrue(result.passed)
        self.assertFalse(result.evaluation.judge_used)


class ReportTests(unittest.TestCase):
    def test_report_keeps_what_is_needed_to_compare_runs(self):
        a, _ = agent([copied(), gold()], judge={"relevance": 0.9, "summary_quality": 0.9, "naturalness": 0.9})
        report = a.run(MASTER, JD, seed=1).report()
        for key in ("workflow_version", "prompt_version", "generator_model", "evaluator_model", "scores", "overall", "passed", "iterations", "diagnostics", "analysis", "style_hint"):
            self.assertIn(key, report)
        self.assertEqual(report["workflow_version"], config.WORKFLOW_VERSION)
        self.assertEqual(set(report["scores"]), set(config.WEIGHTS))
        self.assertEqual(len(report["iterations"]), 2)

    def test_client_summary_is_small(self):
        a, _ = agent([gold()])
        summary = a.run(MASTER, JD).summary_for_client()
        self.assertEqual(set(summary), {"overall_score", "passed", "scores", "matched_keywords", "missing_keywords", "gaps", "revisions"})


class VariationTests(unittest.TestCase):
    def test_style_hint_is_stable_for_the_same_inputs_and_varies_with_seed(self):
        self.assertEqual(pick_style_hint(MASTER, JD), pick_style_hint(MASTER, JD))
        self.assertEqual({pick_style_hint(MASTER, JD, seed=s) for s in range(len(STYLE_HINTS))}, set(STYLE_HINTS))


if __name__ == "__main__":
    unittest.main()
