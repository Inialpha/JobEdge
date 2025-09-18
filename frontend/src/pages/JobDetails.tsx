import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ResumeGenerator from '@/components/ResumeGenerator';
import { ResumePopover } from '@/components/ResumeGenerator';
//import { formatDistanceToNow } from 'date-fns'
import { useLocation } from 'react-router-dom';
import { Job } from "@/utils/types";


export default function JobDetails() {

  const location = useLocation();
  const [resumeRequired, setResumeRequired] = useState(false)
 
  const job: Job = location.state?.job;
  console.log(location.state)
  console.log("job", job)

  /*const apply = (_url: string) => {
    
    //TODO Allow application if user is logged in else redirect to login page
  }*/

  return (
    <div className="container mx-auto px-4 py-8">
      {job && <div>
      <div className="flex gap-4 mb-6 w-full">
        <Link to="/jobs">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
        <div className="flex space-x-4 ">
        <ResumeGenerator jobId={job.id} setResumeRequired={setResumeRequired} />
        <Link to={job.job_apply_link}>
          <Button
            >Apply Now</Button>
        </Link>
        </div>
      </div>
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 relative mr-4">
          <img
            src={job.employer_logo || "/placeholder.svg"}
            alt={`${job.employer_name} logo`}
          />
        </div>
        <div>
          <h1 className="text-4xl font-bold">{job.job_title}</h1>
          <h2 className="text-2xl text-gray-600">{job.employer_name}</h2>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary">{job.job_location}</Badge>
        <Badge variant="secondary">{job.job_employment_type}</Badge>
        <Badge variant="secondary">{job.job_salary}</Badge>
      </div>
      {/*<p className="text-gray-600 mb-6">
        Posted {formatDistanceToNow(new Date(job.job_posted_at_timestamp), { addSuffix: true })}
      </p>*/}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-2">Job Description</h3>
        <p>{job.job_description}</p>
      </div>
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-2">Requirements</h3>
        <ul className="list-disc pl-5">
          {job.job_qualifications.map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ul>
      </div>
      <div className="flex gap-4">
        <Link to={job.job_apply_link}>
          <Button
            >Apply Now</Button>
        </Link>
        <ResumeGenerator jobId={job.id} setResumeRequired={setResumeRequired} />
        
        <Link to="/jobs">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
      </div>}
      <ResumePopover open={resumeRequired} setOpen={setResumeRequired}/>
    </div>
  )
}

