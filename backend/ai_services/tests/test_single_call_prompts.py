"""YAML input, examples in the system prompt, and verified keyword alignments."""
import copy
import unittest

from ai_services.resume_intelligence.agent import ResumeAgent
from ai_services.resume_intelligence.grounding import build_source_index
from ai_services.resume_intelligence.prompts import SINGLE_SYSTEM, build_single_prompt
from ai_services.resume_intelligence.yaml_utils import to_yaml
from ai_services.tests.helpers import BACKEND, ScriptedLLM, gold

MASTER, JD = BACKEND["master_resume"], BACKEND["job_description"]


class PromptTests(unittest.TestCase):
    def test_master_is_sent_as_yaml_without_contact_details(self):
        from ai_services.resume_intelligence.generator import prompt_master
        user = build_single_prompt(prompt_master(MASTER), JD)
        self.assertNotIn('"professional_experiences": [{"organization": "Brightline', user)
        self.assertIn("professional_experiences:\n- organization: Brightline Payments", user)
        for key in ("email:", "phone:", "linkedin:"):
            self.assertNotIn(key, user)

    def test_examples_live_in_the_system_prompt_only(self):
        user = build_single_prompt(MASTER, JD)
        self.assertIn("Summary, wrong:", SINGLE_SYSTEM)
        self.assertIn("Project description, right:", SINGLE_SYSTEM)
        self.assertNotIn("wrong:", user)
        self.assertNotIn("right:", user)
        self.assertIn(JD.strip()[:40], user)

    def test_yaml_round_trips_and_prunes_empty_values(self):
        out = to_yaml({"a": "x", "b": "", "c": [], "d": {"e": None, "f": 1}})
        self.assertIn("a: x", out)
        self.assertNotIn("b:", out)
        self.assertNotIn("c:", out)
        self.assertNotIn("e:", out)


class AliasTests(unittest.TestCase):
    def setUp(self):
        self.master = copy.deepcopy(MASTER)
        self.index = build_source_index(self.master)

    def test_accepts_swap_when_from_in_resume_and_to_in_job(self):
        jd = "We need a Zebra Engineer who writes Python."
        term = self.master["skills"][0]["skills"][0]
        ok, bad = self.index.add_aliases([{"from": term, "to": "Zebra Engineer"}], jd)
        self.assertEqual((len(ok), len(bad)), (1, 0))

    def test_rejects_when_from_not_in_master_or_to_not_in_job(self):
        ok, bad = self.index.add_aliases(
            [{"from": "Quantum Basket Weaving", "to": "Python"}, {"from": "Python", "to": "Terraform Wizardry"}],
            "Python developer wanted",
        )
        self.assertEqual((len(ok), len(bad)), (0, 2))

    def test_accepted_swap_makes_new_term_supported(self):
        jd = "Looking for a Quasar Engineer."
        term = self.master["skills"][0]["skills"][0]
        before = self.index.supports("Quasar Engineer") if hasattr(self.index, "supports") else None
        self.index.add_aliases([{"from": term, "to": "Quasar Engineer"}], jd)
        self.assertIn("quasar", self.index.text)
        self.assertNotEqual(before, True)


class AgentAlignmentTests(unittest.TestCase):
    def test_garbage_alignments_do_not_break_the_run(self):
        draft = gold()
        draft["keyword_alignments"] = ["junk", {"from": 1}, None]
        result = ResumeAgent(ScriptedLLM(generations=[draft])).run(MASTER, JD)
        self.assertTrue(result.resume["summary"])


if __name__ == "__main__":
    unittest.main()
