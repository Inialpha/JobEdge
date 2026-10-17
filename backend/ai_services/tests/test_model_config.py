import os
import re
import unittest
from pathlib import Path
from unittest import mock

from ai_services import model_config
from ai_services.resume_intelligence.trace import describe_error

ROOT = Path(__file__).resolve().parents[2]
# Family / vendor names that only ever appear in a model identifier.
MODEL_NAME = re.compile(r"gpt-oss|llama|mixtral|mistral|gemma|qwen|deepseek|openai/|claude-|gpt-[0-9]", re.I)


class ModelNamesComeFromTheEnvironment(unittest.TestCase):
    def test_no_model_name_is_hard_coded_anywhere_in_the_backend(self):
        offenders = []
        for path in list(ROOT.glob("ai_services/**/*.py")) + list(ROOT.glob("api/**/*.py")) + list(ROOT.glob("JobEdgeApi/**/*.py")):
            if "/tests/" in str(path) or "/migrations/" in str(path):
                continue
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if MODEL_NAME.search(line):
                    offenders.append(f"{path.relative_to(ROOT)}:{number}: {line.strip()}")
        self.assertEqual(offenders, [])

    def test_values_come_from_the_environment(self):
        env = {"RESUME_GENERATOR_MODEL": "gen-x", "RESUME_EVALUATOR_MODEL": "eval-x", "RESUME_EXTRACTION_MODEL": "ext-x", "JOB_EXTRACTION_MODEL": "job-x"}
        with mock.patch.dict(os.environ, env):
            self.assertEqual(
                (model_config.generator_model(), model_config.evaluator_model(), model_config.resume_extraction_model(), model_config.job_extraction_model()),
                ("gen-x", "eval-x", "ext-x", "job-x"),
            )

    def test_missing_variable_is_named_in_the_error(self):
        with mock.patch.dict(os.environ, {"RESUME_GENERATOR_MODEL": ""}):
            with self.assertRaises(model_config.ModelNotConfigured) as caught:
                model_config.generator_model()
        self.assertIn("RESUME_GENERATOR_MODEL", str(caught.exception))
        self.assertEqual(describe_error(caught.exception)["kind"], "model_not_configured")


if __name__ == "__main__":
    unittest.main()
