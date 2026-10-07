import copy
import unittest

from ai_services.resume_intelligence import config
from ai_services.resume_intelligence.evaluator import ResumeEvaluator
from ai_services.resume_intelligence.job_analysis import JobAnalysis, analyze_job
from ai_services.tests.helpers import BACKEND, CASES, ScriptedLLM, copied, gold, hallucinated

MASTER = BACKEND["master_resume"]
JD = BACKEND["job_description"]
ANALYSIS = analyze_job(JD)


def evaluate(resume, master=MASTER, jd=JD, analysis=ANALYSIS, llm=None, repairs=None):
    return ResumeEvaluator(llm=llm).evaluate(resume, master, jd, analysis, repairs=repairs)


class ScoringTests(unittest.TestCase):
    def test_weights_sum_to_one_and_every_dimension_has_a_threshold(self):
        self.assertAlmostEqual(sum(config.WEIGHTS.values()), 1.0)
        self.assertEqual(set(config.WEIGHTS), set(config.DIMENSION_THRESHOLDS))

    def test_good_tailoring_passes_on_every_benchmark_case(self):
        for case_id, case in CASES.items():
            with self.subTest(case=case_id):
                result = evaluate(gold(case_id), case["master_resume"], case["job_description"], analyze_job(case["job_description"]))
                self.assertTrue(result.passed, (result.scores, result.failed_dimensions))
                self.assertEqual(result.remaining_violations, 0)

    def test_untailored_copy_fails_on_relevance_and_summary(self):
        result = evaluate(copied())
        self.assertFalse(result.passed)
        self.assertIn("relevance", result.failed_dimensions)
        self.assertIn("summary_quality", result.failed_dimensions)
        self.assertEqual(result.diagnostics["bullets"]["transformed"], 0)
        self.assertEqual(result.diagnostics["bullets"]["copied"], result.diagnostics["bullets"]["total"])

    def test_fabrication_fails_factual_accuracy(self):
        result = evaluate(hallucinated())
        self.assertFalse(result.passed)
        self.assertLess(result.scores["factual_accuracy"], config.DIMENSION_THRESHOLDS["factual_accuracy"])
        self.assertGreater(result.remaining_violations, 0)
        self.assertTrue(any(i.dimension == "factual_accuracy" and i.severity == "critical" for i in result.issues))


class FourWayDistinctionTests(unittest.TestCase):
    """transformed / copied / invented / missed must be told apart."""

    def setUp(self):
        self.resume = gold()
        bullets = self.resume["professional_experiences"][0]["responsibilities"]
        bullets[4] = MASTER["professional_experiences"][0]["responsibilities"][4]      # copied verbatim
        bullets[3] = "Won an industry award for building a machine learning fraud detection platform."  # invented
        self.result = evaluate(self.resume)

    def test_bullets_are_classified(self):
        b = self.result.diagnostics["bullets"]
        self.assertGreaterEqual(b["copied"], 1)
        self.assertGreaterEqual(b["invented"], 1)
        self.assertGreaterEqual(b["transformed"], 3)
        self.assertIn("Mentored two junior developers", " ".join(b["copied_examples"]))
        self.assertIn("award", " ".join(b["invented_examples"]))

    def test_invented_content_is_a_critical_factual_issue(self):
        self.assertTrue(any("not supported by the master resume" in i.detail for i in self.result.issues))
        self.assertLess(self.result.scores["factual_accuracy"], 0.95)

    def test_missed_requirements_split_into_supported_and_gaps(self):
        resume = gold()
        resume["skills"] = [{"category": "Languages", "skills": ["SQL"]}]
        resume["summary"] = "Developer who maintains reports for the finance team."
        for exp in resume["professional_experiences"]:
            exp["responsibilities"] = ["Maintained reports for the finance team."]
        resume["projects"] = []
        analysis = JobAnalysis(required_skills=["Python", "Kubernetes"], keywords=["Python", "Docker", "Redis", "Kubernetes", "Kafka"])
        kw = evaluate(resume, analysis=analysis).diagnostics["keywords"]
        self.assertIn("Python", kw["missed_supported"])   # candidate has it, resume dropped it -> fixable
        self.assertIn("Docker", kw["missed_supported"])
        self.assertIn("Kubernetes", kw["unsupported_requirements"])   # candidate lacks it -> gap, never add
        self.assertNotIn("Kubernetes", kw["missed_supported"])
        self.assertNotIn("Kafka", kw["missed_supported"])


class DimensionTests(unittest.TestCase):
    def test_repetition_is_penalised(self):
        resume = gold()
        resume["professional_experiences"][0]["responsibilities"] = [
            "Built REST APIs in Python and Django that process 15,000 payment requests per day.",
            "Built REST APIs in Python and Django that process 15,000 payment requests per day.",
            "Built tests with pytest, raising test coverage from 45% to 85%.",
            "Built CI pipelines with GitHub Actions to deploy to AWS on every merge.",
            "Built caching with Redis, reducing response time from 800ms to 320ms.",
        ]
        result = evaluate(resume)
        self.assertLess(result.scores["redundancy"], config.DIMENSION_THRESHOLDS["redundancy"])
        self.assertGreaterEqual(result.diagnostics["redundancy"]["near_duplicate_pairs"], 1)
        self.assertIn("built", result.diagnostics["redundancy"]["repeated_openers"])

    def test_generic_summary_is_penalised(self):
        resume = gold()
        resume["summary"] = "Results-driven team player who is passionate about technology and seeking a challenging role."
        result = evaluate(resume)
        self.assertLess(result.scores["summary_quality"], config.DIMENSION_THRESHOLDS["summary_quality"])
        self.assertTrue(any("generic phrases" in i.detail for i in result.issues))

    def test_unchanged_master_summary_is_flagged(self):
        resume = gold()
        resume["summary"] = MASTER["summary"]
        self.assertTrue(any("unchanged" in i.detail for i in evaluate(resume).issues))

    def test_copying_the_job_description_into_the_summary_is_flagged(self):
        resume = gold()
        resume["summary"] = "We are hiring a Backend Engineer to build and scale our payments APIs for customers."
        self.assertTrue(any("copies a sentence from the job description" in i.detail for i in evaluate(resume).issues))

    def test_keyword_stuffing_hurts_naturalness(self):
        resume = gold()
        resume["professional_experiences"][0]["responsibilities"][0] = (
            "Used Python, Django, REST, PostgreSQL, Redis, Docker, pytest, AWS and GitHub Actions synergy leverage."
        )
        result = evaluate(resume)
        self.assertLess(result.scores["naturalness"], 1.0)

    def test_structure_checks(self):
        resume = gold()
        resume["summary"] = ""
        resume["professional_experiences"] = []
        result = evaluate(resume)
        self.assertEqual(result.scores["summary_quality"], 0.0)
        self.assertLess(result.scores["structure"], config.DIMENSION_THRESHOLDS["structure"])
        self.assertEqual(result.scores["relevance"], 0.0)

    def test_grounding_repairs_lower_factual_accuracy(self):
        clean = evaluate(gold()).scores["factual_accuracy"]
        repaired = evaluate(gold(), repairs=[{"type": "ungrounded_skill"}, {"type": "invented_experience"}, {"type": "x"}]).scores["factual_accuracy"]
        self.assertLess(repaired, clean)

    def test_feedback_lists_critical_issues_first(self):
        text = evaluate(hallucinated()).feedback_text()
        self.assertTrue(text.splitlines()[0].startswith("- [CRITICAL]"))

    def test_scores_are_repeatable(self):
        self.assertEqual(evaluate(gold()).to_dict(), evaluate(gold()).to_dict())


class JudgeTests(unittest.TestCase):
    def judge(self, **overrides):
        base = {"relevance": 0.9, "summary_quality": 0.9, "naturalness": 0.9, "unsupported_claims": [], "copied_without_transformation": [], "generic_phrases": [], "feedback": ["Tighten bullet two."]}
        base.update(overrides)
        return ScriptedLLM(judge=base)

    def test_judge_scores_are_blended_in(self):
        offline = evaluate(gold())
        poor = evaluate(gold(), llm=self.judge(relevance=0.1))
        self.assertTrue(poor.judge_used)
        self.assertLess(poor.scores["relevance"], offline.scores["relevance"])
        self.assertIn("Tighten bullet two.", poor.diagnostics["judge"]["feedback"])

    def test_a_lenient_judge_cannot_rescue_an_untailored_resume(self):
        offline = evaluate(copied())
        lenient = evaluate(copied(), llm=self.judge(relevance=1.0, summary_quality=1.0, naturalness=1.0))
        self.assertEqual(lenient.scores["relevance"], offline.scores["relevance"])
        self.assertEqual(lenient.scores["summary_quality"], offline.scores["summary_quality"])
        self.assertFalse(lenient.passed)

    def test_judge_failure_falls_back_to_offline_scores(self):
        result = evaluate(gold(), llm=ScriptedLLM())
        self.assertFalse(result.judge_used)
        self.assertEqual(result.scores, evaluate(gold()).scores)

    def test_reviewer_claims_are_verified_against_the_source(self):
        fabricated = evaluate(gold(), llm=self.judge(unsupported_claims=["Managed a Kubernetes migration saving $400,000"]))
        self.assertLess(fabricated.scores["factual_accuracy"], 1.0)
        # a claim that the source does support is a false alarm and must not be punished
        false_alarm = evaluate(gold(), llm=self.judge(unsupported_claims=["Mentored two junior developers through code reviews"]))
        self.assertEqual(false_alarm.scores["factual_accuracy"], 1.0)


class JobAnalysisTests(unittest.TestCase):
    def test_offline_keywords_find_the_technologies_and_skip_filler(self):
        words = {w.lower() for w in ANALYSIS.keywords}
        self.assertTrue({"python", "django", "postgresql", "redis", "docker", "pytest"} <= words)
        self.assertFalse({"nice", "hiring", "3+"} & words)

    def test_llm_analysis_is_used_and_cleaned(self):
        llm = ScriptedLLM(analysis={"title": "Backend Engineer", "required_skills": ["Python", "python", "Django"], "preferred_skills": ["Kafka"], "responsibilities": ["Design APIs"], "keywords": ["payments"]})
        analysis = analyze_job(JD, llm)
        self.assertEqual(analysis.source, "llm")
        self.assertEqual(analysis.required_skills, ["Python", "Django"])
        self.assertIn("payments", analysis.keywords)

    def test_unusable_llm_analysis_falls_back(self):
        self.assertEqual(analyze_job(JD, ScriptedLLM()).source, "heuristic")


if __name__ == "__main__":
    unittest.main()
