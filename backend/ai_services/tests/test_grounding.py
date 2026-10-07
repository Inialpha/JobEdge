import copy
import unittest

from ai_services.resume_intelligence.grounding import (
    build_source_index,
    contains_term,
    ground_resume,
    sanitize_summary,
    unsupported_terms,
    ungrounded_numbers,
)
from ai_services.tests.helpers import BACKEND, all_bullets, gold, hallucinated

MASTER = BACKEND["master_resume"]
INDEX = build_source_index(MASTER)


class TermAndNumberTests(unittest.TestCase):
    def test_contains_term_respects_word_boundaries(self):
        self.assertTrue(contains_term(INDEX, "Python"))
        self.assertTrue(contains_term(INDEX, "REST API"))      # stemmed match for "REST APIs"
        self.assertFalse(contains_term(INDEX, "Java"))          # not a substring match inside "JavaScript"
        self.assertFalse(contains_term(INDEX, "Kubernetes"))

    def test_invented_numbers_are_found(self):
        self.assertEqual(ungrounded_numbers("Cut costs by 62% for 15,000 users", INDEX), ["62"])
        self.assertEqual(ungrounded_numbers("Raised coverage from 45% to 85%", INDEX), [])

    def test_unsupported_terms(self):
        self.assertIn("Kubernetes", unsupported_terms("Deployed services on Kubernetes at scale.", INDEX))
        self.assertIn("Terraform", unsupported_terms("Managed infrastructure with Terraform.", INDEX))
        self.assertEqual(unsupported_terms("Built APIs in Django and Python.", INDEX), [])
        # sentence-initial words are not treated as proper nouns
        self.assertEqual(unsupported_terms("Mentored two junior developers.", INDEX), [])


class GroundResumeTests(unittest.TestCase):
    def test_facts_come_from_the_master_resume(self):
        draft = gold()
        draft["professional_experiences"][0].update({"organization": "Brightline Payments Ltd", "role": "Senior Backend Developer", "start_date": "2018"})
        draft["personal_information"] = {"name": "Someone Else", "email": "evil@example.com"}
        draft["educations"][0]["institution"] = "University of Port Harcourt"
        grounded, _ = ground_resume(draft, MASTER, INDEX)
        exp = grounded["professional_experiences"][0]
        self.assertEqual(exp["organization"], "Brightline Payments")
        self.assertEqual(exp["role"], "Backend Developer")
        self.assertEqual(exp["start_date"], "Mar 2021")
        self.assertEqual(grounded["personal_information"]["email"], "amara.eze@example.com")
        self.assertEqual(grounded["personal_information"]["name"], "Amara Eze")

    def test_invented_employer_certification_and_skills_are_removed(self):
        grounded, repairs = ground_resume(hallucinated(), MASTER, INDEX)
        orgs = [e["organization"] for e in grounded["professional_experiences"]]
        self.assertNotIn("Globex Corporation", orgs)
        self.assertEqual([c["name"] for c in grounded["certifications"]], ["AWS Certified Cloud Practitioner"])
        skills = {s for cat in grounded["skills"] for s in cat["skills"]}
        self.assertNotIn("Kubernetes", skills)
        self.assertNotIn("Kafka", skills)
        types = {r["type"] for r in repairs}
        self.assertTrue({"invented_experience", "invented_certification", "ungrounded_skill"} <= types)

    def test_bullet_with_invented_metric_is_reverted_not_kept(self):
        grounded, repairs = ground_resume(hallucinated(), MASTER, INDEX)
        bullets = " ".join(all_bullets(grounded))
        self.assertNotIn("62%", bullets)
        self.assertNotIn("25 engineers", bullets)
        self.assertTrue(any(r["type"] == "ungrounded_bullet" for r in repairs))

    def test_clean_draft_passes_through_unchanged(self):
        grounded, repairs = ground_resume(gold(), MASTER, INDEX)
        self.assertEqual(repairs, [])
        self.assertEqual(all_bullets(grounded), all_bullets(gold()))

    def test_garbage_input_does_not_crash(self):
        grounded, _ = ground_resume({"professional_experiences": "nope", "skills": 5, "summary": None}, MASTER, INDEX)
        self.assertEqual(grounded["professional_experiences"], [])
        self.assertEqual(grounded["summary"], "")

    def test_summary_sanitizer_drops_unverifiable_sentences_only(self):
        summary = "Backend developer who builds Django APIs. Scaled platforms to 2,000,000 users using Kubernetes."
        cleaned, repairs = sanitize_summary(summary, MASTER, INDEX)
        self.assertEqual(cleaned, "Backend developer who builds Django APIs.")
        self.assertEqual(len(repairs), 1)

    def test_summary_sanitizer_falls_back_to_source_when_everything_is_ungrounded(self):
        cleaned, _ = sanitize_summary("Led 500 engineers at Google.", MASTER, INDEX)
        self.assertEqual(cleaned, MASTER["summary"])


if __name__ == "__main__":
    unittest.main()
