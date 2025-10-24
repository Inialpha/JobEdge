import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to manage view state between dashboard items
 * Allows setting initial view from location state
 */
export const useView = (defaultView: string) => {
  const [activeView, setActiveView] = useState(defaultView);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { component?: string } | null;
    if (state && state.component) {
      setActiveView(state.component);
    }
  }, [location.state]);

  return { activeView, setActiveView };
};
