from rest_framework import serializers
from api.models.company import Company

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "company_name",
            "company_description",
            "company_logo",
            "company_website",
            "platform",
        ]
