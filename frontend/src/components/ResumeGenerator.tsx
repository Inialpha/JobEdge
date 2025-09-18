import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { postRequest } from "@/utils/apis"
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { FileUp, CheckCircle, AlertCircle, File } from "lucide-react"


interface ResumeGeneratorProps {
  jobId: string;
  setResumeRequired: React.Dispatch<React.SetStateAction<boolean>>;
}


export default function ResumeGenerator({jobId, setResumeRequired }: ResumeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  console.log("setResumeRequired", setResumeRequired)
  const handleGenerateResume = async () => {
    if (user.hasMasterResume) {
    setIsGenerating(true)
    const url = `${import.meta.env.VITE_API_URL}/generate_resume/`;
    const userId = user.id;
    const data = {user_id: userId, job_id: jobId}
    try {
      const response = await postRequest(url, data)
      console.log(response)
      if (response.ok) {

        const resume = await response.json()
        console.log(resume)
        navigate('/resume', {state: {"resume": resume}})
      } else {
       const error = await response.json()
        console.log(error)
      }
    } catch (error) {
      console.log(error);
    }
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
    } else {
     
      if (setResumeRequired) {
  setResumeRequired(true);
} else {
  console.error("setResumeRequired is not available");
}
    }
  }

  return (
    <Button onClick={handleGenerateResume} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Resume'
      )}
    </Button>
    
  )
}



interface ResumeUploaderProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ResumePopover({ open, setOpen }: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if file is PDF or DOC/DOCX
      const fileType = selectedFile.type
      if (
        fileType !== "application/pdf" &&
        fileType !== "application/msword" &&
        fileType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setUploadError("Please upload a PDF or Word document")
        return
      }

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB")
        return
      }

      setFile(selectedFile)
      setUploadError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Complete the upload
      clearInterval(interval)
      setUploadProgress(100)
      setUploadSuccess(true)
      setUploading(false)

      // Close popover after success
      setTimeout(() => {
        setOpen(false)
      }, 1500)
    } catch (error) {
      clearInterval(interval)
      setUploadError("Upload failed. Please try again.")
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploadProgress(0)
    setUploadSuccess(false)
    setUploadError(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={open ? "default" : "outline"} className="gap-2">
          {file ? (
            <>
              <File className="h-4 w-4" />
              {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              Upload Resume
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium leading-none">{open ? "Resume Required" : "Upload Resume"}</h3>
            <p className="text-sm text-muted-foreground">Please upload your resume in PDF or Word format (max 5MB)</p>
          </div>

          {uploadSuccess ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Resume uploaded successfully!</span>
            </div>
          ) : uploadError ? (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{uploadError}</span>
            </div>
          ) : null}

          {!uploadSuccess && (
            <>
              <div className="grid gap-2">
                <label
                  htmlFor="resume-upload"
                  className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 px-4 py-5 text-center hover:bg-muted/50"
                >
                  <FileUp className="h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {file ? file.name : "Drag & drop or click to browse"}
                  </p>
                  <input
                    id="resume-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                </div>
              )}

              <div className="flex justify-between">
                {file && !uploading ? (
                  <Button variant="outline" size="sm" onClick={resetUpload}>
                    Reset
                  </Button>
                ) : (
                  <div></div>
                )}
                <Button size="sm" onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? "Uploading..." : "Upload Resume"}
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

