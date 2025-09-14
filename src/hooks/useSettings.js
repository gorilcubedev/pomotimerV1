import { useCallback } from 'react';

export const useSettings = (
  customDurations,
  setCustomDurations,
  playingSound,
  stopAllTestSounds,
  setShowSettingsModal,
  isRunning,
  isBreak,
  setTimeLeft
) => {

  const handleSettingsDone = useCallback(() => {
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
    }, 100);
  }, [
    customDurations,
    setCustomDurations,
    playingSound,
    stopAllTestSounds,
    setShowSettingsModal,
    isRunning,
    isBreak,
    setTimeLeft
  ]);

  return {
    handleSettingsDone
  };
};