from django.db import models
from django.core.validators import MinValueValidator, URLValidator
from .base_model import BaseModel


class Job(BaseModel):
    EMPLOYMENT_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contractor', 'Contractor')
    ]
    
    job_id_from_source = models.CharField(max_length=255, unique=True)
    job_posted_at_timestamp = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    employer_name = models.CharField(max_length=255)
    employer_logo = models.URLField(blank=True, null=True, validators=[URLValidator()])
    employer_website = models.URLField(blank=True, null=True, validators=[URLValidator()])
    job_publisher = models.CharField(max_length=255)
    job_employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='full-time')
    job_employment_types = models.JSONField(default=list)
    job_apply_link = models.URLField(validators=[URLValidator()], max_length=500)

    job_apply_is_direct = models.BooleanField(default=False)
    job_description = models.TextField()
    job_is_remote = models.BooleanField(default=False)
    job_location = models.CharField(max_length=255)
    job_city = models.CharField(max_length=100)
    job_state = models.CharField(max_length=100)
    job_country = models.CharField(max_length=100)
    job_benefits = models.JSONField(blank=True, null=True, default=list)
    job_google_link = models.URLField(blank=True, null=True, validators=[URLValidator()])
    job_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    job_min_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    job_max_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    job_qualifications = models.JSONField(default=list)
    job_responsibilities = models.JSONField(default=list)

    def __str__(self):
        return f"{self.job_title} at {self.employer_name}"
