from job_services.career_page_job import CareerPageJobs
from dotenv import load_dotenv
from api.models.job import Job
from api.models.company import Company
from api.serializers.company import CompanySerializer
from ai_services.extract_job import extract_job_details

load_dotenv()

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
            ai_extracted_details = extract_job_details(job.get("job_text") or job.get("job_html"))
            detailed_job = {**job, **ai_extracted_details}
            print(ai_extracted_details)


get_caree_page_jobs()
