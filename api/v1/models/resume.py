from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Resume(BaseModel):
    __tablename__ = "resumes"

    file_url = Column(String(500), nullable=True)
    text = Column(Text, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    is_master = Column(Boolean, default=False)
    keywords = Column(JSON, default=[])
    name = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    address = Column(Text, nullable=True)
    email = Column(String(255), nullable=True)
    linkedin = Column(String(500), nullable=True)
    phone_number = Column(String(20), nullable=True)
    website = Column(String(500), nullable=True)
    professional_experiences = Column(JSON, default=[])
    skills = Column(JSON, default=[])
    projects = Column(JSON, default=[])
    educations = Column(JSON, default=[])
    languages = Column(JSON, default=[])

    user = relationship("User", back_populates="resumes")
