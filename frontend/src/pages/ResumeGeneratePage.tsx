import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { postRequest } from '@/utils/apis';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function JobDescriptionForm() {
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setStatus('error');
      setMessage('Please enter a job description');
      return;
    }

    if (!user.hasMasterResume) {
      setStatus('error');
      setMessage('Please upload a master resume first');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const url = `${import.meta.env.VITE_API_URL}/resume/generate/`;
      const data = {
        user_id: user.id,
        job_description: description
      };

      const response = await postRequest(url, data);

      if (response.ok) {
        const resume = await response.json();
        setStatus('success');
        setMessage('Resume generated successfully!');
        
        // Navigate to resume page with generated resume
        setTimeout(() => {
          navigate('/resume', { state: { resume: resume } });
        }, 1500);
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.details || 'Failed to generate resume');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleClear = () => {
    setDescription('');
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Generate Tailored Resume
          </h1>
          <p className="text-gray-600">
            Enter the job description below and we'll generate a tailored resume for you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="jobDescription" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job Description
            </label>
            <textarea
              id="jobDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste or type the job description here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-gray-800 placeholder-gray-400"
            />
            <div className="mt-2 text-sm text-gray-500">
              {description.length} characters
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                status === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Resume...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Resume
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={status === 'loading'}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </form>

        {!user.hasMasterResume && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You need to upload a master resume before you can generate tailored resumes. 
              Please visit your profile to upload one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
