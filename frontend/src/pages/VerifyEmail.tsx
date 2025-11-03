import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getRequest } from "@/utils/apis"
import { Link, useNavigate } from 'react-router-dom'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState("Verifying...")
  const code = searchParams.get("code")
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!code) {
        setStatus("Invalid or missing verification code.")
        return
      }

      try {
        const url = `${import.meta.env.VITE_AUTH_URL}/verify-email/?code=${code}` 
        const response = await getRequest(url)
        if (response.status === 200) {
          await response.json()
          setStatus("✅ Your email has been verified successfully! Navigating to login")
          setTimeout(() => navigate("/login"), 3000)
        } else {
          setStatus("❌ Verification failed. The link might have expired or is invalid.")
        }
      } catch (error) {
        setStatus("❌ Verification failed. The link might have expired or is invalid.")
      }
    }

    verifyEmail()
  }, [code])

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
      `}</style>
      
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl p-12 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-6">
            {status.includes("✅") ? (
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : status.includes("❌") ? (
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Email Verification</h1>
          <p className="text-lg text-gray-600">{status}</p>
          
          {status.includes("❌") && (
            <div className="mt-8">
              <Link to="/signup">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all">
                  Back to Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default VerifyEmail
