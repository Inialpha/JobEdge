from django.contrib import admin
from .models import User
from authemail.admin import EmailUserAdmin
from django.contrib.auth import get_user_model
from django.apps import apps

class CustomUserAdmin(EmailUserAdmin):
    model = User
    list_filter = ["is_staff"]

admin.site.unregister(get_user_model())
admin.site.register(User, CustomUserAdmin)



app_models = apps.get_app_config("api").get_models()

for model in app_models:
    # Skip User since you already handled that one
    if model not in {User}:
        try:
            admin.site.register(model)
        except admin.sites.AlreadyRegistered:
            pass
