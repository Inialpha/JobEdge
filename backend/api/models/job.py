from django.db import models
from django.core.validators import MinValueValidator, URLValidator
from .base_model import BaseModel
from api.models.company import Company

class Job(BaseModel):
    EMPLOYMENT_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contractor', 'Contractor')
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    job_publisher = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    #job_html = models.TextField()
    job_qualifications = models.JSONField()
    job_responsibilities = models.JSONField()
    job_category = models.CharField(max_length=255)
    job_tags = models.JSONField()
    job_employment_types = models.JSONField()
    job_benefits = models.JSONField(blank=True, null=True)
    job_salary = models.CharField(max_length=255, blank=True, null=True)
    job_is_remote = models.BooleanField(default=False)
    job_location = models.JSONField()
    job_apply_link = models.URLField(max_length=500, unique=True)
    job_posted_at_timestamp = models.CharField(max_length=255)
    job_last_checked = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
