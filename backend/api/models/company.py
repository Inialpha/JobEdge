from django.db import models
from . import User
from .base_model import BaseModel


class Company(BaseModel):
    company_name = models.CharField(max_length=500)
    company_description = models.TextField(blank=True, null=True)
    company_logo = models.URLField(max_length=500, blank=True, null=True)
    company_website = models.URLField(max_length=500, blank=True, null=True)
    platform = models.CharField(max_length=255, unique=True)
