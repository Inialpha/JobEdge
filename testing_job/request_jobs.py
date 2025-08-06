import requests
from bs4 import BeautifulSoup
from testing_job import job_construction_ai
from serpapi import GoogleSearch
import re
import os
from api.models.job import Job


api_key = os.getenv("SERPAPI_KEY")



def get_html_and_text(url):
    """
    Fetches a webpage and returns both raw HTML and visible text.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        html = response.text
        soup = BeautifulSoup(html, "html.parser")

        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        text = soup.get_text(separator="\n", strip=True)

        return {
            "html": html,
            "text": text
        }

    except requests.RequestException as e:
        print(f"Request error: {e}")
        return None

def get_careers_page_jobs():
    max_pages: int = 20

    params = {
        "q": "site:careers-page.com inurl:job/",
        "engine": "google",
        "api_key": api_key,
        "tbs": "qdr:d1",  # posted in last 24 hours
        "num": 10,
    }

    searched_jobs = {}
    page_count = 0
    job_count = 0

    while True:
        search = GoogleSearch(params)
        results = search.get_dict()
        organic_results = results.get("organic_results", [])
        if not organic_results:
            print("No more results found.")
            break

        for result in organic_results:
            link = result.get("link", "")
            match_link = re.match(
                r"(https?://(?:www\.)?careers-page\.com/([^/]+)/job/[A-Z0-9]+)",
                link
            )
            if match_link:
                company_name = match_link.group(2)
                job_link = match_link.group(1)
                try:
                    db_job = Job.objects.get(job_apply_link=job_link)
                    if db_job:
                        continue
                except Job.DoesNotExist:
                    pass
                job_details = get_html_and_text(job_link)
                if not job_details:
                    continue
                platform = f"careers-page.com/{company_name}"

                if not searched_jobs.get(company_name):
                    searched_jobs[company_name] = {
                        "platform": platform,
                        "jobs": []
                }
                searched_jobs[company_name]["jobs"].append({
                    "job_link": job_link,
                    "date": result.get("date", ""),
                    "job_html": job_details.get("html"),
                    "job_text": job_details.get("text"),
                })
                job_count += 1
                print(f"Jobs: {job_count}")

        page_count += 1
        if page_count >= max_pages:
            break

        if "serpapi_pagination" in results and "next" in results["serpapi_pagination"]:
            next_link = results["serpapi_pagination"]["next"]
            params["start"] = results["serpapi_pagination"].get("next_page_token", page_count * 10)
        else:
            break

    return searched_jobs


import asyncio
from playwright.async_api import async_playwright

async def load_job(job_link):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        original_html = None
        original_text = None
            
        def handle_response(response):
            nonlocal original_html
            nonlocal original_text
            if response.url == job_link and response.status == 200:
                try:
                    original_html = response.text()
                    original_text = page.inner_text("body")
                    print(f"Captured original page content: {len(original_content)} characters")
                except:
                    pass
            
        page.on("response", handle_response)
        await page.goto(job_link, wait_until="domcontentloaded")
        await page.screenshot(path="screenshot.png")
        html = original_html or await page.content()
        text = original_text or await page.inner_text("body")
        job_info = {
            "html": html,
            "text": text,
        }
        try:
            logo = await page.get_attribute('.navbar-brand img', 'src')
            job_info["employer_logo"] = logo
        except Exception:
            job_info["employer_logo"] = ""
        await browser.close()
        print(job_info["employer_logo"])
        return job_info

def parse_with_requests(url): 
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, allow_redirects=False)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            logo = ""
            img_tag = soup.select_one('.navbar-brand img')
            if img_tag and img_tag.get('src'):
                logo = img_tag['src']
            job_info = {
                "html": html,
                "text": text,
                "employer_logo": logo,
            }
            print(job_info)
            return job_info
        
    except Exception as e:
        return None

def create_job(job):
    
    print("job")


if __name__ == "__main__":
    searched_jobs = get_careers_page_jobs()
    for j_name, job in jobs.items():
        job_list = job.get("jobs")
        for job_item in job_list:
            structured_job = job_construction_ai.construct_job(job_item.get("job_html"))
            print(structured_job)
            if structured_job:
                print(json.dumps(structured_job, indent=2))
            else:
                print("Failed to parse structured output.")
            break
        break

    """job_details = []
    for searched_job in searched_jobs:
        job_details.append({**job_info, **searched_job})

    for job in job_details:
        new_job = job_construction_ai.construct_job(job.get("text", ""))
        print("-" * 11)
        print(new_job)
        create_job({**new_job, **job})"""
