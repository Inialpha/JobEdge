//import React from 'react'
import { useForm } from 'react-hook-form';
//SubmitHandler
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FeedbackState } from '../components/Alert';
import { postRequest, getRequest } from '../utils/apis'
import { setCookie } from '../utils/cookieManager';
import { useDispatch } from 'react-redux';
import { login } from '../store/userSlice';

export default function Login() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors }} = useForm();

  const onSubmit = async (data: object) => {

    const url = `${import.meta.env.VITE_AUTH_URL}/login/`

    try {
      const response = await postRequest(url, data);
      if (response.ok) {
        const res = await response.json();
        setFeedback({message: "Login successful. Redirecting to dashboard",
        });
        setCookie("token", res.token);
        try {
          const profileUrl = `${import.meta.env.VITE_API_URL}/users/profile/`
          const userRes = await getRequest(profileUrl)
          if (userRes.ok) {
            const userJson = await userRes.json();
            console.log("user_json...", userJson) 
            const userData = {
              'id': userJson.id,
              'firstName': userJson.first_name,
              'lastName': userJson.last_name,
              'isStaff': userJson.is_staff,
              'hasMasterResume': userJson.has_master_resume,
            }
            console.log("user data", userData)
            dispatch(login(userData));
            setTimeout(() => {
              if (userData.isStaff) {
                navigate("/admin/dashboard");
              } else {
                navigate("/dashboard");
              }
            }, 5000);
          } else {
            const error = await userRes.json();
            setFeedback({message: error.detail, variant: 'error'
             });
          }
        } catch (error) {
          console.log(error)
          setFeedback({message: "error.detail", variant: 'error'
          })
        }
      } else {
        const res = await response.json();
        if (res.detail === "User account not verified.") {
          setFeedback({variant: 'warning', message: "Please verify your email and try again"});
        } else if (res.detail === "Unable to login with provided credentials."){
          setFeedback({variant: 'error', message: "Incorrect email or password"});
        }
      }
    } catch (error) {
        setFeedback({variant: 'error', message: "An error occured please try again"});
        console.log(error);
    }
    setTimeout(() => {
      setFeedback(null)
    }, 5000);
  }
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {feedback && <div style={{
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
        fontSize: '14px'
      }}>
        {feedback.message}
      </div>}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white drop-shadow-lg">Login to JobEdge</h2>
        <p className="mt-2 text-center text-sm text-white/90">
          Access your dashboard and manage your resumes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-white/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" method="POST">

            <div>
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email address</Label>
              <Input {...register('email', {
                required: "Please enter your email"})}
                id="email" type="email" autoComplete="email" className="mt-1"
              />
              {errors?.email?.message && <span className='text-red-500 text-xs mt-1 block'>{errors?.email?.message.toString()}</span>}
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" className="mt-1"
                {...register('password', {
                  required: "Please enter your password"})}
              />
              {errors?.password?.message && <span className='text-red-500 text-xs mt-1 block'>{errors.password.message.toString()}</span>}
            </div>

            <div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 shadow-lg">
                Login
              </Button>
            </div>
          </form>
        

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </ >
  )
}
