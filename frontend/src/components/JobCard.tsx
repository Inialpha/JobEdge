import { motion } from 'framer-motion'
//import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
//import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom';


export default function JobCard({ job }: any) {
  const navigate = useNavigate();
  const displayJob = (job: any) => {
    console.log("display")
    navigate('/jobs/detail', {state: {"job": job}}
    );
  }
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="h-full w-full flex flex-col">
        <CardContent className="pt-6 flex-grow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 relative mr-4">
              <img
                src={job.employer_logo || "/placeholder.svg"}
                alt={`${job.employer_name} logo`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{job.job_title}</h2>
              <p className="text-gray-600">{job.employer_name}</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4 line-clamp-2">{job.job_description}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">{job.job_location}</Badge>
            <Badge variant="secondary">{job.job_employment_type}</Badge>
          </div>
          <p className="text-gray-600 mb-2">{job.job_salary}</p>
          {/**job.job_posted_at_timestamp && (<p className="text-sm text-gray-500">
            Posted {formatDistanceToNow(new Date((Number(job.job_posted_at_timestamp) * 1000)), { addSuffix: true })}
          </p>
          )**/}
        </CardContent>
        <CardFooter>
          
            <Button className=""
            onClick={(() => displayJob(job))}
            >View Job</Button>
         
        </CardFooter>
      </Card>
    </motion.div>
  )
}

