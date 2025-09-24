from career_page_job import CareerPageJobs
from dotenv import load_dotenv

load_dotenv()

cp = CareerPageJobs()
jobs = cp.fetch_job()
cp.save_jobs()
