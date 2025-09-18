import { Suspense } from 'react'
import JobList from '@/components/JobList'
import SearchBar from '@/components/SearchBar'
import LocationFilter from '@/components/LocationFilter'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { Job } from "@/utils/types"
import { getRequest } from "@/utils/apis";
import { useInView } from "react-intersection-observer"
import { Loader2 } from "lucide-react"


export default function JobsPage() {

  const [jobs, setJobs] = useState<Job[] | []>([]);
  //const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [ref, inView] = useInView()
  const [nextUrl, setNextUrl] = useState<string>()
  
  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL}/jobs/?page_num=1`;
    fetchJobs(url);
  }, [])
  
  
  const fetchJobs = async (url: string) => {
    setLoading(true)
      try {
        const response = await getRequest(url, false);
        console.log(response)
        const data = await response.json()
        console.log(data)
        if (response.ok) {
          if (data.next) {
            setNextUrl(data.next)
          }
          console.log(nextUrl)
          if (data.previous) {
            setJobs((prevJobs) => [...prevJobs, ...data.results]);
          } else {
            setJobs(data.results)
          }
        } else {
          alert("get job error")
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
  }
  
  useEffect(() => {
    if (inView) {
      if (nextUrl) {
        fetchJobs(nextUrl);
      }
    }
  }, [inView])

  const handleJobSearch = async () => {
    const keywords = sessionStorage.getItem('searchKeywords');
    const searchLocation = sessionStorage.getItem('searchLocation');

    console.log(searchLocation);
    console.log(keywords);
    let url = `${import.meta.env.VITE_API_URL}/jobs/search/?page_num=1`
    if (keywords) {
      url += `&keywords=${keywords}`
    }
    if (searchLocation) {
      url += `&location=${searchLocation}`
    }
    fetchJobs(url)

    /*try {
      const response = await getRequest(url, false)
      const res = await response.json()
      console.log(response)
      console.log(res)
      if (response.ok) {
        setJobs(res.results)
      } else {
        console.log(res)
      }
    } catch (error) {
      console.log(error)
    }*/

  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Job Listings</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex md:flex-row gap-4">
        <SearchBar />
        <Button onClick={handleJobSearch}>Search</Button>
       </div>
        <LocationFilter />
      </div>
      <Suspense fallback={<div>Loading jobs...</div>}>
        <div className="grid gap-6">
          {jobs && (<JobList jobs={jobs}/> )}
          <div ref={ref} className="flex justify-center mt-8">
            {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          </div>
        </div>
      </Suspense>
    </div>
  )
}

