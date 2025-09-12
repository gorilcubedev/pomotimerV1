import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Sun, Moon, Settings } from 'lucide-react';

export default function Timer({
  timeLeft,
  isRunning,
  isBreak,
  breakType,
  isDarkMode,
  handleStart,
  handlePause,
  handleReset,
  handleSkip,
  toggleTheme,
  setShowSettingsModal,
  formatTime,
  customDurations,
  resetFocusNumber
}) {
  // Focus number tracks which "Focus" session the user is currently on.
  // We increment focusNumber each time a new focus session starts.
  const [focusNumber, setFocusNumber] = useState(1);
  const prevIsBreakRef = useRef(isBreak);

  useEffect(() => {
    // Reset focusNumber to 1 when cycle is reset
    if (resetFocusNumber) {
      setFocusNumber(1);
    }
  }, [resetFocusNumber]);

  useEffect(() => {
    // Increment focusNumber when transitioning from break to focus
    // This happens when:
    // 1. A pomodoro is completed (naturally or by skipping)
    // 2. A break is skipped
    // 3. Timer is reset during a break (goes back to focus)
    if (prevIsBreakRef.current && !isBreak) {
      setFocusNumber(prev => prev + 1);
    }
    
    prevIsBreakRef.current = isBreak;
  }, [isBreak]);

  const progress = isBreak
    ? (breakType === 'long'
        ? ((15 * 60 - timeLeft) / (15 * 60)) * 100
        : ((customDurations.break * 60 - timeLeft) / (customDurations.break * 60)) * 100
      )
    : ((customDurations.focus * 60 - timeLeft) / (customDurations.focus * 60)) * 100;

  return (
    <div className="card">
      <div className="header">
        <h1>Pomodoro Timer</h1>
        <div className="header-buttons">
          <button onClick={() => setShowSettingsModal(true)} className="settings-toggle">
            <Settings className="theme-icon" />
          </button>
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? <Sun className="theme-icon" /> : <Moon className="theme-icon" />}
          </button>
        </div>
      </div>

      {/* Pomodoro Cycle Display */}
      

      {/* Circular Timer */}
      <div className="timer-container">
        <div className="timer-circle">
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="progress-bg"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`progress-bar ${isBreak ? (breakType === 'long' ? 'long-break' : 'break') : isRunning ? 'focus' : 'paused'}`}
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            />
          </svg>
          
          <div className="timer-display">
            <div className="cycle-display">
        <span className="cycle-number">#{focusNumber}</span>
      </div>
            <div className="timer-time">
              {formatTime(timeLeft)}
            </div>
            <div className={`timer-label ${isBreak ? (breakType === 'long' ? 'long-break' : 'break') : isRunning ? 'focus' : 'paused'}`}>
              {isBreak
                ? (breakType === 'long' ? 'Long Break Time' : 'Break Time')
                : isRunning ? 'Focus Time' : 'Paused'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="controls">
        {!isRunning ? (
          <button onClick={handleStart} className="btn btn-start">
            <Play />
            Start
          </button>
        ) : (
          <button onClick={handlePause} className="btn btn-pause">
            <Pause />
            Pause
          </button>
        )}
        <button onClick={handleSkip} className="btn btn-skip">
          <SkipForward />
          Skip
        </button>
        <button onClick={handleReset} className="btn btn-reset">
          <RotateCcw />
          Reset
        </button>
      </div>
    </div>
  );
}
