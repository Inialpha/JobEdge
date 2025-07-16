import os
from dotenv import load_dotenv

load_dotenv()

from langchain_groq import ChatGroq

from typing import Optional, List

from pydantic import BaseModel, Field, HttpUrl, conint
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from enum import Enum


class JobCategory(str, Enum):
    ADMINISTRATIVE = "Administrative & Office Support"
    AGRICULTURE = "Agriculture, Forestry & Fishing"
    ARTS = "Arts, Culture & Entertainment"
    BUSINESS = "Business, Consulting & Management"
    COMMUNITY = "Community & Social Services"
    CONSTRUCTION = "Construction & Skilled Trades"
    CUSTOMER_SERVICE = "Customer Service"
    EDUCATION = "Education & Training"
    ENGINEERING = "Engineering & Technical"
    FINANCE = "Finance & Accounting"
    HEALTHCARE = "Healthcare & Medical"
    HOSPITALITY = "Hospitality & Tourism"
    HUMAN_RESOURCES = "Human Resources (HR)"
    INFORMATION_TECHNOLOGY = "Information Technology (IT) & Software Development"
    LEGAL = "Legal & Law Enforcement"
    MANUFACTURING = "Manufacturing & Production"
    MARKETING = "Marketing, Advertising & PR"
    MEDIA = "Media & Communications"
    REAL_ESTATE = "Real Estate & Property"
    RETAIL = "Retail & Sales"
    SCIENCE = "Science & Research"
    SUPPLY_CHAIN = "Supply Chain & Logistics"
    TRANSPORTATION = "Transportation"
    UTILITIES = "Utilities & Energy"

class Job1(BaseModel):
    # Job Identification
    job_publisher: str = Field(
        ...,
        description="The name of the source or platform publishing the job"
    )

    # Job Details
    job_title: str = Field(
        ...,
        description="The full title of the job as displayed on the listing."
    )
    job_description: str = Field(
        ...,
        description="The full job description including company background, culture, etc."
    )
    job_qualifications: List[str] = Field(
        default_factory=list,
        description="A list of job requirements, qualifications, and experience expected from the candidate."
    )
    job_responsibilities: List[str] = Field(
        default_factory=list,
        description="A list of key responsibilities and tasks associated with the job."
    )
    job_benefits: Optional[List[str]] = Field(
        default_factory=list,
        description="A list of employee benefits offered (e.g., health insurance, remote work, equity)."
    )

    # Employer Details
    employer_name: str = Field(
        ...,
        description="The full name of the hiring employer or company."
    )
    employer_logo: Optional[HttpUrl] = Field(
        None,
        description="A URL to the company's logo image, if available."
    )
    employer_website: Optional[HttpUrl] = Field(
        None,
        description="The website URL of the employer's profile or homepage."
    )

    # Location & Remote Work
    job_location: str = Field(
        ...,
        description="Full location string as listed (e.g., 'New York, NY, United States')."
    )
    job_country: Optional[str] = Field(
        None,
        description="Country parsed from the location string (e.g., 'United States')."
    )
    job_is_remote: bool = Field(
        default=False,
        description="Boolean flag indicating whether the job is explicitly remote."
    )
    # Employment Type
    job_employment_type: str = Field(
        default='full-time',
        description="The primary employment type (e.g., 'full-time', 'part-time', 'contractor')."
    )
    job_employment_types: List[str] = Field(
        default_factory=list,
        description="List of all applicable employment types."
    )
    # Salary & Compensation
    job_salary: Optional[conint(ge=0)] = Field(
        None,
        description="Overall salary value if a single estimate is provided including currency and time period."
    )
    # Additional Information
    job_tags: List[str] = Field(
        default_factory=list,
        description="A list of keywords or tags from the jobs"
    )
    job_category: JobCategory
    
def construct_job(job):

    prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
            You are an intelligent job information extraction system.

Your task is to analyze a raw job listing (in plain text or simplified HTML) and extract structured data that fits into the following fields, following the format and rules provided.

Extract as much information as possible. If certain fields are not found, leave them empty or use defaults as instructed. Be precise, concise, and avoid hallucinating or assuming any details not explicitly stated in the text.

- Look for keywords like “Responsibilities”, “Requirements”, “Qualifications”, and “Benefits” to extract relevant lists.
- For salary, extract numbers and determine min/max. If only one value is provided, use it for both.
- Set `job_is_remote = true` if the title or body mentions "remote".
- If salary currency is not stated, try to infer from symbols (`$` = USD, `€` = EUR).
- Make sure to provide keywords related to the job in tags.
- Add the employment type to the employment type list.
- Infer the country from the location string.
- Make sure everything is in plain text not html.
- Make sure to find the employer logo in the head and link tag.
- Do not fabricate data. Only extract what is clearly present.

Now wait for input containing the job listing text and return the structured JSON.
            """
        ),
        (
            "human",
            """ Extract information from this {job}."""
        )
    ]
    )

    llm = ChatGroq(
        #model="llama-3.3-70b-versatile",
        model="llama3-70b-8192",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
    model_1 = llm.with_structured_output(schema=Job1)
    prompt = prompt_template.invoke({"job": job})
    try:
        res = model_1.invoke(prompt)
        return res.dict()
    except Exception as e:
        print(e)
