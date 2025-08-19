from rest_framework import serializers

from ..models.job import Job

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "job_publisher",
            "job_title",
            "job_description",
            "job_qualifications",
            "job_responsibilities",
            "job_benefits",
            "job_tags",
            "job_html",
            "company",
            "job_location",
            "job_is_remote",
            "job_employment_types",
            "job_salary",
            "job_apply_link",
            "job_posted_at_timestamp",
            "job_last_checked",
            "is_active",
        ]




    """id = serializers.CharField(read_only=True)
    job_title = serializers.CharField(max_length=255)
    job_posted_at_timestamp = serializers.CharField(max_length=255)
    job_id_from_source = serializers.CharField(max_length=255, write_only=True)
    employer_name = serializers.CharField(max_length=255)
    employer_logo = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    employer_website = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    job_publisher = serializers.CharField(max_length=255)
    job_employment_type = serializers.ChoiceField(choices=['full-time', 'part-time', 'contractor'], default='full-time')
    job_employment_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['fulltime', 'parttime', 'contractor']),
        default=[]
    )
    job_apply_link = serializers.URLField()
    job_apply_is_direct = serializers.BooleanField(default=False)
    job_description = serializers.CharField()
    job_is_remote = serializers.BooleanField(default=False)
    job_posted_at_human_readable = serializers.CharField(max_length=100, read_only=True)
    job_location = serializers.CharField(max_length=255)
    job_city = serializers.CharField(max_length=100)
    job_state = serializers.CharField(max_length=100)
    job_country = serializers.CharField(max_length=100)
    job_benefits = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
        default=None
    )
    job_google_link = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    job_salary = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    job_min_salary = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    job_max_salary = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    job_qualifications = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    job_responsibilities = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )"""

    def create(self, validated_data):
        from api.models.job import Job

        job = Job(**validated_data)
        job.save()
        return job
