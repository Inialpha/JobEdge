//import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import JobCard from './JobCard'
import { Job } from "@/utils/types"
//import { getRequest } from "@/utils/apis";


interface JobListProps {
  jobs: Job[];
}
export default function JobList({ jobs }: JobListProps) {
  /*const [jobs, setJobs] = useState<Job | null>(null)
  useEffect(() => {
    const fetchJobs = async () => {
      const url = `${import.meta.env.VITE_API_URL}/jobs/`;
      try {
        const response = await getRequest(url, false);
        const data = await response.json()
        console.log(data)
        if (response.ok) {
          setJobs(data);
        } else {
          alert("get job error")
        }
      } catch (error) {
        console.log(error)
      }
    }
    fetchJobs();
  }, [])*/

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {jobs && jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </motion.div>
  )
}

