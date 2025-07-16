import requests
from datetime import datetime, timedelta
from google_jobs import get_google_jobs
import dateparser


def fetch_jobs(page, num_page):
    url = "https://jsearch.p.rapidapi.com/search"

    querystring = {
        "query":"developer jobs in chicago",
        "page": str(page),
        "num_pages":str(num_page),
        "country":"us",
        "date_posted":"all"
    }

    headers = {
	    "x-rapidapi-key": "098e0fb97emsh5f7246148c4e456p1e72b3jsn682e2833cd0c",
    	"x-rapidapi-host": "jsearch.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    return response.json().get("data")


def structure(job):
    def get_timestamp(time_str):
        dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))

        return int(dt.timestamp())
    structured_job = {}
    print(job.get("job_title"))
    structured_job['job_employment_type'] = job.get('job_employment_type').lower()
    structured_job['job_employment_types'] = [job_type.lower() for job_type in
        job.get('job_employment_types', [])]

    structured_job["job_qualifications"] = job.get("job_qualifications", [])
    structured_job["job_responsibilities"] = job.get("job_responsibilities")
    structured_job["job_benefits"] = job.get("job_benefits", [])
    structured_job["job_title"] = jobget("job_title", "")
    structured_job["job_location"] = job.get("job_location", "")
    
    structured_job["job_country"] = job("job_country", "")
    structured_job["job_is_remote"] = job.get("job_is_remote", False)
    structured_job["job_salary"] = job.get("job_salary", "")
    structured_job["job_apply_link"] = job.get("job_apply_link", "")
    structured_job["job_html"]
    structured_job["job_posted_at_timestamp"] = dateparser.parse(job.get"job_posted_at_timestamp", "")
    structured_job["company"] = job.get("company", {})

from api.serializers.job import JobSerializer
num_pages = 20

def get_rapidapi_jobs():
    for page in range(5):
        jobs = fetch_jobs(page * num_pages + 1, num_pages)

        for job in jobs:
            try:
                structured_job = structure(job)
                serializer = JobSerializer(data=structured_job)
                if serializer.is_valid():
                    serializer.save()
                else:
                    print("serializer error", serializer.errors)

            except Exception as e:
                print("error", e)



def structure_google_job(job):
    def get_timestamp(time_str):
        dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        return int(dt.timestamp())

    print(job.get("title"))
    job['job_title'] = job.get('title')
    job['job_description'] = job.get('description')
    job['job_location'] = job.get('location')
    job['job_id_from_source'] = job.get('job_id')
    job['job_google_link'] = job.get('share_link', '')
    job['employer_name'] = job.get('company_name', '')
    job['employer_logo'] = job.get('thumbnail', '')
    job['job_publisher'] = "Google"
    job['job_apply_links'] = job.get('apply_options')
    job['job_apply_link'] = job.get('apply_options')[0].get('link')

    job['job_employment_type'] = job.get('detected_extensions', {}).get("schedule_type", "").lower()
    job['job_employment_types'] = [job.get('detected_extensions').get("schedule_type").lower()]
    job_highlights = {item["title"]: item["items"] for item in job.get("job_highlights", {})}
    job["job_qualifications"] = job_highlights.get("Qualifications")
    job["job_responsibilities"] = job_highlights.get("Responsibilities")
    job["Benefits"] = job_highlights.get("Benefits", [])
    time_days_ago = job.get('detected_extensions').get("posted_at", "").split(" ")

    try:
        print(time_days_ago)
        timestamp = int(time_days_ago[0])
        job["job_posted_at_timestamp"] = str(datetime.now() - timedelta(days=timestamp))
    except (IndexError, ValueError):
        pass
    return job


def create_job(job):
    structured_jobs = stucture(job)
if __name__ == "__main__":
    jobs = get_google_jobs()
    print(jobs[1])
    for job in jobs:
        try:
            structured_job = structure_google_job(job)
            print("structured.......")
            serializer = JobSerializer(data=structured_job)
            if serializer.is_valid():
                print("valid.......")
                serializer.save()
            else:
                print("serializer error", serializer.errors)
        except Exception as e:
            print("error", e)
