from groq import Groq
import json

client = Groq()

def extract_job_details(job_text):
    completion = client.chat.completions.create(
        model="",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI information extraction assistant. "
                    "Your job is to analyze job posting content and return structured data "
                    "in a strict JSON format that follows the given schema. "
                    "Never include commentary, explanation, or markdown — only valid JSON."
                )
            },
            {
                "role": "user",
                "content": f"""
    Read the job posting below and extract data according to this schema:

    {{
      "job_description": "<Brief but complete natural-language summary of the role>",
      "job_html": "<Preserve HTML if available, otherwise null>",
      "job_qualifications": ["List qualifications or required experience"],
      "job_responsibilities": ["List responsibilities or duties"],
      "job_category": "<Industry or category>",
      "job_tags": ["Skills, tools, job-related keywords"],
      "job_employment_types": ["Full-Time", "Part-Time", "Contract", etc.],
      "job_benefits": ["List benefits like health insurance, bonuses, paid leave, etc."],
      "job_salary": "<Salary info if available>",
      "job_is_remote": <true or false>,
      "job_location": {{
          "city": "<City>",
          "state": "<State or region>",
          "country": "<Country>",
          "is_remote": <true or false>
      }}
    }}

    Rules:
    - Never fabricate information.
    - Use null or [] where data is missing.
    - Respond ONLY with a valid JSON object.

    --- JOB CONTENT START ---
    {job_text}
    --- JOB CONTENT END ---
    """
            }
        ],
        temperature=0,
        max_completion_tokens=8192,
        top_p=1,
        reasoning_effort="medium",
        stream=True,
    )

    collected = ""
    for chunk in completion:
        content = chunk.choices[0].delta.content or ""
        print(content, end="")
        collected += content

    # Optional: Parse JSON
    try:
        result = json.loads(collected)
        print("\n\nParsed JSON Result:\n", json.dumps(result, indent=2))
        return result
    except json.JSONDecodeError:
        print("\n\n⚠️ Output not valid JSON. Check above text.")
        return None
