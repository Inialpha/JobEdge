import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRequest, postFormData } from "@/utils/apis";
import { FileText, Edit, UploadCloud, UserCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { updateUserInfo } from "@/store/userSlice";
import { RootState } from "@/store/store";
import { useView } from "@/context/ViewContext";
import { useQuery } from '@tanstack/react-query';
import CircularLoader from "@/components/ui/circularLoader";

interface Resume {
  id: string;
  name: string;
  profession?: string;
  is_master: boolean;
  updated_at: string;
  personal_information: {
    name: string;
    profession?: string;
  };
}

export default function HomeComponent() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const { setCurrentView } = useView();
  const [masterResume, setMasterResume] = useState<Resume | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const navigate = useNavigate();

  // Set current view when component mounts
  useEffect(() => {
    setCurrentView("home");
  }, [setCurrentView]);

  const fetchResumes = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/resumes/`;
      const response = await getRequest(url);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Failed to fetch resumes');
    } catch (error) {
      console.error("Error fetching resumes:", error);
      throw error;
    }
  };

  const { data: resumesData, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: fetchResumes,
  });

  useEffect(() => {
    if (resumesData) {
      const master = resumesData.find((resume: Resume) => resume.is_master);
      setMasterResume(master || null);
    }
  }, [resumesData]);

  const handleCreateProfile = () => {
    setShowCreateDialog(true);
  };

  const handleUpdateProfile = () => {
    if (masterResume) {
      navigate("/dashboard/resume-builder", { 
        state: { resume: masterResume, component: 'resume builder' } 
      });
    }
  };

  const handleCreateFromScratch = () => {
    setShowCreateDialog(false);
    navigate('/dashboard/resume-builder', { 
      state: { component: 'resume builder', is_master: true } 
    });
  };

  const handleUploadFile = () => {
    setShowCreateDialog(false);
    const fileInput = document.getElementById('master-resume-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/resumes/`;
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await postFormData(url, formData);
      if (response.ok) {
        const resume = await response.json();
        setFeedback({type: 'success', message: "Master resume uploaded successfully. Redirecting to editor..."});
        dispatch(updateUserInfo({ hasMasterResume: true }));
        
        setTimeout(() => {
          navigate('/dashboard/resume-builder', { 
            state: { resume, component: 'resume builder' } 
          });
        }, 1000);
      } else {
        setFeedback({type: 'error', message: "There was an error uploading your resume. Please try again."});
      }
    } catch (error) {
      console.error(error);
      setFeedback({type: 'error', message: "There was an error uploading your resume. Please try again."});
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CircularLoader size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg ${
          feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <UserCircle className="h-12 w-12 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
            <p className="text-gray-600">
              {masterResume 
                ? `Last updated: ${new Date(masterResume.updated_at).toLocaleDateString()}`
                : "No master profile yet"}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {masterResume ? (
            <>
              <Button
                onClick={handleUpdateProfile}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCreateProfile}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your Profile
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Master Profile</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {masterResume ? '1' : '0'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Resumes</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Applications</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>

      {/* Create Master Resume Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Master Profile</DialogTitle>
            <DialogDescription>
              Choose how you want to create your master profile
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

      {/* Hidden file input */}
      <Input
        id="master-resume-upload"
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.docx,.txt"
        disabled={isUploading}
      />
    </div>
  );
}
