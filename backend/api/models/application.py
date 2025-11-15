from django.db import models
from . import User, Resume
from .base_model import BaseModel


class Application(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications", help_text="User who created the application")
    job_description = models.TextField(help_text="Job description for this application")
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="applications", help_text="Resume associated with this application")
    cover_letter = models.TextField(help_text="Cover letter for this application")
    job_link = models.URLField(max_length=500, blank=True, null=True, help_text="Optional link to the job posting")
    
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the application was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="Timestamp when the application was last updated")

    def __str__(self):
        return f"Application by {self.user.email} - {self.created_at.strftime('%Y-%m-%d')}"
