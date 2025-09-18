import requests
from datetime import datetime


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

    print(job.get("job_title"))
    job['job_id_from_source'] = job.get('job_id')
    job['job_employment_type'] = job.get('job_employment_type').lower()
    job['job_employment_types'] = [job_type.lower() for job_type in
        job.get('job_employment_types', [])]

    job["job_qualifications"] = job.get("job_highlights", {}).get("Qualifications")
    job["job_responsibilities"] = job.get("job_highlights", {}).get("Responsibilities")
    timestamp = str(job.get("job_posted_at_timestamp")) or get_timestamp(job.get("job_posted_at_datetime_utc"))
    job["job_posted_at_timestamp"] = timestamp
from api.serializers.job import JobSerializer
num_pages = 20

for page in range(5):
    jobs = fetch_jobs(page * num_pages + 1, num_pages)

    for job in jobs:
        try:
            structured_job = structure(job)

            serializer = JobSerializer(data=job)
            if serializer.is_valid():
                serializer.save()
            else:
                print("serializer error", serializer.errors)

        except Exception as e:
            print("error", e)
