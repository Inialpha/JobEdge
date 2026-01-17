import { Step } from 'react-joyride';

// Timing constants for tour delays
export const TOUR_START_DELAY = 1000; // Delay before starting tour to allow page load
export const TOUR_NAVIGATION_DELAY = 500; // Delay when navigating between tour stages

// Tour steps for the Home page (profile creation)
export const homeTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to JobEdge! Let\'s take a quick tour to help you get started with creating your professional profile and job applications.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.home-welcome-section',
    content: 'This is your dashboard home. Here you can create and manage your master profile, which serves as the foundation for all your job applications.',
    placement: 'bottom',
  },
  {
    target: '#create-profile-btn',
    content: 'Click here to create your master profile. You can either build it from scratch or upload an existing resume. Once you\'ve created your profile, we\'ll show you how to create your first job application!',
    placement: 'bottom',
  },
];

// Tour steps for the Applications page (creating first application)
export const applicationsTourSteps: Step[] = [
  {
    target: '.applications-header',
    content: 'Great job creating your profile! Now let\'s create your first job application. Our AI will help you tailor your resume and generate a cover letter.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#new-application-btn',
    content: 'Click this button to start a new application. You\'ll paste a job description, and our AI will automatically create a tailored resume and cover letter for you!',
    placement: 'bottom',
  },
];

// Tour steps for the Resume Builder page
export const resumeBuilderTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Resume Builder! Here you can create and edit your professional resume. Let\'s walk through the key features.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.resume-form-section',
    content: 'Fill in all the required fields marked with an asterisk (*). Make sure to complete all required information before saving your resume.',
    placement: 'right',
  },
  {
    target: '.resume-preview-section',
    content: 'This is the live preview! As you fill in the form, you\'ll see your resume update in real-time. This helps you visualize how your resume will look.',
    placement: 'left',
  },
  {
    target: '.template-selector',
    content: 'You can change your resume template here! Click on different templates to see how your resume looks in various styles.',
    placement: 'bottom',
  },
  {
    target: '.download-buttons',
    content: 'Once you\'ve completed all required fields and saved your resume, you can download it as a PDF or DOCX file using these buttons.',
    placement: 'top',
  },
  {
    target: '#save-resume-btn',
    content: 'Don\'t forget to save your work! Click this button to save your resume. Remember, all required fields must be filled before you can save.',
    placement: 'bottom',
  },
];

// Tour steps for the Jobs page
export const jobsTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Jobs page! Here you can search and filter job opportunities. Let\'s explore the search features.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.search-keywords',
    content: 'Use this field to search for jobs by keywords. Keywords are automatically extracted from your master resume if you have completed your profile. This helps you find matching opportunities based on your skills and experience!',
    placement: 'bottom',
  },
  {
    target: '.location-filter',
    content: 'Filter jobs by location here. You can search for jobs in specific cities, states, or countries.',
    placement: 'bottom',
  },
  {
    target: '.job-results',
    content: 'Your search results will appear here. You can view up to 25 jobs at a time. Scroll down to load more job listings automatically.',
    placement: 'top',
  },
];

// Tour steps for the Search Jobs page (dashboard)
export const searchJobsTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Job Search page! Here you can search for jobs using your master resume. Let\'s explore how to customize your job search.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '#keywords',
    content: 'These are the keywords extracted from your master resume. Keywords are automatically populated from your profile if you have completed it. You can add or remove keywords to refine your search based on your skills, technologies, and experience!',
    placement: 'bottom',
  },
  {
    target: '#location',
    content: 'Specify a location to search for jobs in specific cities, states, or countries. For example, "New York, USA" or "Remote".',
    placement: 'bottom',
  },
  {
    target: '#jobType',
    content: 'Filter by job type to find full-time, part-time, or contract positions that match your preferences.',
    placement: 'bottom',
  },
  {
    target: '#remote',
    content: 'Enable this switch if you\'re looking for remote work opportunities exclusively.',
    placement: 'bottom',
  },
  {
    target: '#daysAgo',
    content: 'Filter jobs by how recently they were posted. For example, set to "7" to see only jobs posted in the last 7 days.',
    placement: 'bottom',
  },
  {
    target: '#maxJobs',
    content: 'Set the maximum number of job results to return (up to 25 jobs). This helps you focus on the most relevant opportunities without being overwhelmed.',
    placement: 'bottom',
  },
  {
    target: '.search-button',
    content: 'Click here to search for jobs based on your criteria. The results will appear below with options to apply directly or generate a tailored application!',
    placement: 'top',
  },
];

// Tour styles configuration
export const tourStyles = {
  options: {
    arrowColor: '#fff',
    backgroundColor: '#fff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: '#7c3aed',
    textColor: '#1f2937',
    width: 380,
    zIndex: 10000,
  },
  buttonNext: {
    backgroundColor: '#7c3aed',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#6b7280',
    fontSize: '14px',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#6b7280',
    fontSize: '14px',
  },
  tooltip: {
    borderRadius: '8px',
    fontSize: '14px',
    padding: '16px',
  },
  tooltipContent: {
    padding: '8px 0',
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
  },
};

// Locale configuration for button labels
export const tourLocale = {
  back: 'Back',
  close: 'Close',
  last: 'Finish',
  next: 'Next',
  open: 'Open',
  skip: 'Skip Tour',
};
