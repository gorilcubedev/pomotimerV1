import React from 'react';
import { Timer, Tasks, SettingsModal, Quote, ShortcutsBar, ToastNotification } from './components';

// Import custom hooks
import { useTimer } from './hooks/useTimer';
import { useAudio } from './hooks/useAudio';
import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSettings } from './hooks/useSettings';

// Import helpers
import { formatTime, importTasks } from './utils/helpers';

export default function App() {
  // Use custom hooks
  const { customDurations, setCustomDurations } = useLocalStorage();
  const audioData = useAudio();
  const tasksData = useTasks();
  const themeData = useTheme();
  const toastData = useToast();

  const {
    soundEnabled,
    setSoundEnabled,
    playingSound,
    focusSound,
    breakSound,
    playSound,
    stopAllTestSounds,
    testSound
  } = audioData;

  const {
    tasks,
    setTasks,
    newTask,
    setNewTask,
    editingTaskId,
    setEditingText,
    editingText,
    activeTaskId,
    addTask,
    toggleTask,
    deleteTask,
    startEditing,
    saveEdit,
    cancelEdit,
    handleEditKeyPress
  } = tasksData;

  const { isDarkMode, toggleTheme } = themeData;
  const { toast, showToast } = toastData;

  // Dependencies for timer hook
  const timerDependencies = {
    activeTaskId,
    tasks,
    setTasks,
    playSound,
    focusSound,
    breakSound
  };

  const timerData = useTimer(customDurations, timerDependencies);

  const {
    timeLeft,
    isRunning,
    isBreak,
    breakType,
    resetFocusNumber,
    isResetting,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    handleCycleReset
  } = timerData;



  const keyboardData = useKeyboardShortcuts(
    isRunning,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    soundEnabled,
    setSoundEnabled,
    showToast,
    handleCycleReset
  );

  const { showSettingsModal, setShowSettingsModal, showHelp } = keyboardData;

  const settingsData = useSettings(
    customDurations,
    setCustomDurations,
    playingSound,
    stopAllTestSounds,
    setShowSettingsModal,
    isRunning,
    isBreak,
    timerData.setTimeLeft
  );

  const { handleSettingsDone } = settingsData;

  // Handle import tasks with proper callbacks
  const handleImportTasks = (file) => {
    importTasks(file, setTasks, showToast);
  };

  const shortcuts = [
    { key: 'Space/Enter', icon: '▶️', label: 'Start/Pause' },
    { key: 'R', icon: '🔄', label: 'Reset' },
    { key: 'S', icon: '⏭️', label: 'Skip Phase' },
    { key: 'M', icon: '🔇', label: 'Mute' },
    { key: 'F', icon: '⛶', label: 'Fullscreen' },
    { key: 'H', icon: '❓', label: 'Toggle Help' },
    { key: 'N', icon: '📝', label: 'Add Task' },
    { key: 'Ctrl+R', icon: '🔢', label: 'Reset Session' }
  ];

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <ShortcutsBar showHelp={showHelp} shortcuts={shortcuts} />
      <div className="main-content">
        <div className="main-grid">
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
            isResetting={isResetting}
            handleCycleReset={handleCycleReset}
          />

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
            onImportTasks={handleImportTasks}
          />

          <Quote />
        </div>
      </div>

      <SettingsModal
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        customDurations={customDurations}
        setCustomDurations={setCustomDurations}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        handleCycleReset={handleCycleReset}
        handleSettingsDone={handleSettingsDone}
        testSound={testSound}
        playingSound={playingSound}
        isRunning={isRunning}
        stopAllTestSounds={stopAllTestSounds}
      />

      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
}