from django.db import models
from django.core.validators import URLValidator
from .base_model import BaseModel


class Company(BaseModel):
    company_name = models.CharField(max_length=500)
    company_description = models.TextField(blank=True, null=True, default="")
    company_logo = models.URLField(blank=True, null=True, validators=[URLValidator()], max_length=500)
    company_website = models.URLField(blank=True, null=True, validators=[URLValidator()], max_length=500)
    platform = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.company_name} - {self.platform}"
