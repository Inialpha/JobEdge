import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { postRequest } from "@/utils/apis";
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
          state: {resume: result, template: selectedTemplate}
        });
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
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .tailor-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .tailor-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .tailor-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .tailor-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .tailor-header p {
          font-size: 14px;
          opacity: 0.95;
        }
        .tailor-content {
          padding: 30px;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.3s;
        }
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
        }
        .form-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          background-color: white;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        .form-select:focus {
          outline: none;
          border-color: #667eea;
        }
        .char-count {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .message {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
        }
        .message-error {
          background-color: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }
        .message-success {
          background-color: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      
      <div className="tailor-container">
        <div className="tailor-card">
          <div className="tailor-header">
            <h1>Tailor Your Resume</h1>
            <p>Generate a tailored resume based on your job description using your master resume</p>
          </div>
          
          <div className="tailor-content">
            {/* Error Message */}
            {error && (
              <div className="message message-error">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {generatedResume && !error && (
              <div className="message message-success">
                <CheckCircle className="w-5 h-5" />
                <span>Resume generated successfully! Redirecting...</span>
              </div>
            )}

            {/* Job Description */}
            <div className="form-group">
              <label htmlFor="jobDescription" className="form-label">Job Description</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here... e.g., 'We're looking for a backend developer skilled in Django and REST APIs...'"
                rows={12}
                className="form-textarea"
              />
              <div className="char-count">
                {jobDescription.length} characters
              </div>
            </div>

            {/* Template Selector */}
            <div className="form-group">
              <label htmlFor="template" className="form-label">Resume Template</label>
              <select 
                id="template" 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="form-select"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimalist</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="button-group">
              <button
                onClick={handleGenerateResume}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Resume'
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="btn btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
