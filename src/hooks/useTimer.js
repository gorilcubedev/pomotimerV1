import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (customDurations, dependencies) => {
  const {
    activeTaskId,
    tasks,
    setTasks,
    playSound,
    focusSound,
    breakSound
  } = dependencies;
  const [timeLeft, setTimeLeft] = useState(customDurations.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [breakType, setBreakType] = useState(null);
  const [pomodoroCount, setPomodoroCount] = useState(() => {
    const saved = localStorage.getItem('pomodoroCount');
    return saved ? parseInt(saved) : 0;
  });
  const [resetFocusNumber, setResetFocusNumber] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const intervalRef = useRef(null);
  const prevDurationsRef = useRef({ focus: 25, break: 5 });
  const resetPressedRef = useRef(false);

  // Timer handlers
  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleReset = useCallback(() => {
    resetPressedRef.current = true;
    setIsRunning(false);
    setIsBreak(false);
    setBreakType(null);
    setTimeLeft(customDurations.focus * 60);
    // Reset the flag after a short delay to allow the timer effect to process
    setTimeout(() => {
      resetPressedRef.current = false;
    }, 100);
  }, [customDurations.focus]);

  const handleSkip = useCallback(() => {
    setIsRunning(false);
    if (isBreak) {
      // Skipping a break, going to focus
      setIsBreak(false);
      setBreakType(null);
      setTimeLeft(customDurations.focus * 60);
    } else {
      // Skipping a focus session, going to break
      // Only increment pomodoro count when focus session is completed, not when skipped
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      setIsBreak(true);
      if (newCount % 4 === 0) {
        setBreakType('long');
        setTimeLeft(15 * 60);
      } else {
        setBreakType('short');
        setTimeLeft(customDurations.break * 60);
      }
    }
  }, [isBreak, customDurations.focus, customDurations.break, pomodoroCount]);

  const handleCycleReset = useCallback(() => {
       setIsResetting(true);
       setPomodoroCount(0);
       setBreakType(null);
       setResetFocusNumber(prev => !prev);
       if (!isRunning) {
         setIsBreak(false);
         setTimeLeft(customDurations.focus * 60);
       }
       // Clear flag after state updates
       setTimeout(() => setIsResetting(false), 0);
     }, [isRunning, customDurations.focus]);

  // Update timer when custom durations actually change (only when not running)
  useEffect(() => {
    const focusChanged = prevDurationsRef.current.focus !== customDurations.focus;
    const breakChanged = prevDurationsRef.current.break !== customDurations.break;

    if ((focusChanged || breakChanged) && !isRunning) {
      const focusDuration = typeof customDurations.focus === 'number' ? customDurations.focus : 25;
      const breakDuration = typeof customDurations.break === 'number' ? customDurations.break : 5;

      if (!isBreak) {
        // Update focus time if we're in focus mode
        setTimeLeft(focusDuration * 60);
      } else {
        // Update break time if we're in break mode
        setTimeLeft(breakDuration * 60);
      }

      // Update the ref to track the new durations
      prevDurationsRef.current = {
        focus: focusDuration,
        break: breakDuration
      };
    }
  }, [customDurations.focus, customDurations.break, isRunning, isBreak]);

  // Main timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
              // If reset was pressed, don't run completion logic
              if (resetPressedRef.current) {
                return customDurations.focus * 60;
              }

              handlePause();

              // Play appropriate sound
              if (!isBreak) {
                playSound(focusSound.current);
              } else {
                playSound(breakSound.current);
              }

              // Add pomodoro to active task when focus session completes
              if (!isBreak && activeTaskId) {
                setTasks(tasks.map(task =>
                  task.id === activeTaskId
                    ? { ...task, pomodoros: task.pomodoros + 1 }
                    : task
                ));
              }

                if (isBreak) {
                  // Break completed - return to focus
                  setIsBreak(false);
                  setBreakType(null);

                  return customDurations.focus * 60;
                } else {
                  // Focus session completed - determine break type
                  const newCount = pomodoroCount + 1;
                  setPomodoroCount(newCount);

                  // Check if long break is needed (every 4 pomodoros)
                  if (newCount % 4 === 0) {
                    setIsBreak(true);
                    setBreakType('long');
                    return 15 * 60; // 15-minute long break
                  } else {
                    setIsBreak(true);
                    setBreakType('short');
                    return customDurations.break * 60; // Regular short break
                  }
                }
            }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak, activeTaskId, tasks, customDurations.focus, customDurations.break, playSound, focusSound, breakSound, pomodoroCount, setTasks, handlePause]);

  // Save pomodoro count to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroCount', pomodoroCount.toString());
  }, [pomodoroCount]);

  return {
    timeLeft,
    setTimeLeft,
    isRunning,
    isBreak,
    setIsBreak,
    breakType,
    setBreakType,
    pomodoroCount,
    setPomodoroCount,
    resetFocusNumber,
    isResetting,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    handleCycleReset,
    intervalRef,
    resetPressedRef
  };
};