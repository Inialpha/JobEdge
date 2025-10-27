import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRequest, postFormData, deleteRequest } from "@/utils/apis";
import { FileText, Download, Edit, UploadCloud, Trash2 } from "lucide-react";
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Resume {
  id: string;
  name: string;
  profession?: string;
  is_master: boolean;
  updated_at: string;
}

export default function ResumesComponent() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/resumes/`;
      const response = await getRequest(url);
      
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resume: Resume) => {
    navigate("/resume-builder", { state: { resume } });
  };

  const handleDownload = (resume: Resume) => {
    // Navigate to resume builder with download option
    navigate("/resume-builder", { state: { resume, autoDownload: true } });
  };

  const handleCreateFromScratch = () => {
    setShowCreateDialog(false);
    // Navigate to resume-builder without any resume data
    navigate('/resume-builder');
  };

  const handleUploadFile = () => {
    setShowCreateDialog(false);
    // Trigger file input click
    const fileInput = document.getElementById('resume-upload-dialog');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setFeedback(null);
      try {
        const url = `${import.meta.env.VITE_API_URL}/resumes/`;
        const formData = new FormData();
        formData.append("file", file);
        const response = await postFormData(url, formData);
        if (response.ok) {
          const resume = await response.json();
          setFeedback({type: 'success', message: "Resume uploaded successfully. Redirecting to editor..."});
          
          // Navigate to resume-builder with the parsed resume
          setTimeout(() => {
            navigate('/resume-builder', { state: { resume } });
          }, 1000);
        } else {
          setFeedback({type: 'error', message: "There was an error uploading the file. Please try again."});
        }
      } catch (error) {
        console.error(error);
        setFeedback({type: 'error', message: "There was an error uploading the file. Please try again."});
      } finally {
        setIsUploading(false);
        setTimeout(() => {
          setFeedback(null);
        }, 5000);
      }
    }
  };

  const handleDeleteClick = (resume: Resume) => {
    setResumeToDelete(resume);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;
    
    try {
      const url = `${import.meta.env.VITE_API_URL}/resumes/${resumeToDelete.id}/`;
      const response = await deleteRequest(url);
      
      if (response.ok) {
        setResumes(resumes.filter((r) => r.id !== resumeToDelete.id));
        setFeedback({type: 'success', message: "Resume deleted successfully"});
      } else {
        setFeedback({type: 'error', message: "Failed to delete resume. Please try again."});
      }
    } catch (error) {
      console.error(error);
      setFeedback({type: 'error', message: "Failed to delete resume. Please try again."});
    } finally {
      setShowDeleteDialog(false);
      setResumeToDelete(null);
      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading resumes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Create Master Resume Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Master Resume</DialogTitle>
            <DialogDescription>
              Choose how you want to create your master resume
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              onClick={handleUploadFile}
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              variant="outline"
              disabled={isUploading}
            >
              <UploadCloud className="h-8 w-8" />
              <span className="text-sm font-medium">Upload Resume File</span>
              <span className="text-xs text-muted-foreground">Upload PDF, DOCX, or TXT</span>
            </Button>
            <Button 
              onClick={handleCreateFromScratch}
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <FileText className="h-8 w-8" />
              <span className="text-sm font-medium">Build from Scratch</span>
              <span className="text-xs text-muted-foreground">Start with an empty form</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for dialog upload */}
      <Input
        id="resume-upload-dialog"
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.docx,.txt"
        disabled={isUploading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resume "{resumeToDelete?.name || 'Untitled Resume'}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setResumeToDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Resumes</h1>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Create Master Resume
        </Button>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div 
          className={`mb-4 p-4 rounded-lg ${
            feedback.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No resumes yet</h3>
          <p className="text-gray-500 mb-4">Create your first resume to get started</p>
          <Button 
            onClick={() => navigate("/resume-builder")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            Create Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {resume.name || "Untitled Resume"}
                  </h3>
                  {resume.profession && (
                    <p className="text-sm text-gray-600">{resume.profession}</p>
                  )}
                  {resume.is_master && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded">
                      Master Resume
                    </span>
                  )}
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <p>Updated: {new Date(resume.updated_at).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(resume)}
                  className="flex-1 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(resume)}
                  className="flex-1 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(resume)}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
