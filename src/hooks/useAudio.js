import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudio = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [playingSound, setPlayingSound] = useState(null);

  const focusSound = useRef(new Audio('/focus-complete.mp3'));
  const breakSound = useRef(new Audio('/break-complete.mp3'));

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up audio');
      stopAllTestSounds();
    };
  }, [stopAllTestSounds]);

  return {
    soundEnabled,
    setSoundEnabled,
    playingSound,
    focusSound,
    breakSound,
    playSound,
    stopAllTestSounds,
    testSound
  };
};