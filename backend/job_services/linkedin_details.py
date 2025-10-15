import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs, unquote
from serpapi import GoogleSearch

def get_from_linkedin(company_name: str) -> dict:
    company_details = {
        "company_logo": "",
        "company_website": "",
        "company_description": ""
    }

    try:
        serpapi_key = os.getenv("SERPAPI_API_KEY")  # fixed env var name
        if not serpapi_key:
            raise ValueError("Missing SERPAPI_API_KEY")

        # 1. Use SerpAPI to find LinkedIn company profile
        search = GoogleSearch({
            "q": f"{company_name} site:linkedin.com/company",
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
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(linkedin_url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, "html.parser")

            # 2. Extract logo
            for img in soup.find_all("img"):
                logo_url = img.get("data-delayed-url") or img.get("src")
                if logo_url and "company-logo" in logo_url:
                    company_details["company_logo"] = logo_url
                    print("Company logo:", logo_url)
                    break

            # 3. Extract description
            des = soup.select_one('p[data-test-id="about-us__description"]')
            if des:
                company_details["company_description"] = des.text.strip()
                print("Company description:", company_details["company_description"])

            # 4. Extract and resolve company website
            website_link = soup.select_one('a[data-tracking-control-name="about_website"]')
            if website_link:
                redirect_url = website_link.get("href", "")
                parsed = urlparse(redirect_url)
                query = parse_qs(parsed.query)
                real_url = unquote(query.get("url", [""])[0])
                company_details["company_website"] = real_url
                print("Resolved company website:", real_url)

    except Exception as e:
        print(f"[LinkedIn Fallback Error] {company_name}: {e}")

    return company_details
