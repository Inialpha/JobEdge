import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postRequest } from '../utils/apis';

interface FeedbackState {
  message: string;
  variant?: 'success' | 'error' | 'warning';
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const code = searchParams.get("code");
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    if (!code) {
      setFeedback({
        message: "Invalid or missing reset code.",
        variant: 'error'
      });
    }
  }, [code]);

  const onSubmit = async (data: any) => {
    if (!code) {
      setFeedback({
        message: "Invalid or missing reset code.",
        variant: 'error'
      });
      return;
    }

    const url = `${import.meta.env.VITE_AUTH_URL}/password/reset/verified/`;
    
    setIsLoading(true);
    setFeedback(null);
    
    try {
      const response = await postRequest(url, {
        code: code,
        password: data.password
      });
      
      if (response.ok) {
        setResetComplete(true);
        setFeedback({
          message: "Password reset successful! Redirecting to login...",
          variant: 'success'
        });
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        const res = await response.json();
        setFeedback({
          message: res.detail || "Failed to reset password. The link may have expired.",
          variant: 'error'
        });
      }
    } catch (error) {
      setFeedback({
        message: "An error occurred. Please try again.",
        variant: 'error'
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {feedback && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '12px 24px',
          borderRadius: '8px',
          backgroundColor: feedback.variant === 'error' ? '#fee2e2' : feedback.variant === 'warning' ? '#fef3c7' : '#d1fae5',
          color: feedback.variant === 'error' ? '#991b1b' : feedback.variant === 'warning' ? '#92400e' : '#065f46',
          border: `1px solid ${feedback.variant === 'error' ? '#fca5a5' : feedback.variant === 'warning' ? '#fde68a' : '#6ee7b7'}`,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          fontWeight: '600',
          fontSize: '14px',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {feedback.message}
        </div>
      )}
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white drop-shadow-lg">
          Create New Password
        </h2>
        <p className="mt-2 text-center text-sm text-white/90">
          {resetComplete 
            ? "Your password has been reset successfully" 
            : "Enter your new password below"
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-white/20">
          {!resetComplete ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" method="POST">
              <div>
                <Label htmlFor="password" className="text-gray-700 font-semibold">
                  New Password
                </Label>
                <Input 
                  {...register('password', {
                    required: "Please enter a password",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters"
                    }
                  })}
                  id="password" 
                  type="password" 
                  autoComplete="new-password" 
                  className="mt-1"
                />
                {errors?.password?.message && (
                  <span className='text-red-500 text-xs mt-1 block'>
                    {errors.password.message.toString()}
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                  Confirm New Password
                </Label>
                <Input 
                  {...register('confirmPassword', {
                    required: "Please confirm your password",
                    validate: (value) => value === password || "Passwords do not match"
                  })}
                  id="confirmPassword" 
                  type="password" 
                  autoComplete="new-password" 
                  className="mt-1"
                />
                {errors?.confirmPassword?.message && (
                  <span className='text-red-500 text-xs mt-1 block'>
                    {errors.confirmPassword.message.toString()}
                  </span>
                )}
              </div>

              <div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !code} 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
          )}

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
