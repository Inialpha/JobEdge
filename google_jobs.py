from serpapi import GoogleSearch
from dotenv import load_dotenv

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

"""print(f"Total jobs fetched: {len(all_jobs)}")
search = GoogleSearch(params)
results = search.get_dict()
jobs_results = results["jobs_results"]"""
