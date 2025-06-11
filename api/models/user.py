""" This module contains code for the user model """
from django.db import models
from django.contrib.auth.models import PermissionsMixin
from authemail.models import EmailUserManager, EmailAbstractUser
import uuid
from django.core.validators import MinLengthValidator

from django.contrib.auth.models import AbstractUser

class User(EmailAbstractUser, PermissionsMixin):
    """ A user class email functionalities """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=256)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    has_master_resume = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'password']
    objects = EmailUserManager()
   
    def __str__(self):
        return f"{self.first_name} {self.last_name}"


    def has_perms(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
