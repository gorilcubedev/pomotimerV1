import { useState, useEffect, useCallback } from 'react';

export const useKeyboardShortcuts = (
  isRunning,
  handleStart,
  handlePause,
  handleReset,
  handleSkip,
  soundEnabled,
  setSoundEnabled,
  showToast,
  handleCycleReset
) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter': {
          e.preventDefault();
          if (isRunning) {
            handlePause();
          } else {
            handleStart();
          }
          break;
        }
        case 'r': {
          if (!e.ctrlKey) {
            e.preventDefault();
            handleReset();
          }
          break;
        }
        case 's': {
          e.preventDefault();
          handleSkip();
          break;
        }
         case 'm': {
           e.preventDefault();
           const newSoundEnabled = !soundEnabled;
           setSoundEnabled(newSoundEnabled);
           showToast(
             newSoundEnabled ? 'Sound Unmuted 🔊' : 'Sound Muted 🔇',
             newSoundEnabled ? 'success' : 'warning'
           );
           break;
         }
        case 'f': {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        }
        case 'h': {
          e.preventDefault();
          setShowHelp(!showHelp);
          break;
        }
        case 'n': {
          e.preventDefault();
          // Focus on the task input
          const taskInput = document.querySelector('.task-input');
          if (taskInput) {
            taskInput.focus();
          }
          break;
        }
        default:
          break;
      }

      // Handle Ctrl+R for session reset
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handleCycleReset();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isRunning,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    soundEnabled,
    setSoundEnabled,
    showToast,
    showHelp,
    handleCycleReset
  ]);

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSettingsModal) {
        setShowSettingsModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSettingsModal]);

  return {
    showSettingsModal,
    setShowSettingsModal,
    showHelp,
    setShowHelp
  };
};