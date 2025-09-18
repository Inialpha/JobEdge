from rest_framework import serializers
from ..models import Resume, User
from django.conf import settings
import uuid
import os
import filetype
from .user import UserSerializer

class ResumeSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=255, read_only=True)
    file_url = serializers.URLField(max_length=500, required=False, read_only=True)
    file = serializers.FileField(required=False, write_only=True)
    text = serializers.CharField()
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    is_master = serializers.BooleanField(default=False)
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=255),
        default=[],
        help_text="Keywords from the resume relevant for job searching"
    )
    name = serializers.CharField(max_length=255)
    summary = serializers.CharField()
    address = serializers.CharField(allow_null=True, required=False)
    email = serializers.EmailField()
    linkedin = serializers.URLField(max_length=500, allow_null=True, required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    website = serializers.URLField(required=False, allow_null=True, max_length=500)
    professional_experiences = serializers.ListField(
        child=serializers.DictField(),
        default=[],
        help_text="User's professional experiences"
    )
    skills = serializers.ListField(
        child=serializers.CharField(max_length=255),
        default=[],
        help_text="List of user's skills"
    )
    projects = serializers.ListField(
        child=serializers.DictField(),
        default=[],
        help_text="User's projects"
    )
    educations = serializers.ListField(
        child=serializers.DictField(),
        default=[],
        help_text="List of user's education"
    )
    languages = serializers.ListField(
        child=serializers.CharField(max_length=255),
        default=[],
        help_text="Languages spoken by the user"
    )

    def create(self, validated_data):
        """
        Create a new Resume instance with the validated data.
        """
        try:
            file = validated_data.pop("file")
            file_url = upload(file, "files")
            validated_data["file_url"] = file_url
        except KeyError:
            pass
        return Resume.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """
        Update an existing Resume instance with the validated data.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


def upload(file, file_type):

    if not os.path.exists(settings.MEDIA_ROOT):
        os.makedirs(settings.MEDIA_ROOT)
    media_dir = file_type
    full_path = os.path.join(settings.MEDIA_ROOT, media_dir)
    if not os.path.exists(full_path):
        os.makedirs(full_path)
    u_id = uuid.uuid4()
    ext = filetype.guess(file).extension
    full_path = os.path.join(full_path, f"{u_id}.{ext}")
    print(full_path)
    with open(full_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)
    return f"http://localhost:8000/media/{media_dir}/{u_id}.{ext}"
