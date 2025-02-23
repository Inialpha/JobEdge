from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uuid

class ResumeBase(BaseModel):
    name: str
    summary: str
    user_id: uuid.UUID

class ResumeCreate(ResumeBase):
    file_url: Optional[HttpUrl] = None
    text: str
    is_master: bool = False
    keywords: List[str] = []

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    summary: Optional[str] = None

class ResumeResponse(ResumeBase):
    id: uuid.UUID
    file_url: Optional[HttpUrl]
    is_master: bool
    keywords: List[str]

    class Config:
        orm_mode = True
