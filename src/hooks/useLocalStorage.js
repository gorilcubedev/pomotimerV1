import { useState, useEffect } from 'react';

export const useLocalStorage = () => {
  const [customDurations, setCustomDurations] = useState(() => {
    const saved = localStorage.getItem('pomodoroDurations');
    const defaultDurations = { focus: 25, break: 5 };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure values are valid numbers
      return {
        focus: typeof parsed.focus === 'number' && parsed.focus >= 1 && parsed.focus <= 60 ? parsed.focus : 25,
        break: typeof parsed.break === 'number' && parsed.break >= 1 && parsed.break <= 60 ? parsed.break : 5
      };
    }
    return defaultDurations;
  });

  // Save custom durations to localStorage whenever they change (only valid numbers)
  useEffect(() => {
    const focusValue = typeof customDurations.focus === 'number' ? customDurations.focus : 25;
    const breakValue = typeof customDurations.break === 'number' ? customDurations.break : 5;
    localStorage.setItem('pomodoroDurations', JSON.stringify({
      focus: focusValue,
      break: breakValue
    }));
  }, [customDurations]);

  return {
    customDurations,
    setCustomDurations
  };
};