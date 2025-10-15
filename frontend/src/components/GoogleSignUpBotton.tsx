import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { getRequest, postRequest } from "@/utils/apis";
import { useDispatch } from 'react-redux';
import { login } from '../store/userSlice';

// First, install the required packages:
// npm install @react-oauth/google jwt-decode axios

import React, { useState, useEffect } from 'react';
//import { jwt_decode } from 'jwt-decode';
import axios from 'axios';
import { setCookie } from '../utils/cookieManager';


export default function GoogleSignUpButton() {
  const [user, setUser] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token with your backend
      // fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('authToken');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("credentialResponse", credentialResponse)
    const { credential } = credentialResponse;
    console.log("credential", credential)
    
    try {
      const response = await postRequest('http://localhost:8000/api/auth/google/signup', {
        credential
      }, false);
      
      const res = await response.json();
      console.log(res)
      
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
              userData.isStaff ? navigate("/admin/dashboard") : navigate("/dashboard")
            }, 5000);
        } else {
          const error = await userRes.json();
          setFeedback({message: error.detail, variant: 'error'
          });
        }
      } catch (error) {
        console.log(error)
        setFeedback({message: error.detail, variant: 'error'
        })
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <div className="App">
      
      {user ? (
        <div>
          <h2>Welcome, {user.name}!</h2>
          <p>Email: {user.email}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <GoogleOAuthProvider clientId='850852107345-tk6fgngfvmcneg8lsonu56i66ipd1qii.apps.googleusercontent.com'>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </GoogleOAuthProvider>
        </div>
      )}
    </div>


    /*<Link
      href="#"
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >
      <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
      <span>Sign up with Google</span>
    </Link>*/
  )
}


