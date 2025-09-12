import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Tasks, SettingsModal, Quote } from './components';

export default function App() {
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

  const FOCUS_DURATION = customDurations.focus * 60; // Custom focus duration in seconds
  const BREAK_DURATION = customDurations.break * 60;   // Custom break duration in seconds

  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [tasks, setTasks] = useState(() => {
    // Load tasks from localStorage if available
    const savedTasks = localStorage.getItem('pomodoroTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a preference stored in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    // Otherwise, use system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [quote, setQuote] = useState({ quote: '', author: '' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [playingSound, setPlayingSound] = useState(null); // 'focus', 'break', or null
  const [pomodoroCount, setPomodoroCount] = useState(() => {
    const saved = localStorage.getItem('pomodoroCount');
    return saved ? parseInt(saved) : 0;
  });
  const [resetFocusNumber, setResetFocusNumber] = useState(false);
  // Calculate current cycle based on completed pomodoros
  const currentCycle = pomodoroCount + 1;
  const [breakType, setBreakType] = useState(null); // 'short', 'long', or null
  const intervalRef = useRef(null);
  const focusSound = useRef(new Audio('/focus-complete.mp3'));
  const breakSound = useRef(new Audio('/break-complete.mp3'));
  const prevDurationsRef = useRef({ focus: 25, break: 5 });

  // Helper function to play sounds with error handling
  const playSound = useCallback(async (audio) => {
    if (!soundEnabled) return;

    try {
      // Reset audio to beginning in case it was played before
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.log('Audio playback failed:', error);
      // Fallback: try to show notification if audio fails
      if ('Notification' in window && Notification.permission === 'granted') {
        const message = audio === focusSound.current ? 'Focus session complete!' : 'Break time is over!';
        new Notification('Timer Complete!', {
          body: message,
          icon: '/favicon.ico',
          silent: false
        });
      }
    }
  }, [soundEnabled]);

  // Enhanced function to stop all test sounds
  const stopAllTestSounds = useCallback(() => {
    console.log('Stopping all test sounds...');

    try {
      // Force stop focus sound
      if (focusSound.current) {
        focusSound.current.pause();
        focusSound.current.currentTime = 0;
        focusSound.current.muted = false;
        focusSound.current.volume = 1.0;
      }

      // Force stop break sound
      if (breakSound.current) {
        breakSound.current.pause();
        breakSound.current.currentTime = 0;
        breakSound.current.muted = false;
        breakSound.current.volume = 1.0;
      }

      // Reset state
      setPlayingSound(null);
      console.log('All test sounds stopped');

    } catch (error) {
      console.error('Error stopping test sounds:', error);
      // Force state reset even if audio fails
      setPlayingSound(null);
    }
  }, []);

  // Enhanced test sound function with better error handling
  const testSound = useCallback(async (soundType) => {
    if (!soundEnabled) return;

    console.log(`Testing ${soundType} sound`);

    // Always stop any current sound first
    stopAllTestSounds();

    setPlayingSound(soundType);

    const audioToPlay = soundType === 'focus' ? focusSound.current : breakSound.current;

    if (!audioToPlay) {
      console.error(`Audio instance for ${soundType} not found`);
      setPlayingSound(null);
      return;
    }

    try {
      // Ensure audio is not muted and has proper volume
      audioToPlay.muted = false;
      audioToPlay.volume = 1.0;

      // Reset and play
      audioToPlay.currentTime = 0;
      const playPromise = audioToPlay.play();

      if (playPromise !== undefined) {
        await playPromise;
      }

      console.log(`${soundType} sound started playing`);

      // Set up end handler with proper cleanup
      const handleEnd = () => {
        console.log(`${soundType} sound ended naturally`);
        setPlayingSound(null);
        audioToPlay.removeEventListener('ended', handleEnd);
        audioToPlay.removeEventListener('error', handleError);
      };

      const handleError = (e) => {
        console.error(`Audio error for ${soundType}:`, e);
        setPlayingSound(null);
        audioToPlay.removeEventListener('ended', handleEnd);
        audioToPlay.removeEventListener('error', handleError);
      };

      // Remove any existing listeners first
      audioToPlay.removeEventListener('ended', handleEnd);
      audioToPlay.removeEventListener('error', handleError);

      // Add new listeners
      audioToPlay.addEventListener('ended', handleEnd);
      audioToPlay.addEventListener('error', handleError);

    } catch (error) {
      console.error(`Failed to play ${soundType} sound:`, error);
      setPlayingSound(null);
    }
  }, [soundEnabled, stopAllTestSounds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);

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
  }, [isRunning, isBreak, activeTaskId, tasks, customDurations.focus, customDurations.break, playSound, breakType, pomodoroCount]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setBreakType(null);
    setTimeLeft(customDurations.focus * 60);
  };

  const handleSkip = () => {
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
  };

  const handleSettingsDone = () => {
    console.log('Settings Done clicked, stopping test sounds');
    console.log('Current playingSound state:', playingSound);

    // Immediately stop all test sounds
    stopAllTestSounds();

    // Small delay to ensure audio stops before modal closes
    setTimeout(() => {
      console.log('Proceeding with modal close after audio cleanup');

      // Ensure durations are valid numbers before closing
      const focusDuration = typeof customDurations.focus === 'number' ? customDurations.focus : 25;
      const breakDuration = typeof customDurations.break === 'number' ? customDurations.break : 5;

      setCustomDurations({
        focus: Math.max(1, Math.min(60, focusDuration)),
        break: Math.max(1, Math.min(60, breakDuration))
      });

      // If timer is not running, update the current time to reflect new duration
      if (!isRunning) {
        if (!isBreak) {
          setTimeLeft(focusDuration * 60);
        } else {
          setTimeLeft(breakDuration * 60);
        }
      }

      setShowSettingsModal(false);
      console.log('Modal closed successfully');
    }, 100); // Small delay for audio cleanup
  };

  const handleCycleReset = () => {
    setPomodoroCount(0);
    setBreakType(null);
    setResetFocusNumber(prev => !prev); // Toggle to trigger reset in Timer component
    if (!isRunning) {
      setIsBreak(false);
      setTimeLeft(customDurations.focus * 60);
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskObj = { 
        id: Date.now(), 
        text: newTask, 
        completed: false, 
        pomodoros: 0 
      };
      setTasks([...tasks, newTaskObj]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    // Find the current task before updating
    const task = tasks.find(t => t.id === id);
    
    // Update the tasks
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    
    // If the task being toggled is the active task and it's being marked as completed,
    // remove it from being active
    if (activeTaskId === id && task && !task.completed) {
      // Task is currently not completed but will be after toggle, so deactivate it
      setActiveTaskId(null);
    }
  };

  const deleteTask = (id) => {
    // Add removing class to trigger slide-out animation
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
      taskElement.classList.add('removing');
      // Wait for animation to complete before removing task
      setTimeout(() => {
        setTasks(tasks.filter(task => task.id !== id));
        if (editingTaskId === id) {
          setEditingTaskId(null);
          setEditingText('');
        }
        if (activeTaskId === id) {
          setActiveTaskId(null);
        }
      }, 300);
    } else {
      // Fallback if element not found
      setTasks(tasks.filter(task => task.id !== id));
      if (editingTaskId === id) {
        setEditingTaskId(null);
        setEditingText('');
      }
      if (activeTaskId === id) {
        setActiveTaskId(null);
      }
    }
  };

  const setActiveTask = (id) => {
    setActiveTaskId(activeTaskId === id ? null : id);
  };

  const startEditing = (id, currentText) => {
    setEditingTaskId(id);
    setEditingText(currentText);
  };

  const saveEdit = (id) => {
    if (editingText.trim()) {
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, text: editingText.trim() } : task
      ));
    }
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const handleEditKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't manually set a theme
      if (localStorage.getItem('theme') === null) {
        setIsDarkMode(e.matches);
      }
    };

    // Set initial theme based on system preference if no saved preference
    if (localStorage.getItem('theme') === null) {
      setIsDarkMode(mediaQuery.matches);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save custom durations to localStorage whenever they change (only valid numbers)
  useEffect(() => {
    const focusValue = typeof customDurations.focus === 'number' ? customDurations.focus : 25;
    const breakValue = typeof customDurations.break === 'number' ? customDurations.break : 5;
    localStorage.setItem('pomodoroDurations', JSON.stringify({
      focus: focusValue,
      break: breakValue
    }));
  }, [customDurations]);

  // Preload sounds and handle audio context
  useEffect(() => {
    const preloadSounds = async () => {
      try {
        focusSound.current.load();
        breakSound.current.load();
      } catch (error) {
        console.log('Error preloading sounds:', error);
      }
    };
    preloadSounds();
  }, []);

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Save Pomodoro cycle data to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroCount', pomodoroCount.toString());
  }, [pomodoroCount]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up audio');
      stopAllTestSounds();
    };
  }, [stopAllTestSounds]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSettingsModal) {
        setShowSettingsModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSettingsModal]);

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

  // Fetch a random quote
  const fetchQuote = async () => {
    try {
      const response = await fetch('https://qapi.vercel.app/api/random');
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
        // Store the quote and date in localStorage
        const today = new Date().toDateString();
        localStorage.setItem('dailyQuote', JSON.stringify({
          quote: data,
          date: today
        }));
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Set a default quote in case of error
      const defaultQuote = {
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
      };
      setQuote(defaultQuote);
      // Store the default quote and date in localStorage
      const today = new Date().toDateString();
      localStorage.setItem('dailyQuote', JSON.stringify({
        quote: defaultQuote,
        date: today
      }));
    }
  };

  // Fetch or retrieve today's quote on component mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedQuoteData = localStorage.getItem('dailyQuote');
    
    if (savedQuoteData) {
      const { quote, date } = JSON.parse(savedQuoteData);
      // If we have a quote from today, use it
      if (date === today) {
        setQuote(quote);
        return;
      }
    }
    
    // Otherwise fetch a new quote
    fetchQuote();
  }, []);



  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="main-content">
        <div className="main-grid">
          {/* Timer Section */}
          <Timer
            timeLeft={timeLeft}
            isRunning={isRunning}
            isBreak={isBreak}
            breakType={breakType}
            isDarkMode={isDarkMode}
            handleStart={handleStart}
            handlePause={handlePause}
            handleReset={handleReset}
            handleSkip={handleSkip}
            toggleTheme={toggleTheme}
            setShowSettingsModal={setShowSettingsModal}
            formatTime={formatTime}
            customDurations={customDurations}
            resetFocusNumber={resetFocusNumber}
          />

          {/* Tasks Section */}
          <Tasks
            tasks={tasks}
            newTask={newTask}
            setNewTask={setNewTask}
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            startEditing={startEditing}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            editingTaskId={editingTaskId}
            setEditingText={setEditingText}
            editingText={editingText}
            handleEditKeyPress={handleEditKeyPress}
            activeTaskId={activeTaskId}
            setActiveTask={setActiveTask}
          />
        </div>

        {/* Quote Section */}
        <Quote quote={quote} />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        customDurations={customDurations}
        setCustomDurations={setCustomDurations}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        pomodoroCount={pomodoroCount}
        handleCycleReset={handleCycleReset}
        handleSettingsDone={handleSettingsDone}
        testSound={testSound}
        playingSound={playingSound}
        isRunning={isRunning}
        stopAllTestSounds={stopAllTestSounds}
      />
    </div>
  );
}