from datetime import datetime, timedelta
import dateparser


def structure(job):
    structured_job = {}
    # Job Identfication
    structured_job["job_publisher"] = job.get("job_publisher", "")

    # Details
    structured_job["job_title"] = job.get("job_title", "")
    structured_job["job_qualifications"] = job.get("job_qualifications", [])
    structured_job["job_responsibilities"] = job.get("job_responsibilities")
    structured_job["job_html"] = job.get("job_html", "")
    structured_job["job_description"] = job.get("job_description")
    structured_job["job_category"] = job.get("job_category", "")
    structured_job["job_tags"] = job.get("job_tags", [])

    # Employment Type
    structured_job['job_employment_type'] = job.get('job_employment_type').lower()
    structured_job['job_employment_types'] = [job_type.lower() for job_type in
        job.get('job_employment_types', [])]
    
    # Salary & Compensation
    structured_job["job_benefits"] = job.get("job_benefits", [])
    structured_job["job_salary"] = job.get("job_salary", "")

    # Location & Remote Work
    structured_job["job_location"] = job.get("job_location", "")
    
    structured_job["job_country"] = job.get("job_country", "")
    structured_job["job_is_remote"] = job.get("job_is_remote", False)
    
    # Application Information
    structured_job["job_apply_link"] = job.get("job_apply_link", "")

    # Tracking
    structured_job["job_posted_at_timestamp"] = str(dateparser.parse(job.get("job_posted_at_timestamp", "")))

    # Employer Details
    structured_job["company"] = job.get("company", {})
    
    return structured_job

from api.serializers.job import JobSerializer


def create_job(job):
    try:
        structured_job = structure(job)
        print("structured ----------", structured_job)
        serializer = JobSerializer(data=structured_job)
        if serializer.is_valid():
            return serializer.save()
        else:
            print("serializer error", serializer.errors)
    except Exception as e:
        raise e
        print(e)
