from rest_framework import serializers
from ..models import Application, User, Resume
from .resume import ResumeSerializer


class ApplicationSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=255, read_only=True)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    job_description = serializers.CharField()
    resume = serializers.PrimaryKeyRelatedField(queryset=Resume.objects.all())
    cover_letter = serializers.CharField()
    job_link = serializers.URLField(max_length=500, required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        """
        Create a new Application instance with the validated data.
        """
        return Application.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """
        Update an existing Application instance with the validated data.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def to_representation(self, instance):
        """
        Customize the representation to include nested resume data.
        """
        representation = super().to_representation(instance)
        # Include full resume data in the response
        representation['resume'] = ResumeSerializer(instance.resume).data
        return representation
