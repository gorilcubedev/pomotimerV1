import React from 'react';
import { X } from 'lucide-react';

export default function SettingsModal({
  showSettingsModal,
  setShowSettingsModal,
  customDurations,
  setCustomDurations,
  soundEnabled,
  setSoundEnabled,
  handleCycleReset,
  handleSettingsDone,
  testSound,
  playingSound,
  isRunning,
  stopAllTestSounds
}) {
  return (
    showSettingsModal && (
      <div className="modal-backdrop" onClick={() => {
        stopAllTestSounds();
        setShowSettingsModal(false);
      }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Timer Settings</h2>
              <button onClick={() => {
                stopAllTestSounds();
                setShowSettingsModal(false);
              }} className="modal-close">
                <X size={20} />
              </button>
            </div>
          <div className="modal-body">
            <div className="duration-controls">
              <div className="form-group">
                <label className="form-label">Focus Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customDurations.focus}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCustomDurations(prev => ({ ...prev, focus: '' }));
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue)) {
                        setCustomDurations(prev => ({
                          ...prev,
                          focus: Math.max(1, Math.min(60, numValue))
                        }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setCustomDurations(prev => ({
                        ...prev,
                        focus: Math.max(1, Math.min(60, prev.focus || 25))
                      }));
                    }
                  }}
                  className="form-input"
                  disabled={isRunning}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Break Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customDurations.break}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCustomDurations(prev => ({ ...prev, break: '' }));
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue)) {
                        setCustomDurations(prev => ({
                          ...prev,
                          break: Math.max(1, Math.min(60, numValue))
                        }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value, 10))) {
                      setCustomDurations(prev => ({
                        ...prev,
                        break: Math.max(1, Math.min(60, prev.break || 5))
                      }));
                    }
                  }}
                  className="form-input"
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Sound Settings */}
            <div className="form-group" style={{marginTop: '1rem'}} >
              <label className="form-label sound-toggle">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                Enable Sound Notifications
              </label>
            </div>
            <div className="modal-actions" style={{justifyContent: 'center', marginTop: '1rem'}}>
              <button onClick={handleSettingsDone} className="btn btn-secondary">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
}