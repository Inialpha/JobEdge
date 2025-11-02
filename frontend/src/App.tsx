import './App.css'
import JobsPage from "@/pages/JobsPage";
import JobDetails from "@/pages/JobDetails";
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import AccordionResume from "@/pages/ResumeForm";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/Dashboard"
import TailorResumePage from "@/pages/TailorResumePage";
import LandingPage from "@/pages/LandingPage";
import ResumeBuilder from "@/pages/ResumeBuilder";
import UserDashboardLayout from "@/pages/UserDashboard";
import ResumesComponent from "@/components/dashboard/user/Resumes";
import SettingsComponent from "@/components/dashboard/user/Settings";
import { AuthMiddleware } from "@/utils/middleware";

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<LandingPage />} />
      <Route path="signup" element={<Signup />} />
      <Route path="login" element={<Login />} />
      <Route path="jobs/detail" element={<JobDetails />} />
      <Route path='jobs' element={<JobsPage />} />
      <Route path="resume" element={
          <AccordionResume />
      }/>
      <Route path="resume-builder" element={<ResumeBuilder />} />
      <Route path="admin/dashboard" element={<AdminDashboard />} />
      
      {/* Protected routes with authentication */}
      <Route element={<AuthMiddleware />}>
        <Route path="tailor-resume" element={<TailorResumePage />} />
        
        {/* User Dashboard with nested routes */}
        <Route path="dashboard" element={<UserDashboardLayout />}>
          <Route index element={<ResumesComponent />} />
          <Route path="resumes" element={<ResumesComponent />} />
          <Route path="settings" element={<SettingsComponent />} />
        </Route>
      </Route>
    </Route>
  )
)

function App() {

  return (
    <RouterProvider router={routes} />
  );
}



export default App
