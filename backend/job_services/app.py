from job_services.career_page_job import CareerPageJobs
from dotenv import load_dotenv
from api.models.job import Job
from api.models.company import Company
from api.serializers.company import CompanySerializer
from api.serializers.job import JobSerializer
from ai_services.extract_job import extract_job_details

load_dotenv()

import copy

def merge_non_empty(base: dict, new: dict) -> dict:
    merged = copy.deepcopy(base)
    for key, value in new.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = merge_non_empty(merged[key], value)
        elif value not in [None, "", [], {}]:
            merged[key] = value
    return merged

def get_caree_page_jobs():
    cp = CareerPageJobs()
    jobs = cp.fetch_job()
    cp.save_jobs()

    for company_name, company in jobs.items():
        try:
            existing_company = Company.objects.get(platform=company["platform"])
            print(f"\033[92mCompany -> {company_name} already exist\033[0m")
        except Company.DoesNotExist as e:
                company_details = cp.get_company_details(company_name)
                company_details["company_name"] = company_name
                company_details["platform"] = company["platform"]
                try:
                    serializer = CompanySerializer(data=company_details)
                    if serializer.is_valid():
                       serializer.save()
                       print(f"\033[92mSaved Company -> {company_name}\033[0m")
                    else:
                       print(f"\033[91mError Saving Company - {company_name}\033[0m")
                       continue
                except Exception as e:
                    continue
        for job in company["jobs"]:
            try:
                existing_job = Job.objects.get(job_apply_link=job["job_apply_link"])
                print(f"\033[92mJob -> {job['job_title']} already exist\033[0m")
            except Job.DoesNotExist as e:       
                ai_extracted_details = extract_job_details(job.get("job_text") or job.get("job_html"))
                detailed_job = merge_non_empty(job, ai_extracted_details)
                del detailed_job["job_html"]
                try:
                    serializer = JobSerializer(data=detailed_job)
                    if serializer.is_valid():
                        serializer.save()
                        print(f"\033[92mSaved Job -> {detailed_job['job_apply_link']}\033[0m")
                    else:
                        print(serializer.errors)
                        print(f"\033[91mFaild to add Job -> {detailed_job['job_apply_link']}\033[0m")
                except Job.DoesNotExist as e:
                    raise e
                import json
                #print(json.dumps(detailed_job, indent=2))


get_caree_page_jobs()
