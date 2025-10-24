import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRequest } from "@/utils/apis";
import { FileText, Download, Edit } from "lucide-react";

export default function ResumesComponent() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleEdit = (resume: any) => {
    navigate("/resume-builder", { state: { resume } });
  };

  const handleDownload = (resume: any) => {
    // Navigate to resume builder with download option
    navigate("/resume-builder", { state: { resume, autoDownload: true } });
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Resumes</h1>
        <Button 
          onClick={() => navigate("/resume-builder")}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Create New Resume
        </Button>
      </div>

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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
