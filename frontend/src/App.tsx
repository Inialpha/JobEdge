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

import ResumeGeneratePage from "@/pages/ResumeGeneratePage";
import ResumeBuilder from "@/pages/ResumeBuilder";

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
      <Route path="tailor-resume" element={<TailorResumePage />} />
      <Route path="generate-resume" element={<ResumeGeneratePage />} />
      <Route path="resume-builder" element={<ResumeBuilder />} />
      <Route path="dashboard" element={<AdminDashboard />} />

    </Route>
  )
)

function App() {

  return (
    <RouterProvider router={routes} />
  );
}



export default App
