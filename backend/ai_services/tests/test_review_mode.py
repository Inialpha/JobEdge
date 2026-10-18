"""Writer -> evaluator-rewrites flow (RESUME_REVIEW_MODE=reviewer_revises, the default): two model calls per document."""
import datetime
import unittest

from ai_services import resume_generation as rg
from ai_services.application_generation import generate_application_documents
from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.agent import ResumeAgent
from ai_services.resume_intelligence.cover_letter_agent import CoverLetterAgent
from ai_services.tests.helpers import BACKEND, BAD_LETTER, GOLD_LETTER, ScriptedLLM, all_bullets, copied, gold, hallucinated

MASTER, JD = BACKEND["master_resume"], BACKEND["job_description"]
TODAY = datetime.date(2026, 10, 4)


class ResumeReviewTests(unittest.TestCase):
    def test_default_mode_is_reviewer_revises(self):
        self.assertEqual(config.REVIEW_MODE, "reviewer_revises")

    def test_two_calls_total_and_no_job_analysis_call(self):
        llm = ScriptedLLM(generations=[copied()], reviews=[gold()])
        result = ResumeAgent(llm).run(MASTER, JD)
        self.assertEqual((llm.generate_calls, llm.review_calls, llm.analysis_calls), (1, 1, 0))
        self.assertEqual([i.kind for i in result.iterations], ["initial", "review"])
        self.assertTrue(result.passed)
        self.assertEqual(result.best_iteration, 1)
        self.assertEqual(result.metadata["review_mode"], "reviewer_revises")

    def test_reviewer_receives_job_draft_and_the_checkers_findings(self):
        llm = ScriptedLLM(generations=[copied()], reviews=[gold()])
        ResumeAgent(llm).run(MASTER, JD)
        prompt = llm.review_prompts[0]
        self.assertIn("Backend Engineer", prompt)            # job description
        self.assertIn("Junior's draft", prompt)
        self.assertIn("Checker's findings", prompt)
        self.assertIn("summary, unchanged", prompt)           # what the evaluator found wrong

    def test_reviewer_is_called_even_when_the_draft_passes(self):
        llm = ScriptedLLM(generations=[gold()], reviews=[gold()])
        ResumeAgent(llm).run(MASTER, JD)
        self.assertEqual(llm.review_calls, 1)

    def test_failed_review_keeps_the_writers_draft(self):
        llm = ScriptedLLM(generations=[gold()], reviews=[RuntimeError("rate limited")])
        result = ResumeAgent(llm).run(MASTER, JD)
        self.assertEqual([i.kind for i in result.iterations], ["initial"])
        self.assertTrue(result.passed)

    def test_a_worse_rewrite_does_not_replace_a_better_draft_and_invention_is_removed(self):
        llm = ScriptedLLM(generations=[gold()], reviews=[hallucinated()])
        result = ResumeAgent(llm).run(MASTER, JD)
        text = " ".join(all_bullets(result.resume)) + result.resume["summary"]
        for invented in ("62%", "Kubernetes", "Globex"):
            self.assertNotIn(invented, text)
        self.assertEqual(result.evaluation.remaining_violations, 0)

    def test_writer_revises_mode_still_available(self):
        llm = ScriptedLLM(generations=[copied(), gold()])
        result = ResumeAgent(llm, review_mode="writer_revises").run(MASTER, JD)
        self.assertEqual((llm.generate_calls, llm.review_calls), (2, 0))
        self.assertEqual([i.kind for i in result.iterations], ["initial", "revision"])

    def test_unknown_mode_is_rejected(self):
        with self.assertRaises(ValueError):
            ResumeAgent(ScriptedLLM(), review_mode="nonsense")


class LetterReviewTests(unittest.TestCase):
    def test_two_calls_and_the_reviewed_letter_wins(self):
        llm = ScriptedLLM(letters=[BAD_LETTER], letter_reviews=[GOLD_LETTER])
        result = CoverLetterAgent(llm, today=TODAY).run(MASTER, JD)
        self.assertEqual((llm.letter_calls, llm.review_calls, llm.analysis_calls), (1, 1, 0))
        self.assertEqual([i.kind for i in result.iterations], ["initial", "review"])
        self.assertTrue(result.passed)
        self.assertIn("Port Harcourt, Nigeria", result.text)           # header still built from the profile
        self.assertTrue(result.text.rstrip().endswith("Sincerely,\nAmara Eze"))
        self.assertIn("Checker's findings", llm.review_prompts[0])

    def test_failed_review_keeps_the_writers_letter(self):
        llm = ScriptedLLM(letters=[GOLD_LETTER], letter_reviews=[RuntimeError("busy")])
        result = CoverLetterAgent(llm, today=TODAY).run(MASTER, JD)
        self.assertEqual([i.kind for i in result.iterations], ["initial"])
        self.assertTrue(result.passed)


class ApplicationCallBudgetTests(unittest.TestCase):
    def test_application_makes_exactly_four_model_calls(self):
        llm = ScriptedLLM(generations=[copied()], reviews=[gold()], letters=[BAD_LETTER], letter_reviews=[GOLD_LETTER])
        built = rg.build_agent, rg.build_letter_agent
        rg.build_agent = lambda: ResumeAgent(llm)
        rg.build_letter_agent = lambda: CoverLetterAgent(llm, today=TODAY)
        try:
            docs = generate_application_documents(JD, MASTER)
        finally:
            rg.build_agent, rg.build_letter_agent = built
        self.assertEqual(llm.generate_calls + llm.review_calls + llm.letter_calls + llm.analysis_calls, 4)
        self.assertEqual((llm.generate_calls, llm.review_calls, llm.letter_calls), (1, 2, 1))
        self.assertTrue(docs.resume_outcome.summary["passed"])
        self.assertTrue(docs.letter_outcome.summary["passed"])


if __name__ == "__main__":
    unittest.main()
