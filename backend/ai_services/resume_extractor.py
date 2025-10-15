from groq import Groq
import json
from typing import Optional, List
from pydantic import BaseModel, Field



class ProfessionalExperience(BaseModel):
    organization: str = Field(description="Name of organization user worked in")
    role: str = Field(description="User's role in organization")
    time: str = Field(description="Time user spent in organization")
    responsibilities: List[str] = Field(description="User's responsibilities in organization")


class Project(BaseModel):
    name: str = Field(description="Project's name including tag")
    description: str | List[str]


class Education(BaseModel):
    school_name: str = Field(description="Name of the school")
    certificate: str = Field(description="Certificate or qualification received from the school")
    time: str = Field(description="Time spent in the school")


class Resume(BaseModel):
    """Resume detail response."""
    keywords: List[str] = Field(description="Keywords from the resume relevant for searching for a job")
    name: str = Field(description="Name of the user")
    summary: str = Field(description="Summary of the resume")
    address: str = Field(description="User's address")
    email: str = Field(description="User's email")
    linkedin: str = Field(description="User's LinkedIn link")
    phone_number: Optional[str] = Field(default=None, description="User's phone number")
    website: str = Field(description="User's website")
    professional_experiences: List[ProfessionalExperience] = Field(description="User's professional experiences")
    skills: List[str] = Field(description="User's skills")
    projects: List[Project] = Field(description="User's projects")
    educations: List[Education] = Field(description="List of user's education")
    languages: List[str] = Field(description="Languages spoken by user")



client = Groq()

def ai(text: str):
    """Extract structured resume details using Groq chat completion."""
    try:
        system_message = (
            "You are an expert information extractor. "
            "Only extract relevant information from the resume. "
            "Provide keywords relevant for job search. "
            "Do not modify the extracted information. "
            "If any value is missing, return null for that field. "
            "Return only valid JSON matching the specified schema."
        )

        user_prompt = f"""
Extract information from this resume text below and return it as JSON matching this schema:

{{
  "keywords": ["..."],
  "name": "string",
  "summary": "string",
  "address": "string",
  "email": "string",
  "linkedin": "string",
  "phone_number": "string or null",
  "website": "string",
  "professional_experiences": [
    {{
      "organization": "string",
      "role": "string",
      "time": "string",
      "responsibilities": ["..."]
    }}
  ],
  "skills": ["..."],
  "projects": [
    {{
      "name": "string",
      "description": "string or list of strings"
    }}
  ],
  "educations": [
    {{
      "school_name": "string",
      "certificate": "string",
      "time": "string"
    }}
  ],
  "languages": ["..."]
}}

Resume Text:
{text}
"""

        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            max_completion_tokens=8192,
            top_p=1,
            reasoning_effort="medium",
            stream=False,
        )

        output = completion.choices[0].message.content.strip()

        # Parse the AI output as JSON
        try:
            parsed = json.loads(output)
            return Resume(**parsed).dict()
        except json.JSONDecodeError:
            print("⚠️ AI output was not valid JSON. Returning raw text.")
            return {"raw_output": output}

    except Exception as e:
        print("❌ Error in ai():", e)
        return None


def generate_resume(job: str, resume: dict):
    """Generate a tailored resume based on a job description and a master resume."""
    try:
        system_message = (
            "You are a human resource expert specializing in tailoring resumes to fit specific job descriptions. "
            "Your task is to create a tailored resume that aligns with the job description. "
            "Constraints: Do not add new information or modify facts. "
            "Only include skills and projects relevant to the job. "
            "The summary must capture the candidate's value and fit for the job. "
            "Ensure the output is clear, well-structured, and formatted as valid JSON."
        )

        user_prompt = f"""
Master Resume:
{json.dumps(resume, indent=2)}

Job Description:
{job}

Return a JSON object in the same structure as the master resume, but tailored for this job.
"""

        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            max_completion_tokens=8192,
            top_p=1,
            reasoning_effort="medium",
            stream=False,
        )

        output = completion.choices[0].message.content.strip()

        try:
            parsed = json.loads(output)
            return parsed
        except json.JSONDecodeError:
            print("⚠️ AI output was not valid JSON. Returning raw text.")
            return {"raw_output": output}

    except Exception as e:
        print("❌ Error in generate_resume():", e)
        return None
