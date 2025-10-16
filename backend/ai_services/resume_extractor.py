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
            "Read the given resume text and output structured JSON that exactly matches the schema below. "
            "Each field includes a description to guide your extraction. "
            "Do not guess or invent any information. "
            "If something is missing, set its value to should be None, empty list, or empty string. "
            "Ensure the final output is valid JSON — no explanations or extra text."
        )

        user_prompt = f"""
Extract the resume information using this JSON schema and descriptions:

{{
  "keywords": List[str] — Keywords or phrases that summarize the candidate's expertise and are useful for job search.
  "name": str — Full name of the candidate as written on the resume.
  "summary": str — A concise summary describing the candidate’s professional profile and strengths.
  "address": str — Candidate’s residential or contact address.
  "email": str — Professional email address for communication.
  "linkedin": str — Link to the candidate’s LinkedIn profile.
  "phone_number": str or null — Candidate’s phone number (include country code if present).
  "website": str or null — Personal or portfolio website link.
  "professional_experiences": List[Object] — A list of previous work experiences, each with:
      {{
        "organization": str — The name of the company or organization.
        "role": str — The job title or position held.
        "time": str — The period spent at the organization (e.g., 'Jan 2021 – Dec 2023').
        "responsibilities": List[str] — Key tasks, achievements, or responsibilities handled in this role.
      }}
  "skills": List[str] — List of technical and soft skills mentioned in the resume.
  "projects": List[Object] — List of notable projects completed, each with:
      {{
        "name": str — The name or title of the project, including relevant tags or technologies.
        "description": str or List[str] — Description of the project or bullet points summarizing it.
      }}
  "educations": List[Object] — List of educational qualifications, each with:
      {{
        "school_name": str — The institution's name.
        "certificate": str — The degree, diploma, or qualification received.
        "time": str — The duration or time period of study.
      }}
  "languages": List[str] — List of languages the candidate can read, write, or speak.
}}

Resume Text:
{text}

Return the extracted information as a JSON object following this structure.
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            #max_completion_tokens=8192,
            top_p=1,
            #reasoning_effort="medium",
            stream=False,
        )

        output = completion.choices[0].message.content.strip()

        try:
            return extract_json_dict(output)
        except json.JSONDecodeError:
            print("⚠️ AI output was not valid JSON. Returning raw text.")
            return None

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

Extract the resume information using this JSON schema and descriptions:

{{
  "keywords": List[str] — Keywords or phrases that summarize the candidate's expertise and are useful for job search.
  "name": str — Full name of the candidate as written on the resume.
  "summary": str — A concise summary describing the candidate’s professional profile and strengths.
  "address": str — Candidate’s residential or contact address.
  "email": str — Professional email address for communication.
  "linkedin": str — Link to the candidate’s LinkedIn profile.
  "phone_number": str or null — Candidate’s phone number (include country code if present).
  "website": str or null — Personal or portfolio website link.
  "professional_experiences": List[Object] — A list of previous work experiences, each with:
      {{
        "organization": str — The name of the company or organization.
        "role": str — The job title or position held.
        "time": str — The period spent at the organization (e.g., 'Jan 2021 – Dec 2023').
        "responsibilities": List[str] — Key tasks, achievements, or responsibilities handled in this role.
      }}
  "skills": List[str] — List of technical and soft skills mentioned in the resume.
  "projects": List[Object] — List of notable projects completed, each with:
      {{
        "name": str — The name or title of the project, including relevant tags or technologies.
        "description": str or List[str] — Description of the project or bullet points summarizing it.
      }}
  "educations": List[Object] — List of educational qualifications, each with:
      {{
        "school_name": str — The institution's name.
        "certificate": str — The degree, diploma, or qualification received.
        "time": str — The duration or time period of study.
      }}
  "languages": List[str] — List of languages the candidate can read, write, or speak.
}}


Return the extracted information as a JSON object following this structure.
        """


        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            #max_completion_tokens=8192,
            top_p=1,
            #reasoning_effort="medium",
            stream=False,
        )

        output = completion.choices[0].message.content.strip()

        try:
            return extract_json_dict(output)
        except json.JSONDecodeError:
            print("⚠️ AI output was not valid JSON. Returning raw text.")
            return None

    except Exception as e:
        print("❌ Error in generate_resume():", e)
        return None


import json
import re

def extract_json_dict(text):
    """
    Extracts and returns the dictionary part from a string
    that contains JSON wrapped in backticks or markdown formatting.
    """
    # Try to find the JSON block between ```json ... ```
    match = re.search(r'```(?:json)?\s*({.*})\s*```', text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # fallback: extract first {...} block if no backticks
        match = re.search(r'({.*})', text, re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in text.")
        json_str = match.group(1)

    # Convert to Python dict
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON structure: {e}")
