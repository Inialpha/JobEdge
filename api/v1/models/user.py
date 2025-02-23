""" This module contains code for the user model """
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    first_name = Column(String(255), nullable=False)
    last_name = Column(String(256), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    is_staff = Column(Boolean, default=False)
    has_master_resume = Column(Boolean, default=False)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
