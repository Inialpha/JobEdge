from serpapi import GoogleSearch
from dotenv import load_dotenv
import json
import os

load_dotenv()

def get_google_jobs():
    all_jobs = []
    for start in range(1):
        params = {
        "engine": "google_jobs",
        "q": "software engineer OR data analyst",
        "hl": "en",
        "location": "",
        "remote": "true",
        "num": "100",
        "next_page_token": "",
        "api_key": os.getenv("SERPAPI_KEY")
        }

        search = GoogleSearch(params)
        results = search.get_dict()
        params["next_page_token"] = results.get("serpapi_pagination", {}).get("next_page_token")
        all_jobs.extend(results.get("jobs_results", []))
    return all_jobs


jobs = get_google_jobs()
with open("job.json", "w") as f:
    json.dump(jobs, f, indent=" ")
