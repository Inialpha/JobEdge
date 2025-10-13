import os
import re
import json
import asyncio
import aiohttp
from urllib.parse import urlparse
from serpapi import GoogleSearch
from job_services.company_details import details_from_career_page, details_from_linkedin
from bs4 import BeautifulSoup

class CareerPageJobs:
    def __init__(self, json_file="career_page.json"):
        self.json_file = json_file
        self.jobs = {}
        if os.path.exists(self.json_file):
            try:
                with open(self.json_file, "r", encoding="utf-8") as f:
                    self.jobs = json.load(f)
            except Exception as e:
                print(f"[Init Warning] Could not load {self.json_file}: {e}")
                self.jobs = {}

    @staticmethod
    def _clean_job_link(link: str) -> str | None:
        """
        Validate and clean careers-page.com job links.
        Must match: https://www.careers-page.com/{company}/job/{job_id}
        Removes anything extra after job_id.
        """
        pattern = r"^https:\/\/www\.careers-page\.com\/([^\/]+)\/job\/([A-Za-z0-9]+)"
        match = re.match(pattern, link)
        if match:
            company, job_id = match.groups()
            return f"https://www.careers-page.com/{company}/job/{job_id}"
        return None

    async def _fetch_html(self, session, url):
        """Fetch HTML asynchronously."""
        try:
            async with session.get(url, timeout=15) as resp:
                if resp.status == 200:
                    return await resp.text()
        except Exception as e:
            print(f"[Error fetching HTML] {url}: {e}")
        return ""

    async def _fetch_all_html(self, job_links):
        """Fetch all job HTML pages concurrently."""
        async with aiohttp.ClientSession(headers={"User-Agent": "Mozilla/5.0"}) as session:
            tasks = [self._fetch_html(session, link) for link in job_links]
            return await asyncio.gather(*tasks)

    def fetch_job(self, num=100):
        """Fetch jobs from SerpAPI and update self.jobs dictionary."""
        serpapi_key = os.getenv("SERPAPI_API_KEY")
        if not serpapi_key:
            raise ValueError("Missing SERPAPI_API_KEY in environment")

        print("\nSearching for jobs on carees-page\n")
        search = GoogleSearch({
            "q": "site:careers-page.com inurl:job",
            "api_key": serpapi_key,
            "num": num,
            "tbs": "qdr:d",
        })
        results = search.get_dict()

        raw_jobs = []
        for res in results.get("organic_results", []):
            raw_link = res.get("link")
            date = res.get("date") or ""

            link = self._clean_job_link(raw_link)
            if not link:
                continue

            raw_jobs.append({"job_link": link, "date": date})

        job_links = [job["job_link"] for job in raw_jobs]
        html_results = asyncio.run(self._fetch_all_html(job_links))

        for job, html in zip(raw_jobs, html_results):
            link = job["job_link"]
            date = job["date"]

            parsed = urlparse(link)
            parts = parsed.path.strip("/").split("/")
            company = parts[0] if len(parts) >= 2 else "unknown"
            platform = f"careers-page.com/{company}"

            if company not in self.jobs:
                self.jobs[company] = {**self.get_company_details(company), "platform": platform, "jobs": []}

            if any(j["job_link"] == link for j in self.jobs[company]["jobs"]):
                continue

            self.jobs[company]["jobs"].append({
                **self.get_job_details(html),
                "job_link": link,
                "date": date,
                "job_html": html
            })

        return self.jobs

    def save_jobs(self):
        """Save current jobs dictionary to JSON file."""
        try:
            with open(self.json_file, "w", encoding="utf-8") as f:
                json.dump(self.jobs, f, indent=2, ensure_ascii=False)
            print(f"[Saved] Jobs saved to {self.json_file}")
        except Exception as e:
            print(f"[Save Error] {e}")


    def get_company_details(self, company_name: str) -> dict:
        carees_page_details = details_from_career_page(company_name)
        linkedin_details = details_from_linkedin(company_name)
        details = {
            "company_logo":
                carees_page_details["company_logo"] or
                linkedin_details["company_logo"],
            "company_description": 
                carees_page_details["company_description"] or
                linkedin_details["company_description"],
            "company_website":
                carees_page_details["company_website"] or
                linkedin_details["company_website"]
        }
        return details

    def get_job_details(self, html):
        """
        Extracts job details (title, datePosted, salary, description) from a job posting HTML.
        Uses the JSON-LD structured data for reliable fields,
        and falls back to body/meta for description if not found.
        """
        soup = BeautifulSoup(html, "html.parser")

        json_ld_tag = soup.find("script", type="application/ld+json")
        job_data = {}
        if json_ld_tag:
            try:
                job_data = json.loads(json_ld_tag.string)
            except json.JSONDecodeError:
                raise json.JSONDecodeError
        address = job_data.get("jobLocation", {}).get("address", {})
        details = {
            "job_title": job_data.get("title"),
            "job_posted_at_timestamp": job_data.get("datePosted"),
            "job_salary": job_data.get("baseSalary") or job_data.get("salaryRange") or None,
            "location": {
                "country": address.get("addressCountry"),
                "state": address.get("addressLocality"),
                "city": address.get("addressLocality")
            },
            "valid_through": job_data.get("validThrough"),
            "employment_types": [job_data.get("employmentType")]
        }

        description = None
        if "description" in job_data and job_data["description"]:
            description = job_data["description"]
        else:
            meta_desc = soup.find("meta", property="og:description")
            if meta_desc and meta_desc.get("content"):
                description = meta_desc["content"]
            else:
                body_text = soup.body.get_text(separator="\n", strip=True) if soup.body else ""
                description = re.sub(r"\s+", " ", body_text).strip()

        description = BeautifulSoup(description, "html.parser").get_text(" ", strip=True)
        details["job_text"] = description

        return details
