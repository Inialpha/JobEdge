from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uuid

class JobBase(BaseModel):
    job_title: str
    employer_name: str
    job_description: str
    job_location: str

class JobCreate(JobBase):
    job_id_from_source: str
    job_employment_type: str
    job_employment_types: List[str] = []
    job_apply_link: HttpUrl
    job_is_remote: bool = False

class JobUpdate(BaseModel):
    job_title: Optional[str] = None
    job_description: Optional[str] = None

class JobResponse(JobBase):
    id: uuid.UUID
    job_is_remote: bool
    job_apply_link: HttpUrl

    class Config:
        orm_mode = True
