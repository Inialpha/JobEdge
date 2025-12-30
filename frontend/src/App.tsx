import './App.css'
import JobsPage from "@/pages/JobsPage";
import JobDetails from "@/pages/JobDetails";
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import AdminDashboardLayout from "@/pages/admin/Dashboard"
import LandingPage from "@/pages/LandingPage";
import UserDashboardLayout from "@/pages/UserDashboard";
import HomeComponent from "@/components/dashboard/user/Home";
import ResumesComponent from "@/components/dashboard/user/Resumes";
import SettingsComponent from "@/components/dashboard/user/Settings";
import ResumeBuilderComponent from "@/components/dashboard/user/ResumeBuilder";
import TailorResumeComponent from "@/components/dashboard/user/TailorResume";
import SearchJobsComponent from "@/components/dashboard/user/SearchJobs";
import ApplicationsComponent from "@/components/dashboard/user/Applications";
import AdminHomeComponent from "@/components/dashboard/admin/Home";
import AdminAnalyticsComponent from "@/components/dashboard/admin/Analytics";
import AdminUsersComponent from "@/components/dashboard/admin/Users";
import AdminResumesComponent from "@/components/dashboard/admin/Resume";
import AdminSettingsComponent from "@/components/dashboard/admin/setting/settings";
import { AuthMiddleware, AdminMiddleware } from "@/utils/middleware";
import VerifyEmail from "@/pages/VerifyEmail"
import ForgotPassword from "@/pages/ForgotPassword"
import ResetPassword from "@/pages/ResetPassword"
import NotFound from "@/pages/NotFound"
import { ViewProvider } from "@/context/ViewContext";
import { Analytics } from '@vercel/analytics/react'; 


const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<LandingPage />} />
      <Route path="signup" element={<Signup />} />
      <Route path="login" element={<Login />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="jobs/detail" element={<JobDetails />} />
      <Route path="jobs" element={<JobsPage />} />
      
      {/* Protected routes with authentication */}
      <Route element={<AuthMiddleware />}>
        {/* User Dashboard with nested routes */}
        <Route path="dashboard" element={
          <ViewProvider>
            <UserDashboardLayout />
          </ViewProvider>
        }>
          <Route index element={<HomeComponent />} />
          <Route path="home" element={<HomeComponent />} />
          <Route path="resumes" element={<ResumesComponent />} />
          <Route path="resume-builder" element={<ResumeBuilderComponent />} />
          <Route path="tailor-resume" element={<TailorResumeComponent />} />
          <Route path="applications" element={<ApplicationsComponent />} />
          <Route path="jobs" element={<SearchJobsComponent />} />
          <Route path="settings" element={<SettingsComponent />} />
        </Route>
        <Route element={<AdminMiddleware />}>
          <Route path="admin/dashboard" element={<AdminDashboardLayout />}>
            <Route index element={<AdminHomeComponent />} />
            <Route path="home" element={<AdminHomeComponent />} />
            <Route path="analytics" element={<AdminAnalyticsComponent />} />
            <Route path="users" element={<AdminUsersComponent />} />
            <Route path="resumes" element={<AdminResumesComponent />} />
            <Route path="settings" element={<AdminSettingsComponent />} />
          </Route>
        </Route>
      </Route>
      
      {/* 404 catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
)

function App() {
  return (
    <>
      <RouterProvider router={routes} />
      <Analytics />
    </>
  );
}



export default App
