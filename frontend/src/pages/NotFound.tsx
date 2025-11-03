import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
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
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl p-12 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-6">
            <FileQuestion className="h-10 w-10 text-purple-600" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto">
                Go to Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto border-purple-600 text-purple-600 hover:bg-purple-50">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
