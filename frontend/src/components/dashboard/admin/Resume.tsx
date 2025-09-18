import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UploadCloud, FileText, Plus, Download, Trash2 } from "lucide-react"
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getRequest, postFormData, deleteRequest } from '@/utils/apis'
import { useNavigate } from 'react-router-dom';
import { generatePDF } from "@/components/pdfGenerator"
import { getEditableResume } from "@/pages/ResumeForm"
import Feedback, { FeedbackState }from '@/components/Alert';

// Mock data for resumes
const mockResumes = [
  { id: 1, name: "Software Engineer Resume", lastModified: "2023-05-15", status: "Complete" },
  { id: 2, name: "Product Manager Resume", lastModified: "2023-05-10", status: "In Progress" },
  { id: 3, name: "Data Analyst Resume", lastModified: "2023-05-05", status: "Complete" },
]

export default function ResumeComponent() {
  const [resumes, setResumes] = useState(mockResumes);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchResume = async () => {
      const url = `${import.meta.env.VITE_API_URL}/resumes/`
      try {
        const response = await getRequest(url);
        if (response.ok) {
          const resumes = await response.json();
          setResumes(resumes)
        } else {
          console.log("can't fetch resume")
        }
      } catch (error) {
        console.log(error)
      }
    }
    fetchResume()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log(file)
      try {
        const url = `${import.meta.env.VITE_API_URL}/resumes/`
        const formData = new FormData()
        formData.append("file", file)
        formData.append("user_id", user.id)
        const response = await postFormData(url, formData)
        if (response.ok) {
          const resume = await response.json()
          setFeedback({message: "Your Master Resume was successfully uploaded"})
          setResumes([
            ...resumes, resume
          ])
          console.log(resume)
        } else {
          setFeedback({message: "There was an error please try again", variant: 'error'
          })
          console.log("error.....");
        }
      } catch (error) {
        console.log(error);
        setFeedback({message: "There was an error please try again", variant: 'error'
        })
      } finally {
        setTimeout(() => {
          console.log(feedback)
          setFeedback(null)
        }, 5000);
      }

    }
  }

  const handleDeleteResume = async (id: number) => {
    const url = `${import.meta.env.VITE_API_URL}/resumes/${id}/`
    try {
      const response = await deleteRequest(url);
      console.log(response)
      if (response.ok) {
        setFeedback({message: "Resume is succesfully deleted"
        });
        setResumes(resumes.filter((resume) => resume.id !== id))
      } else {
        setFeedback({message: "There was an error please try again", variant: 'error'     })
        console.log("can't fetch resume")
;
      }
    } catch (error) {
      setFeedback({message: "There was an error please try again", variant: 'error'
      })
      console.log(error)
    } finally {
      setTimeout(() => {
       
        setFeedback(null)
      }, 5000)
    }

  }

  const handleEditResume = (resume: any) => {
    navigate("/resume", {state: {"resume": resume}})
  }

  const handleDownload = (resume: any) => {
    const editableResume = getEditableResume(resume)
    const doc = generatePDF(editableResume);
    doc.save(resume.name);
  }

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6">
      {feedback && <Feedback                        message={feedback.message}                  {...(feedback.variant && { variant: feedback.variant })}                              />}
      <h2 className="text-3xl font-bold tracking-tight">Resume</h2>
      <div className="flex items-center justify-end space-y-2 space-x-4 ">
        <div className="flex items-center space-x-2">
          <Button >
            <Plus className="mr-2 h-4 w-4" /> Create New Resume
          </Button>
        </div>
      </div>
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Upload Master Resume</CardTitle>
          <CardDescription>Upload a new master resume file</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="resume-upload" className="cursor-pointer">
            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="resume-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOCX or TXT (MAX. 10MB)</p>
                </div>
                <Input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                />
              </Label>
            </div>
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
          <CardDescription>Manage and edit your existing resumes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumes.map((resume) => (
                <TableRow key={resume.id}>
                  <TableCell className="font-medium">{resume.name}</TableCell>
                  <TableCell>{resume.lastModified}</TableCell>
                  <TableCell>{resume.status}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleEditResume(resume)} size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(resume)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteResume(resume.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}

