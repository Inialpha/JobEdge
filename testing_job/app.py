import json
from testing_job import request_jobs 
from testing_job import chain
from testing_job import get_company_details
from testing_job import create_company
from testing_job import create_job


jobs = request_jobs.get_careers_page_jobs()
for company_name, company in jobs.items():
    company_details = get_company_details.get_company_details(company.get("platform"), company_name)
    company_details["platform"] = company.get("platform")
    company_details["company_name"] = company_name
    new_company = create_company.create_company(company_details)
    print("new com:", new_company)
    
    job_list = company.get("jobs")
    for job_item in job_list:
        structured_job = chain.extract_job_structure(job_item.get("job_html"))
        print("Ai job------", structured_job)
        if structured_job:
            structured_job["job_apply_link"] = job_item.get("job_link", "") 
            structured_job["job_html"] = job_item.get("job_html")
            structured_job["job_text"] = job_item.get("date")
            structured_job["job_posted_at_timestamp"] = job_item.get("date")
            structured_job["company"] = company
            job = create_job.create_job(structured_job)
            print("new job------", job)
            with open("created_jobs.json", "w") as f:
                json.dump(job, f, indent=" ")
        else:
            print("Failed to parse structured output.")
        break
    break

#with open("job.json", "w") as f:
#    json.dump(jobs, f, indent=" ")
