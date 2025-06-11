from django.db import models
from django.core.validators import MinValueValidator, URLValidator
from .base_model import BaseModel


class Job(BaseModel):
    EMPLOYMENT_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contractor', 'Contractor')
    ]

    # Job Identification
    job_id_from_source = models.CharField(unique=True, max_length=500)
    job_google_link = models.URLField(blank=True, null=True, validators=[URLValidator()], max_length=1000)
    job_publisher = models.CharField(max_length=255)

    # Job Details
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    job_qualifications = models.JSONField(default=list) 
    job_responsibilities = models.JSONField(default=list)
    job_benefits = models.JSONField(blank=True, null=True, default=list)

    # Employer Details
    employer_name = models.CharField(max_length=255)
    employer_logo = models.URLField(blank=True, null=True, validators=[URLValidator()])
    employer_website = models.URLField(blank=True, null=True, validators=[URLValidator()])

    # Location & Remote Work
    job_location = models.CharField(max_length=255)
    job_city = models.CharField(max_length=100, blank=True, null=True)
    job_state = models.CharField(max_length=100, blank=True, null=True)
    job_country = models.CharField(max_length=100, blank=True, null=True)
    job_is_remote = models.BooleanField(default=False)

    # Employment Type
    job_employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='full-time')
    job_employment_types = models.JSONField(default=list)

    # Salary & Compensation
    job_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    job_min_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    job_max_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    job_salary_currency = models.CharField(max_length=10, blank=True, null=True)
    job_salary_period = models.CharField(max_length=20, blank=True, null=True)  # Period (hourly, monthly, yearly)

    # Application Information
    job_apply_link = models.URLField(validators=[URLValidator()], max_length=500)
    job_apply_links = models.JSONField(default=list)
    job_apply_is_direct = models.BooleanField(default=False)

    # Tracking & Expiry
    job_posted_at_timestamp = models.CharField(max_length=255)  # Original timestamp from source
    job_valid_through = models.DateTimeField(blank=True, null=True)  # Expiration date
    job_last_checked = models.DateTimeField(auto_now=True)  # Auto-update on job verification
    is_active = models.BooleanField(default=True)  # Active status (false if expired)

    def mark_expired(self):
        """Marks job as expired when it's no longer found."""
        self.is_active = False
        self.save()

    def __str__(self):
        return f"{self.job_title} at {self.employer_name}"
