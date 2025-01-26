import os
from dotenv import load_dotenv

load_dotenv()

from langchain_groq import ChatGroq

from typing import Optional, List

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder


class ProfessionalExperience(BaseModel):
    organization: str = Field(description="Name of organization user work in")
    role: str = Field(description="User's role in organization")
    time: str = Field(description="Time user spent in organization")
    responsibilities: List[str] = Field(description="User's responsibilities in organization")


class Project(BaseModel):
    name: str = Field(description="Project's name including tag")
    description: str | List[str]


class Education(BaseModel):
    school_name: str = Field(description="Name of the school")
    certificate: str = Field(description="Certificate or qualification recieved from the school")
    time: str = Field(description="Time spent in the school")



class Resume(BaseModel):
    """Resume detail response."""
    keywords: List[str] = Field(description="Keywords from the resume relevant for searching for a job")
    name: str = Field(description="Name of the user")
    summary: str = Field(description="Summary of the resume")
    address: str = Field(description="User's address")
    email: str = Field(description="User's email")
    linkedin: str = Field(description="User's linkedin link")
    phone_number: Optional[str] = Field(default=None, description="User's phone number")
    website: str = Field(description="User's website")
    professional_experiences: List[ProfessionalExperience] = Field(description="User's professional experiences")
    skills: List[str] = Field(description="User's skills")
    projects: List[Project] = Field(description="User's projects")
    educations: List[Education] = Field(description="List of user's education")
    languages: List[str] = Field(description="Languages spoken by user")

class Resume2(BaseModel):
    """ Resume details response """
    phone_number: Optional[str] = Field(default=None, description="User's phone number")
    website: str = Field(description="User's website")
    professional_experiences: List[ProfessionalExperience] = Field(description="User's professional experiences")
    skills: List[str] = Field(description="User's skills")
    projects: List[Project] = Field(description="User's projects")
    educations: List[Education] = Field(description="List of user's education")
    languages: List[str] = Field(description="Languages spoken by user")




def ai(text):

    llm1 = ChatGroq(
        model="mixtral-8x7b-32768",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
    model1 = llm1.with_structured_output(schema=Resume2)

    llm2 = ChatGroq(
        model="llama3-70b-8192",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        )
    model2 = llm2.with_structured_output(schema=Resume)

    

    prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert information extractor"
            "Only extract relevant information from the resume. "
            "Provide Keywords from the resume relevant for searching for a job."
            "Do not modify the extracted information. "
            "If you do not know the value of an attribute asked to extract return null for the attribute's value, "
        ),
        ("human", "Extract information from this resume {text}"),
    ]
)
    prompt = prompt_template.invoke({"text": text})
    try:
        res = model2.invoke(prompt)
        return res.dict()
        
    except Exception as e:
        print(e)

def generate_resume(job, resume):
    print(job)

    print(resume)

    prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a human resource expert specializing in tailoring resumes to fit specific job descriptions. Your task is to create a tailored resume that aligns with the job description.
            Constraint:
            Do not add any new information or modify the existing information in the master resume
            Only skills relevant to this job and present in the resume should be included
            Only projects relevant to this job should be included
            The summary should be obtimised and capture the candidate's value proposition and relevance to the job.
            The resume should be well-structured and easy to read.
            The keywords must be related to users skills projects and experience.
            Evaluation criteria:
            Relevance of the candidate's experience, skills, and education to the job requirements  Quality of the summary and its ability to capture the candidate's value proposition and relevance to the job
            Clarity and readability of the resume       Adherence to the constraints and output format"""
        ),
        (
            "human",
            """Based on this master resume: {master_resume}, generate a tailored resume that suits this job description: {job}."""
        )
    ]
    )

    llm = ChatGroq(
        model="llama3-70b-8192",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
    model = llm.with_structured_output(schema=Resume)


    prompt = prompt_template.invoke({"master_resume": resume, "job": job})
    try:
        res = model.invoke(prompt)
        return res.dict()
    except Exception as e:
        print(e)

