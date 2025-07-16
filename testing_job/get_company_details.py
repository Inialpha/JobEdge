import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from serpapi import GoogleSearch
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs, unquote

load_dotenv()



def get_from_careers_page(career_page_url: str, company_name: str) -> str:

    if not career_page_url.startswith("https://"):
        career_page_url = "https://" + career_page_url

    company_details = {}
    headers = {"User-Agent": "Mozilla/5.0"}

    # Step 1: Try scraping careers page HTML with requests
    try:
        response = requests.get(career_page_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        logo_tag = soup.select_one("a.navbar-brand img")
        if logo_tag and logo_tag.get("src"):
            logo_url = logo_tag["src"]
            if not logo_url.startswith("http"):
                logo_url = urljoin(career_page_url, logo_url)
            company_details["company_logo"] = logo_url or ""

        website = None
        for a_tag in soup.select("a.nav-link"):
            button = a_tag.find("button")
            if button and button.text.strip().lower() == "company website":
                website = a_tag
                break
        if website:
            company_details["company_website"] = website.get("href") or ""

    except Exception as e:
        print(f"[Careers Page Error] {career_page_url}: {e}")
    return company_details

def get_from_linkedin(company_name):
    headers = {"User-Agent": "Mozilla/5.0"}

    company_details = {
        "company_logo": "",
        "company_website": "",
        "company_description": ""
    }
    try:
        serpapi_key = os.getenv("SERPAPI_KEY")
        if not serpapi_key:
            raise ValueError("Missing SERPAPI_API_KEY")

        search = GoogleSearch({
            "q": f"{company_name} site:linkedin.com",
            "api_key": serpapi_key
        })
        results = search.get_dict()

        linkedin_url = None
        for result in results.get("organic_results", []):
            link = result.get("link", "")
            if "linkedin.com/company" in link:
                linkedin_url = link
                break

        if linkedin_url:
            response = requests.get(linkedin_url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, "html.parser")
            img_tags = soup.find_all("img")
            for img in img_tags:
                logo_url = img.get("data-delayed-url") or img.get("src")
                if logo_url and "company-logo" in logo_url:
                    company_details["company_logo"] = logo_url
                    break
            des = p_tag = soup.select_one('p[data-test-id="about-us__description"]')
            if des:
                company_details["company_description"] = des.text.strip()
            website = soup.select_one('a[data-tracking-control-name="about_website"]')
            if website:
                redirect_url = website.get("href")
                parsed = urlparse(redirect_url)
                query = parse_qs(parsed.query)
                real_url = unquote(query.get("url", [""])[0])
                company_details["company_website"] = real_url
    except Exception as e:
        print(f"[LinkedIn Fallback Error] {company_name}: {e}")

    return company_details


def get_company_details(platform_url, company_name):
    carees_page_details = get_from_careers_page(platform_url, company_name)
    linkedin_details = get_from_linkedin(company_name)
    print(carees_page_details)
    print(linkedin_details)
    comapany_details = {
        "company_logo": carees_page_details.get("company_logo") or
            linkedin_details.get("company_logo"),
        "company_website": carees_page_details.get("company_logo") or
            linkedin_details.get("company_website"),
        "company_description": carees_page_details.get("company_logo") or
            linkedin_details.get("company_description")
    }

    return comapany_details
