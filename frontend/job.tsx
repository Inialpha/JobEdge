"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import JobCard from "./JobCard"
import { Loader2 } from "lucide-react"

// Mock data generator for jobs
const generateMockJobs = (start: number, end: number) => {
  return Array.from({ length: end - start }, (_, index) => ({
    id: start + index + 1,
    title: `Job Title ${start + index + 1}`,
    company: `Company ${start + index + 1}`,
    logo: `/logos/company${((start + index + 1) % 5) + 1}.svg`,
    description: `This is a brief description for Job ${start + index + 1}. It's an exciting opportunity!`,
    location: ["New York, NY", "San Francisco, CA", "London, UK", "Remote"][Math.floor(Math.random() * 4)],
    type: ["Full-time", "Part-time", "Contract"][Math.floor(Math.random() * 3)],
    salary: `$${70 + Math.floor(Math.random() * 60)},000 - $${100 + Math.floor(Math.random() * 60)},000`,
    posted: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

export default function JobList() {
  const [jobs, setJobs] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [ref, inView] = useInView()

  const loadMoreJobs = async () => {
    if (loading) return
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newJobs = generateMockJobs((page - 1) * 10, page * 10)
    setJobs((prevJobs) => [...prevJobs, ...newJobs])
    setPage((prevPage) => prevPage + 1)
    setLoading(false)
  }

  useEffect(() => {
    loadMoreJobs()
  }, [])

  useEffect(() => {
    if (inView) {
      loadMoreJobs()
    }
  }, [inView])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </motion.div>
      <div ref={ref} className="flex justify-center mt-8">
        {loading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      </div>
    </>
  )
}


