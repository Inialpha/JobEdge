import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { postRequest } from "@/utils/apis";
import ResumeEditor from "@/components/ResumeEditor"
import { useNavigate } from "react-router-dom";

interface ContactInfo {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedin?: string;
  website?: string;
}

interface Experience {
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  location?: string;
  responsibilities?: string[];
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  graduationDate?: string;
  gpa?: string;
}

interface Project {
  name: string;
  description: string;
  technologies?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

interface ResumeSection<T> {
  title?: string;
  content: T;
}

interface GeneratedResume {
  message?: string;
  template?: string;
  resume?: {
    contact?: ResumeSection<ContactInfo>;
    summary?: ResumeSection<string>;
    experience?: ResumeSection<Experience[] | string>;
    education?: ResumeSection<Education[] | string>;
    skills?: ResumeSection<string | string[]>;
    projects?: ResumeSection<Project[] | string>;
  };
}

export default function TailorResumePage() {
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleGenerateResume = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedResume(null);

    try {
      const url = `${import.meta.env.VITE_API_URL}/resume/generate/`;
      const data = {
        job_description: jobDescription,
        template: selectedTemplate
      };

      const response = await postRequest(url, data, true);

      if (response.ok) {
        const result = await response.json();
        setGeneratedResume(result);
        navigate("/resume-builder", {
          state: {resume: result}
        }),
        setError('');
      } else {
        const errorData = await response.json();
        console.log("errorData", errorData)
        setError(errorData.details || 'Failed to generate resume. Please try again.');
      }
    } catch (err) {
      console.error('Error generating resume:', err);
      setError('An error occurred while generating the resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobDescription('');
    setSelectedTemplate('modern');
    setGeneratedResume(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Tailor Your Resume
          </h1>
          <p className="text-gray-600">
            Generate a tailored resume based on your job description using your master resume
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Description & Template</CardTitle>
            <CardDescription>
              Paste the job description and select a template to generate a tailored resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here... e.g., 'We're looking for a backend developer skilled in Django and REST APIs...'"
                rows={12}
                className="w-full resize-y"
              />
              <div className="text-sm text-gray-500">
                {jobDescription.length} characters
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <Label htmlFor="template">Resume Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {generatedResume && !error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span>Resume generated successfully!</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              onClick={handleGenerateResume}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Resume'
              )}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={loading}
            >
              Clear
            </Button>
          </CardFooter>
        </Card>

        {/* Display Generated Resume */}
        {generatedResume && (
          <ResumeEditor generatedResume={generatedResume} />
        )}
      </div>
    </div>
  );
}
