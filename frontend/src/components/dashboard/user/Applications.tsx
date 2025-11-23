import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, FileText, ExternalLink, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { getRequest, putRequest, postRequest } from "@/utils/apis";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useView } from "@/context/ViewContext";
import { useQuery } from '@tanstack/react-query';
import { coverLetterPdf } from "@/utils/coverLetterPdf";
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { applicationsTourSteps, tourStyles, tourLocale } from "@/utils/tourConfig";
import { usePageTour } from "@/hooks/usePageTour";

interface Application {
  id: string;
  job_description: string;
  job_link?: string;
  cover_letter: string;
  created_at: string;
  resume: {
    id: string;
    personal_information: {
      name?: string;
      profession?: string;
    };
  };
}

export default function Applications() {
  const { setCurrentView } = useView();
  const { run, stepIndex, setStepIndex, startTour, stopTour, tourCompleted } = usePageTour('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [showNewApplication, setShowNewApplication] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [componentLoaded, setComponentLoaded] = useState(false);
  
  // New application form state
  const [jobDescription, setJobDescription] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  // Set current view when component mounts
  useEffect(() => {
    setCurrentView("applications");
  }, [setCurrentView]);

  const fetchApplications = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/applications/`;
      const response = await getRequest(url);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Failed to fetch applications');
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  };

  const { data: applicationsData, isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  useEffect(() => {
    if (applicationsData) {
      setApplications(applicationsData);
      // Mark component as loaded after data is fetched
      setComponentLoaded(true);
      
      // Start tour if user has master resume and hasn't seen tour yet
      if (user.hasMasterResume && !tourCompleted && applicationsData.length === 0) {
        startTour();
      }
    }
  }, [applicationsData, user.hasMasterResume, tourCompleted, startTour]);

  const handleStartNewApplication = () => {
    setShowNewApplication(true);
    setJobDescription('');
    setJobLink('');
    setError('');
  };

  const handleGenerateDocuments = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (!user.hasMasterResume) {
      setError("Please create a master profile first from the Home page");
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const url = `${import.meta.env.VITE_API_URL}/applications/`;
      const data = {
        job_description: jobDescription,
        job_link: jobLink || undefined,
      };

      const response = await postRequest(url, data, true);

      if (response.ok) {
        await response.json();
        // Refresh applications list
        await refetch();
        setShowNewApplication(false);
        setJobDescription('');
        setJobLink('');
      } else {
        const errorData = await response.json();
        if (response.status === 429) {
          setError('Our service is currently handling a high volume of requests. Please try again shortly.');
        } else {
          setError(errorData.details || 'Failed to generate application documents. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error generating application:', err);
      setError('An error occurred while generating the application. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewResume = (application: Application) => {
    navigate("/dashboard/resume-builder", {
      state: { resume: application.resume, component: 'resume builder' }
    });
  };

  const handleOpenCoverLetter = (application: Application) => {
    setSelectedApplication(application);
    setEditedCoverLetter(application.cover_letter);
    setShowCoverLetter(true);
  };

  const handleSaveCoverLetter = async () => {
    if (!selectedApplication) return;

    setIsSaving(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/applications/${selectedApplication.id}/`;
      const response = await putRequest(url, { cover_letter: editedCoverLetter }, true);
      
      if (response.ok) {
        // Update the local state
        setApplications(applications.map(app => 
          app.id === selectedApplication.id 
            ? { ...app, cover_letter: editedCoverLetter }
            : app
        ));
        setShowCoverLetter(false);
        setSelectedApplication(null);
      } else {
        console.error("Failed to update cover letter");
      }
    } catch (error) {
      console.error("Error updating cover letter:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelCoverLetter = () => {
    setShowCoverLetter(false);
    setSelectedApplication(null);
    setEditedCoverLetter('');
  };

  const handleExportCoverLetterPdf = () => {
    if (!selectedApplication) return;
    
    const fileName = `cover_letter_${selectedApplication.resume.personal_information?.name?.replace(/\s+/g, '_') || 'document'}.pdf`;
    coverLetterPdf(editedCoverLetter, fileName);
  };

  const getJobDescriptionSnippet = (description: string) => {
    if (!description) return '';
    return description.length > 100 
      ? description.substring(0, 100) + '...' 
      : description;
  };

  // Handle tour callback
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    } else if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Joyride Tour - only runs when component is loaded and user has master resume */}
      {componentLoaded && (
        <Joyride
          steps={applicationsTourSteps}
          run={run}
          stepIndex={stepIndex}
          continuous
          showSkipButton
          showProgress
          callback={handleJoyrideCallback}
          styles={tourStyles}
          locale={tourLocale}
        />
      )}
      
      <div className="flex justify-between items-center applications-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">Manage your job applications</p>
        </div>
        <Button
          id="new-application-btn"
          onClick={handleStartNewApplication}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Start New Application
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-6">Start your first application to get going</p>
          <Button
            onClick={handleStartNewApplication}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Application
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {application.resume.personal_information?.name || 'Unnamed Resume'}
                  </h3>
                  {application.resume.personal_information?.profession && (
                    <p className="text-gray-600 mt-1">
                      {application.resume.personal_information.profession}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Applied on {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {application.job_description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Job Description: </span>
                    {getJobDescriptionSnippet(application.job_description)}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {application.job_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(application.job_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Job
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewResume(application)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCoverLetter(application)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Cover Letter
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Application Dialog */}
      <Dialog open={showNewApplication} onOpenChange={setShowNewApplication}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start New Application</DialogTitle>
            <DialogDescription>
              Enter the job description to generate a tailored resume and cover letter
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description *
              </label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={12}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {jobDescription.length} characters
              </div>
            </div>

            <div>
              <label htmlFor="jobLink" className="block text-sm font-semibold text-gray-700 mb-2">
                Job Link (Optional)
              </label>
              <Input
                id="jobLink"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                placeholder="https://example.com/job-posting"
                type="url"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNewApplication(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateDocuments}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Documents...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Generate Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog */}
      <Dialog open={showCoverLetter} onOpenChange={setShowCoverLetter}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Cover Letter</DialogTitle>
            <DialogDescription>
              Edit and save your cover letter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editedCoverLetter}
              onChange={(e) => setEditedCoverLetter(e.target.value)}
              className="min-h-[400px] font-serif text-base"
              placeholder="Your cover letter..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleExportCoverLetterPdf}
                disabled={isSaving}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelCoverLetter}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCoverLetter}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
