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
          const resJson = await response.json()
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
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-xl font-semibold">{status}</h1>
    </div>
  )
}

export default VerifyEmail
