import { postRequest } from '../utils/apis'
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
//import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from 'react-router-dom';
import { FormType, NewData } from '../utils/types'


export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const navigate = useNavigate();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors } } = useForm<FormType>();
  //const email = watch('email');
  const password = watch('password');

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    const newData: NewData = {
      first_name: data['firstName'],
      last_name: data['lastName'],
      email: data['email'],
      password: data['password'],
    };


    const url = `${import.meta.env.VITE_AUTH_URL}/signup/`
    setIsLoading(true);
    try {
      const response = await postRequest(url, newData, false);
      console.log(response)
      if (response.ok) {
        setFeedback({type: 'success', message: 'Signup successful! Please check your email to verify your account before logging in.'});
        setTimeout(() => {
          navigate('/login')
        }, 5000);
      } else {
        const res = await response.json()
        console.log(res)
        
        // Handle specific error messages
        if (res.email && Array.isArray(res.email) && res.email[0].includes('already exists')) {
          setFeedback({type: 'error', message: 'This email address is already in use. Please use a different email or try logging in.'})
        } else if (res.detail) {
          setFeedback({type: 'error', message: res.detail})
        } else {
          setFeedback({type: 'error', message: 'Signup failed. Please try again later.'})
        }
        
        setTimeout(() => {
          setFeedback(null)
        }, 5000);
      }
    } catch (error) {
      setFeedback({type: 'error', message: 'An error occurred. Please try again later.'})
      setTimeout(() => {
        setFeedback(null)
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {feedback && <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        padding: '12px 24px',
        borderRadius: '8px',
        backgroundColor: feedback.type === 'error' ? '#fee2e2' : '#d1fae5',
        color: feedback.type === 'error' ? '#991b1b' : '#065f46',
        border: `1px solid ${feedback.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        fontWeight: '600',
        fontSize: '14px',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        {feedback.message}
      </div>}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white drop-shadow-lg">Create your account</h2>
        <p className="mt-2 text-center text-sm text-white/90">
          Join JobEdge and start building your professional resume
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-white/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" action="#" method="POST">
            <div>
              <Label htmlFor="firstName" className="text-gray-700 font-semibold">First Name</Label>
              <Input {...register("firstName",
                {required: "First name is required"})}
                id="firstName"
                type="text" autoComplete="name"
                placeholder="First Name" className="mt-1" />
              {errors?.firstName?.message && <span className="text-red-500 text-xs mt-1 block">{errors?.firstName?.message.toString()}</span>}
            </div>
            <div>
              <Label htmlFor="lastName" className="text-gray-700 font-semibold">Last Name</Label>
              <Input {...register("lastName", {required: "Last name is required"})}
                id="lastName"
                type="text" autoComplete="name"
                placeholder="Last Name" className="mt-1" />
              {errors?.lastName?.message && <span className='text-red-500 text-xs mt-1 block'>{errors?.lastName?.message.toString()}</span>}
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email address</Label>
              <Input id="email" type="email" autoComplete="email" className="mt-1"
              {...register("email", { 
                required: "Email is required", 
                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email address" } 
              })} placeholder="Email" 
            />
              {errors?.email?.message && <span className='text-red-500 text-xs mt-1 block'>{errors?.email?.message.toString()}</span>}
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="Password" className="mt-1"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters long" }
                })}
              />
              {errors?.password?.message && <span className='text-red-500 text-xs mt-1 block'>{errors.password.message.toString()}</span>}
            </div>
            <div>
            <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm Password</Label>
            <Input id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1"
              placeholder="Confirm"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
              value === password || "Passwords do not match",          
          })}
            />
            {errors?.confirmPassword?.message && <span className='text-red-500 text-xs mt-1 block'>{errors.confirmPassword.message.toString()}</span>}
            </div>

            <div>
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing up...
                  </span>
                ) : (
                  'Sign up'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">

            </div>
          </div>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
