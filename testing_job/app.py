import json
from testing_job import request_jobs 
from testing_job import chain
from testing_job import get_company_details
from testing_job import create_company
from testing_job import create_job
from api.models.company import Company
from api.models.job import Job


jobs = request_jobs.get_careers_page_jobs()

# with open('jobs.json', 'r') as f:
#    jobs = json.load(f)

with open("jobs.json", "w") as f:
    json.dump(jobs, f, indent=2)

for company_name, company in jobs.items():
    db_company = None
    try:
        db_company = Company.objects.get(platform=company.get("platform"))
        print(f"Company -> {company_name} already exist")
    except Company.DoesNotExist:
        print(f"Creating company -> {company_name}")
        company_details = get_company_details.get_company_details(company.get("platform"), company_name)
        company_details["platform"] = company.get("platform")
        company_details["company_name"] = company_name
        db_company = create_company.create_company(company_details)
        print(f"\033[92mCompany -> {company_name}successfully created\033[0m")


    job_list = company.get("jobs")
    for job_item in job_list:
        try:
            db_job = Job.objects.get(job_apply_link=job_item.get("job_link"))
            if db_job:
                print(f"\033[93mJob -> {job_item.get('job_link')} Already exist\033[0m")
                continue
        except Job.DoesNotExist:
            pass

        structured_job = chain.extract_job_structure(job_item.get("job_html"))
        if structured_job:
            structured_job["job_apply_link"] = job_item.get("job_link", "") 
            structured_job["job_html"] = job_item.get("job_html")
            structured_job["job_posted_at_timestamp"] = job_item.get("date")
            structured_job["company"] = db_company.id
            try:
                job = create_job.create_job(structured_job)
                print(f"\033[92mSuccessfully added {job}\033[0m")
            except ValueError as e:
                print(f"\033[91mFailed to create job -> {structured_job.job_title}\033[0m")
                print(e)
        else:
            print("Failed to parse structured output.")
