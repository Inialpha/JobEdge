from sqlalchemy import Column, String, Boolean, Integer, Text
from sqlalchemy.dialects.mysql import JSON
from .base import BaseModel

class Job(BaseModel):
    __tablename__ = "jobs"

    job_id_from_source = Column(String(255), unique=True, nullable=False)
    job_posted_at_timestamp = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    employer_name = Column(String(255), nullable=False)
    employer_logo = Column(String(500), nullable=True)
    employer_website = Column(String(500), nullable=True)
    job_publisher = Column(String(255), nullable=False)
    job_employment_type = Column(String(20), nullable=False, default="full-time")
    job_employment_types = Column(JSON, default=[])
    job_apply_link = Column(String(500), nullable=False)
    job_apply_is_direct = Column(Boolean, default=False)
    job_description = Column(Text, nullable=False)
    job_is_remote = Column(Boolean, default=False)
    job_location = Column(String(255), nullable=False)
    job_city = Column(String(100), nullable=False)
    job_state = Column(String(100), nullable=False)
    job_country = Column(String(100), nullable=False)
    job_benefits = Column(JSON, default=[])
    job_google_link = Column(String(500), nullable=True)
    job_salary = Column(Integer, nullable=True)
    job_min_salary = Column(Integer, nullable=True)
    job_max_salary = Column(Integer, nullable=True)
    job_qualifications = Column(JSON, default=[])
    job_responsibilities = Column(JSON, default=[])
