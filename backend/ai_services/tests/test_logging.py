import logging
import unittest

from ai_services.application_generation import DocumentsUnavailable, generate_application_documents
from ai_services import resume_generation as rg
from ai_services.resume_intelligence.agent import ResumeAgent
from ai_services.resume_intelligence.llm import GroqLLM
from ai_services.resume_intelligence.trace import describe_error, preview
from ai_services.tests.helpers import BACKEND, gold

MASTER, JD = BACKEND["master_resume"], BACKEND["job_description"]


class FakeRateLimit(Exception):
    status_code = 429

    class response:
        headers = {"retry-after": "12", "x-ratelimit-remaining-tokens": "0"}


class FakeClient:
    """Plays Groq: the first calls succeed, then it rate limits."""

    def __init__(self, ok_calls, reply):
        self.ok_calls, self.reply, self.calls = ok_calls, reply, 0
        self.chat = self
        self.completions = self

    def create(self, **kwargs):
        self.kwargs = kwargs
        self.calls += 1
        if self.calls > self.ok_calls:
            raise FakeRateLimit("Rate limit reached for model")
        message = type("M", (), {"content": self.reply})
        choice = type("C", (), {"message": message, "finish_reason": "stop"})
        usage = type("U", (), {"prompt_tokens": 100, "completion_tokens": 50})
        return type("R", (), {"choices": [choice], "usage": usage})


class LoggingTests(unittest.TestCase):
    def test_preview_is_short_single_line_and_can_be_disabled(self):
        self.assertLessEqual(len(preview("word " * 500, 200)), 230)
        self.assertNotIn("\n", preview("a\n\nb"))
        self.assertEqual(preview("secret", 0), "<hidden>")

    def test_rate_limit_is_classified_with_retry_after(self):
        info = describe_error(FakeRateLimit("x"))
        self.assertEqual((info["kind"], info["status_code"], info["retry_after"]), ("rate_limited", 429, "12"))
        self.assertEqual(describe_error(ValueError("bad json"))["kind"], "unusable_output")

    def test_failure_names_the_stage_and_reason_and_logs_every_step(self):
        import json
        client = FakeClient(ok_calls=1, reply=json.dumps({"title": "Backend Engineer", "required_skills": ["Python"]}))  # analysis ok, first draft rate limited
        llm = GroqLLM("test-model", client=client)
        original = rg.build_agent
        rg.build_agent = lambda: ResumeAgent(llm)
        try:
            with self.assertLogs("api", level="INFO") as logs, self.assertRaises(DocumentsUnavailable) as caught:
                generate_application_documents(JD, MASTER)
        finally:
            rg.build_agent = original
        text = "\n".join(logs.output)
        self.assertEqual(caught.exception.to_dict()["failed_stage"], "resume")
        self.assertEqual(caught.exception.to_dict()["reason"], "rate_limited")
        self.assertIn(caught.exception.trace_id, text)
        for expected in ("analyze llm_call ok", "resume.draft0 llm_call FAILED", "kind=rate_limited", "status_code=429", "retry_after=12", "ABORTED at resume"):
            self.assertIn(expected, text)
        self.assertTrue(all(len(line) < 700 for line in logs.output))

    def test_successful_run_logs_scores_per_draft(self):
        from ai_services.tests.helpers import ScriptedLLM
        llm = ScriptedLLM(generations=[gold()])
        with self.assertLogs("api", level="INFO") as logs:
            ResumeAgent(llm).run(MASTER, JD)
        text = "\n".join(logs.output)
        self.assertIn("resume.draft0 evaluated", text)
        self.assertIn("resume finished", text)


if __name__ == "__main__":
    unittest.main()


class ReasoningModelTests(unittest.TestCase):
    def test_empty_reply_from_exhausted_output_budget_is_reported_not_parsed(self):
        from ai_services.resume_intelligence.llm import OutputTruncated

        class Client(FakeClient):
            def create(self, **kwargs):
                self.kwargs = kwargs
                r = super().create(**kwargs)
                r.choices[0].finish_reason = "length"
                return r

        client = Client(ok_calls=5, reply="")
        llm = GroqLLM("openai/gpt-oss-20b", client=client)
        with self.assertLogs("api", level="INFO") as logs, self.assertRaises(OutputTruncated):
            llm.complete("sys", "user")
        self.assertIn("output cap reached", "\n".join(logs.output))
        self.assertGreaterEqual(client.kwargs["max_tokens"], 4000)
        self.assertEqual(client.kwargs["extra_body"], {"reasoning_effort": "low"})
        self.assertEqual(describe_error(OutputTruncated("x"))["kind"], "output_truncated")

    def test_other_models_get_no_reasoning_parameter(self):
        client = FakeClient(ok_calls=5, reply="{}")
        GroqLLM("llama-3.3-70b-versatile", client=client).complete("s", "u")
        self.assertNotIn("extra_body", client.kwargs if hasattr(client, "kwargs") else {})
