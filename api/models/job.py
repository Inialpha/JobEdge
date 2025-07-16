from django.db import models
from django.core.validators import MinValueValidator, URLValidator
from .base_model import BaseModel
from .company import Company


class Job(BaseModel):
    EMPLOYMENT_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contractor', 'Contractor')
    ]
    #  Job Identfication 
    job_publisher = models.CharField(max_length=255)
    
    # Details
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    job_qualifications = models.JSONField(default=list)
    job_responsibilities = models.JSONField(default=list)
    job_html = models.TextField()
    job_category = models.CharField(max_length=255)
    job_tag = models.JSONField(default=list)

    # Employment Type
    job_employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='full-time')
    job_employment_types = models.JSONField(default=list)

    # Salary & Compensation
    job_benefits = models.JSONField(blank=True, null=True, default=list)
    job_salary = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])

    # Location & Remote Work
    job_is_remote = models.BooleanField(default=False)
    job_location = models.CharField(max_length=255)
    job_country = models.CharField(max_length=255)

    # Employer Details
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="jobs", help_text="Company associated with the job")
    
    # Application Information
    job_apply_link = models.URLField(validators=[URLValidator()], max_length=500)

    # Tracking
    job_posted_at_timestamp = models.CharField(max_length=255)
    job_last_checked = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)


    def __str__(self):
        return f"{self.job_title} at {self.employer_name}"
