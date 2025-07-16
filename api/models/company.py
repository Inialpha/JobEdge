from django.db import models
from django.core.validators import URLValidator
from .base_model import BaseModel


class Company(BaseModel):
    company_name = models.CharField(max_length=500)
    company_description = models.TextField()
    company_logo = models.URLField(blank=True, null=True, validators=[URLValidator()])
    company_website = models.URLField(blank=True, null=True, validators=[URLValidator()])
    platform = models.CharField(max_length=255)

    def __str__(self):
        return self.company_name
