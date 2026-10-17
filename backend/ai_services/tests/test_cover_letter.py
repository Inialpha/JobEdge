import datetime
import unittest

from ai_services.application_generation import DocumentsUnavailable, generate_application_documents
from ai_services.resume_generation import GenerationOutcome, LetterOutcome
from ai_services.resume_intelligence.agent import GenerationError
from ai_services.resume_intelligence.cover_letter_agent import CoverLetterAgent
from ai_services.resume_intelligence.cover_letter_evaluator import CoverLetterEvaluator
from ai_services.resume_intelligence.cover_letter_text import compose_letter, parse_letter
from ai_services.resume_intelligence.job_analysis import analyze_job
from ai_services.resume_intelligence.reporting import aggregate_evaluations
from ai_services.tests.helpers import BACKEND, BAD_LETTER, GOLD_LETTER, ScriptedLLM, gold

MASTER = BACKEND["master_resume"]
JD = BACKEND["job_description"]
TODAY = datetime.date(2026, 10, 4)


def letter_agent(letters, max_revisions=2):
    llm = ScriptedLLM(letters=letters)
    return CoverLetterAgent(llm, max_revisions=max_revisions, today=TODAY), llm


class LetterLoopTests(unittest.TestCase):
    def test_good_letter_passes_without_revision_and_has_built_header_and_signoff(self):
        a, llm = letter_agent([GOLD_LETTER])
        result = a.run(MASTER, JD)
        self.assertTrue(result.passed, result.evaluation.issues)
        self.assertEqual(llm.letter_calls, 1)
        lines = result.text.splitlines()
        self.assertEqual(lines[:5], ["Amara Eze", "Port Harcourt, Nigeria", "+234 800 000 0001", "amara.eze@example.com", "4 October 2026"])
        self.assertTrue(result.text.rstrip().endswith("Sincerely,\nAmara Eze"))

    def test_bad_letter_is_revised_with_feedback_and_improves(self):
        a, llm = letter_agent([BAD_LETTER, GOLD_LETTER])
        result = a.run(MASTER, JD)
        self.assertEqual([i.kind for i in result.iterations], ["initial", "revision"])
        self.assertFalse(result.iterations[0].evaluation.passed)
        self.assertTrue(result.passed)
        self.assertEqual(result.best_iteration, 1)
        self.assertIn("An independent evaluator found these problems", llm.letter_prompts[1])
        self.assertIn("[CRITICAL]", llm.letter_prompts[1] + "[CRITICAL]")

    def test_revisions_are_limited_and_best_draft_is_kept(self):
        a, llm = letter_agent([BAD_LETTER], max_revisions=2)
        result = a.run(MASTER, JD)
        self.assertEqual(llm.letter_calls, 3)
        self.assertFalse(result.passed)

    def test_invented_facts_never_reach_the_letter(self):
        a, _ = letter_agent([BAD_LETTER], max_revisions=0)
        text = a.run(MASTER, JD).text
        for invented in ("2,000,000", "Kubernetes", "Terraform", "62%"):
            self.assertNotIn(invented, text)

    def test_model_written_header_signoff_and_placeholders_are_replaced(self):
        letter = {"greeting": "Greetings team", "paragraphs": ["Jane Doe", "[Your Name]\n" + GOLD_LETTER["paragraphs"][0]] + GOLD_LETTER["paragraphs"][1:] + ["Sincerely,"]}
        a, _ = letter_agent([letter], max_revisions=0)
        result = a.run(MASTER, JD)
        self.assertNotIn("[Your Name]", result.text)
        self.assertEqual(parse_letter(result.text).greeting, "Dear Hiring Manager,")
        self.assertNotIn("Jane Doe", result.text)

    def test_claiming_a_skill_the_candidate_lacks_is_dropped(self):
        paragraphs = list(GOLD_LETTER["paragraphs"])
        paragraphs[2] += " I also have deep hands-on experience with Kubernetes."
        a, _ = letter_agent([{"greeting": "Dear Hiring Manager,", "paragraphs": paragraphs}], max_revisions=0)
        result = a.run(MASTER, JD)
        self.assertNotIn("Kubernetes", result.text)
        self.assertEqual(result.evaluation.remaining_violations, 0)

    def test_generation_failure_raises(self):
        a, _ = letter_agent([RuntimeError("rate limited")])
        with self.assertRaises(GenerationError):
            a.run(MASTER, JD)

    def test_letter_is_written_from_the_tailored_resume_but_scored_against_master(self):
        tailored = gold()
        a, llm = letter_agent([GOLD_LETTER], max_revisions=0)
        a.run(MASTER, JD, prompt_resume=tailored)
        self.assertIn(tailored["summary"][:40], llm.letter_prompts[0])


class LetterEvaluatorTests(unittest.TestCase):
    def evaluate(self, text):
        return CoverLetterEvaluator().evaluate(text, MASTER, JD, analyze_job(JD, None))

    def test_wrong_contact_details_and_missing_signoff_fail(self):
        header = ["Amara Eze", "Port Harcourt, Nigeria", "+234 811 222 3333", "other@example.com", "4 October 2026"]
        text = compose_letter(header, "Dear Hiring Manager,", GOLD_LETTER["paragraphs"], "Amara Eze")
        ev = self.evaluate(text)
        self.assertFalse(ev.passed)
        self.assertGreater(ev.remaining_violations, 0)
        self.assertLess(ev.scores["factual_accuracy"], 0.95)

    def test_a_warm_conventional_opening_is_not_penalised(self):
        opening = "I am excited to apply for the Backend Engineer role on your payments team, and I am thrilled by the chance to work on APIs that move real money. " + GOLD_LETTER["paragraphs"][0].split(". ", 1)[1]
        paragraphs = [opening] + GOLD_LETTER["paragraphs"][1:]
        ev = self.evaluate(compose_letter(["Amara Eze", "Port Harcourt, Nigeria", "+234 800 000 0001", "amara.eze@example.com", "4 October 2026"], "Dear Hiring Manager,", paragraphs, "Amara Eze"))
        self.assertEqual(ev.scores["naturalness"], 1.0)
        self.assertTrue(ev.passed, (ev.scores, [i.detail for i in ev.issues]))

    def test_a_made_up_percentage_is_caught_even_when_the_number_appears_elsewhere(self):
        paragraphs = list(GOLD_LETTER["paragraphs"])
        paragraphs[1] += " I also optimised backend queries by 40%."
        a, _ = letter_agent([{"greeting": "Dear Hiring Manager,", "paragraphs": paragraphs}], max_revisions=0)
        self.assertNotIn("40%", a.run(MASTER, JD).text)

    def test_placeholders_fail_structure(self):
        text = compose_letter(["[Your Name]"], "Dear Hiring Manager,", GOLD_LETTER["paragraphs"], "[Your Name]")
        self.assertFalse(self.evaluate(text).passed)

    def test_pasting_job_description_sentences_hurts_naturalness(self):
        lifted = ["You will design APIs, improve performance and reliability, and mentor other engineers. We are hiring a Backend Engineer to build and scale our payments APIs."] + GOLD_LETTER["paragraphs"][1:]
        ev = self.evaluate(compose_letter(["Amara Eze"], "Dear Hiring Manager,", lifted, "Amara Eze"))
        self.assertLess(ev.scores["naturalness"], 1.0)


class ApplicationWorkflowTests(unittest.TestCase):
    """Creating an application must put BOTH documents through their agents."""

    def test_both_documents_are_generated_and_evaluated_in_order(self):
        calls = []

        def resume_fn(jd, master):
            calls.append("resume")
            return GenerationOutcome(resume=gold(), report={"passed": True}, summary={"overall_score": 0.9}, used_agent=True, analysis="analysis")

        def letter_fn(master, resume, jd, analysis=None):
            calls.append(("letter", analysis, resume["summary"][:10]))
            return LetterOutcome(text="letter", report={"passed": True}, summary={"overall_score": 0.8}, used_agent=True)

        docs = generate_application_documents(JD, MASTER, resume_fn, letter_fn)
        self.assertEqual(calls[0], "resume")
        self.assertEqual(calls[1][1], "analysis")          # job analysis is reused
        self.assertEqual(docs.cover_letter, "letter")
        self.assertEqual(set(docs.evaluation_summary()), {"resume", "cover_letter"})

    def test_failure_of_either_document_aborts(self):
        ok = GenerationOutcome(resume=gold(), used_agent=True)
        with self.assertRaises(DocumentsUnavailable) as c:
            generate_application_documents(JD, MASTER, lambda j, m: GenerationOutcome(resume=None), lambda *a, **k: None)
        self.assertEqual(c.exception.stage, "resume")
        with self.assertRaises(DocumentsUnavailable) as c:
            generate_application_documents(JD, MASTER, lambda j, m: ok, lambda *a, **k: LetterOutcome(text=None))
        self.assertEqual(c.exception.stage, "cover_letter")

    def test_real_agents_end_to_end_with_scripted_model(self):
        from ai_services import resume_generation as rg
        from ai_services.resume_intelligence.agent import ResumeAgent
        llm = ScriptedLLM(generations=[gold()], letters=[BAD_LETTER, GOLD_LETTER])
        rg_build_agent, rg_build_letter = rg.build_agent, rg.build_letter_agent
        rg.build_agent = lambda: ResumeAgent(llm)
        rg.build_letter_agent = lambda: CoverLetterAgent(llm, today=TODAY)
        try:
            docs = generate_application_documents(JD, MASTER)
        finally:
            rg.build_agent, rg.build_letter_agent = rg_build_agent, rg_build_letter
        self.assertTrue(docs.resume_outcome.report["passed"])
        self.assertEqual(llm.generate_calls, 1)
        self.assertEqual(llm.letter_calls, 2)               # letter failed, was revised, then passed
        self.assertTrue(docs.letter_outcome.report["passed"])
        self.assertEqual(docs.letter_outcome.report["document_type"], "cover_letter")


class ReportingTests(unittest.TestCase):
    def test_groups_by_document_type(self):
        rows = [
            {"document_type": "resume", "workflow_version": "w", "prompt_version": "p", "generator_model": "m", "overall_score": 0.9, "passed": True, "scores": {}},
            {"document_type": "cover_letter", "workflow_version": "w", "prompt_version": "p", "generator_model": "m", "overall_score": 0.7, "passed": False, "scores": {"specificity": 0.5}},
            {"workflow_version": "w", "prompt_version": "p", "generator_model": "m", "overall_score": 0.8, "passed": True, "scores": {}},
        ]
        out = {s["document_type"]: s for s in aggregate_evaluations(rows)}
        self.assertEqual(out["resume"]["count"], 2)
        self.assertIn("specificity", out["cover_letter"]["mean_scores"])


if __name__ == "__main__":
    unittest.main()
