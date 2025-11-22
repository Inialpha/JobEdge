import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { TOUR_START_DELAY, TOUR_NAVIGATION_DELAY } from '@/utils/tourConfig';

interface TourContextType {
  run: boolean;
  stepIndex: number;
  tourActive: boolean;
  startTour: () => void;
  stopTour: () => void;
  setStepIndex: (index: number) => void;
  resetTour: () => void;
  navigateToApplications: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const user = useSelector((state: RootState) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  // Helper function to start tour with delay
  const scheduleTourStart = useCallback(() => {
    const timer = setTimeout(() => {
      setRun(true);
      setTourActive(true);
      setStepIndex(0);
    }, TOUR_START_DELAY);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if user has completed the tour
  useEffect(() => {
    if (user.id) {
      const tourCompleted = localStorage.getItem(`tour_completed_${user.id}`);
      const tourStage = localStorage.getItem(`tour_stage_${user.id}`);
      
      if (!tourCompleted) {
        // Check current location and tour stage
        if (location.pathname === '/dashboard' || location.pathname === '/dashboard/home') {
          if (!user.hasMasterResume) {
            // Start tour on home page for users without profile
            return scheduleTourStart();
          } else if (tourStage === 'applications') {
            // User just created profile, redirect to applications page
            const timer = setTimeout(() => {
              navigate('/dashboard/applications');
            }, TOUR_NAVIGATION_DELAY);
            
            return () => clearTimeout(timer);
          }
        } else if (location.pathname === '/dashboard/applications' && tourStage === 'applications') {
          // Continue tour on applications page
          return scheduleTourStart();
        }
      }
    }
  }, [user.id, user.hasMasterResume, location.pathname, navigate, scheduleTourStart]);

  const startTour = () => {
    setRun(true);
    setTourActive(true);
    setStepIndex(0);
  };

  const stopTour = () => {
    setRun(false);
    setTourActive(false);
    if (user.id) {
      localStorage.setItem(`tour_completed_${user.id}`, 'true');
      localStorage.removeItem(`tour_stage_${user.id}`);
    }
  };

  const resetTour = () => {
    if (user.id) {
      localStorage.removeItem(`tour_completed_${user.id}`);
      localStorage.removeItem(`tour_stage_${user.id}`);
    }
    setStepIndex(0);
    setRun(false);
    setTourActive(false);
  };

  const navigateToApplications = () => {
    if (user.id) {
      localStorage.setItem(`tour_stage_${user.id}`, 'applications');
    }
    setRun(false);
    setTourActive(false);
    // Navigation will happen in useEffect
  };

  return (
    <TourContext.Provider
      value={{
        run,
        stepIndex,
        tourActive,
        startTour,
        stopTour,
        setStepIndex,
        resetTour,
        navigateToApplications,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
