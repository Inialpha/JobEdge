import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UploadCloud, FileText, Plus, Download, Trash2 } from "lucide-react"


// Mock data for resumes
const mockResumes = [
  { id: 1, name: "Software Engineer Resume", lastModified: "2023-05-15", status: "Complete" },
  { id: 2, name: "Product Manager Resume", lastModified: "2023-05-10", status: "In Progress" },
  { id: 3, name: "Data Analyst Resume", lastModified: "2023-05-05", status: "Complete" },
]

export function ResumeDashboard() {
  const [resumes, setResumes] = useState(mockResumes)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real application, you would handle the file upload here
      console.log("Uploading file:", file.name)
      // For now, we'll just add it to the list
      setResumes([
        ...resumes,
        {
          id: resumes.length + 1,
          name: file.name,
          lastModified: new Date().toISOString().split("T")[0],
          status: "Uploaded",
        },
      ])
    }
  }

  const handleDeleteResume = (id: number) => {
    setResumes(resumes.filter((resume) => resume.id !== id))
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Resume Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Resume
          </Button>
        </div>
      </div>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Dashboard</CardTitle>
          <CardDescription>Manage your resumes and upload new ones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Complete Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {resumes.filter((resume) => resume.status === "Complete").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {resumes.filter((resume) => resume.status === "In Progress").length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

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
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
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

