from django.db import models
from . import User
from .base_model import BaseModel

class Resume(BaseModel):
    file_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL to the uploaded resume file")
    text = models.TextField(help_text="Parsed text from the resume")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resumes", help_text="User associated with the resume")
    is_master = models.BooleanField(default=False, help_text="Indicates if this is the master resume")
    keywords = models.JSONField(default=list, help_text="Keywords from the resume relevant for job searching")
    name = models.CharField(max_length=255, help_text="Name of the user")
    profession = models.CharField(max_length=255, help_text="Users profession")
    summary = models.TextField(help_text="Summary of the resume")
    personal_information = models.JSONField(default=list, help_text="List of personal information strings (name, email, phone, address, linkedin, website)")
    address = models.TextField(blank=True, null=True, help_text="User's address")
    email = models.EmailField(max_length=255, blank=True, null=True, help_text="User's email address")
    linkedin = models.URLField(max_length=500, blank=True, null=True, help_text="User's LinkedIn profile URL")
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="User's phone number")
    website = models.URLField(max_length=500, blank=True, null=True, help_text="User's personal or professional website")
    professional_experiences = models.JSONField(default=list, help_text="User's professional experiences")
    skills = models.JSONField(default=list, help_text="List of user's skills")
    projects = models.JSONField(default=list, help_text="User's projects")
    educations = models.JSONField(default=list, help_text="List of user's education")
    languages = models.JSONField(default=list, help_text="Languages spoken by the user")

    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the resume was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="Timestamp when the resume was last updated")

    def __str__(self):
        return f"{self.name}'s Resume ({'Master' if self.is_master else 'Draft'})"

