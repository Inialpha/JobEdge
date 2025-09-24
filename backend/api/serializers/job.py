from rest_framework import serializers


class JobSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    job_title = serializers.CharField(max_length=255)
    job_posted_at_timestamp = serializers.CharField(max_length=255)
    job_publisher = serializers.CharField(max_length=255)
    job_employment_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['fulltime', 'parttime', 'contractor']),
        default=[]
    )
    job_apply_link = serializers.URLField()
    job_description = serializers.CharField()
    job_is_remote = serializers.BooleanField(default=False)
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
    job_salary = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    job_qualifications = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )
    job_responsibilities = serializers.ListField(
        child=serializers.CharField(),
        default=list
    )

    def create(self, validated_data):
        from api.models.job import Job

        job = Job(**validated_data)
        job.save()
        return job
