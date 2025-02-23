from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

# Schema for user creation
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

# Schema for returning user data
class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    is_staff: bool
    has_master_resume: bool

    class Config:
        from_attributes = True  # Allows returning ORM models as Pydantic objects
