import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { TOUR_START_DELAY } from '@/utils/tourConfig';

/**
 * Custom hook for managing page-specific tours
 * Each dashboard page can use this hook to manage its own tour state independently
 */
export function usePageTour(pageKey: string) {
  const user = useSelector((state: RootState) => state.user);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Get tour completion status from localStorage
  const getTourCompleted = useCallback(() => {
    if (!user.id) return true;
    const completed = localStorage.getItem(`${pageKey}_tour_completed_${user.id}`);
    return completed === 'true';
  }, [user.id, pageKey]);

  // Start the tour
  const startTour = useCallback(() => {
    if (!user.id) return;
    
    const timer = setTimeout(() => {
      setRun(true);
      setStepIndex(0);
    }, TOUR_START_DELAY);
    
    return () => clearTimeout(timer);
  }, [user.id]);

  // Stop the tour and mark as completed
  const stopTour = useCallback(() => {
    setRun(false);
    if (user.id) {
      localStorage.setItem(`${pageKey}_tour_completed_${user.id}`, 'true');
    }
  }, [user.id, pageKey]);

  // Reset the tour (clear completion status)
  const resetTour = useCallback(() => {
    if (user.id) {
      localStorage.removeItem(`${pageKey}_tour_completed_${user.id}`);
    }
    setStepIndex(0);
    setRun(false);
  }, [user.id, pageKey]);

  return {
    run,
    stepIndex,
    setStepIndex,
    startTour,
    stopTour,
    resetTour,
    tourCompleted: getTourCompleted(),
  };
}
