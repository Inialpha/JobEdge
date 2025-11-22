import { Step } from 'react-joyride';

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
