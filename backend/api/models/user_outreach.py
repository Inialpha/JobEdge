"""Model for tracking user outreach activity"""
from django.db import models
from .user import User
from .base_model import BaseModel


class UserOutreach(BaseModel):
    """Track outreach emails sent to users to avoid duplicates"""
    
    OUTREACH_TYPES = [
        ('INCOMPLETE_PROFILE', 'Incomplete Profile'),
        ('NO_APPLICATION', 'No Application'),
        ('NO_JOB_SEARCH', 'No Job Search'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="outreach_records",
        help_text="User who received the outreach"
    )
    outreach_type = models.CharField(
        max_length=50, 
        choices=OUTREACH_TYPES,
        help_text="Type of outreach sent"
    )
    sent_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the outreach was sent"
    )
    
    class Meta:
        unique_together = ['user', 'outreach_type']
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.outreach_type} - {self.user.email} - {self.sent_at.strftime('%Y-%m-%d')}"
