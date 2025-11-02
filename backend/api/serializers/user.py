from rest_framework import serializers
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class UserSerializer(serializers.Serializer):
    id = serializers.UUIDField(default=uuid.uuid4, read_only=True)
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=256)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, max_length=128)
    is_staff = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        return User.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.password = validated_data.get('password', instance.password)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        instance.save()
        return instance


from authemail.serializers import SignupSerializer
from rest_framework import serializers


class CustomSignupSerializer(SignupSerializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(max_length=128)
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=30)
    is_staff = serializers.BooleanField(read_only=True)
    has_master_resume = serializers.BooleanField(read_only=True)

class ProfileSerializer(SignupSerializer):
    id = serializers.UUIDField(default=uuid.uuid4, read_only=True)
    email = serializers.EmailField(max_length=255)
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=30)
    is_staff = serializers.BooleanField(read_only=True)
    has_master_resume = serializers.BooleanField(read_only=True)
