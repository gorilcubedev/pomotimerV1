import React from 'react';

export default function ShortcutsBar({ showHelp, shortcuts }) {
  return (
    <div className={`shortcuts-bar ${showHelp ? 'visible' : ''}`}>
      {shortcuts.map(shortcut => (
        <div key={shortcut.key} className="shortcut-item">
          <span className="shortcut-icon">{shortcut.icon}</span>
          <kbd className="shortcut-key">{shortcut.key}</kbd>
          <span className="shortcut-label">{shortcut.label}</span>
        </div>
      ))}
    </div>
  );
}