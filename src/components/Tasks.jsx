 import React, { useState, useRef } from 'react';
import { Plus, Upload } from 'lucide-react';

export default function Tasks({
  tasks,
  newTask,
  setNewTask,
  addTask,
  toggleTask,
  deleteTask,
  startEditing,
  saveEdit,
  cancelEdit,
  editingTaskId,
  setEditingText,
  editingText,
  handleEditKeyPress,
  activeTaskId,
  onImportTasks
}) {




  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalPomodoros = tasks.reduce((sum, task) => sum + task.pomodoros, 0);

  return (
    <div className="card">
      <div className="tasks-header-section">
        <h2 className="tasks-header">Tasks</h2>

       {/* Task Statistics */}
         <div className="task-stats">
           <div className="stat-item">
             <span className="stat-number">{totalTasks}</span>
             <span className="stat-label">Total</span>
           </div>
           <div className="stat-item">
             <span className="stat-number">{completedTasks}</span>
             <span className="stat-label">Completed</span>
           </div>
           <div className="stat-item">
             <span className="stat-number">{totalPomodoros}</span>
             <span className="stat-label">🍅</span>
           </div>
         </div>

          {/* Import Actions */}
           <div className="task-actions-header">
             <div className="import-container">
               <label className="btn btn-import">
                 <Upload size={16} />
                 Import
                 <input
                   type="file"
                   accept=".json,.csv,.md,.txt"
                   onChange={(e) => {
                     const file = e.target.files[0];
                     if (file) {
                       onImportTasks(file);
                     }
                     e.target.value = ''; // Reset input
                   }}
                   style={{ display: 'none' }}
                 />
               </label>
               <div className="import-formats">
                 <span className="import-formats-text">Accepted: JSON, CSV, Markdown (.md/.txt)</span>
                 <div className="import-format-details">
                   <div className="format-header">Expected File Formats:</div>
                   <div className="format-example">
                     <strong>JSON:</strong> <code>{"{tasks: [{id, text, completed, pomodoros}]"}</code>
                   </div>
                   <div className="format-example">
                     <strong>CSV:</strong> <code>ID,Text,Completed,Pomodoros</code>
                   </div>
                   <div className="format-example">
                     <strong>Markdown:</strong> <code>- [ ] Not Completed Task  </code>
                     <code>- [x]  Completed Task </code>
                   </div>
                 </div>
               </div>
            </div>
          </div>
      </div>

      {/* Add Task Input */}
      <div className="task-input-container">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
          className="task-input"
        />
        <button onClick={addTask} className="btn btn-add">
          <Plus />
        </button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="no-tasks">
          No tasks yet. Add your first task!
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''} ${activeTaskId === task.id ? 'active' : ''} newly-added`}
              data-task-id={task.id}
            >
              {editingTaskId !== task.id && (
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => !task.completed && toggleTask(task.id)}
                  className="task-checkbox"
                  disabled={task.completed}
                />
              )}

              {editingTaskId === task.id ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => handleEditKeyPress(e, task.id)}
                  className="task-edit-input"
                  autoFocus
                />
              ) : (
                <div className="task-content">
                  <span className={`task-text ${task.completed ? 'completed' : ''}`}>
                    {task.text}
                  </span>
                  
                </div>
              )}

              <div className="task-actions">
                
                {editingTaskId === task.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="task-emoji-btn save-btn"
                      title="Save"
                    >
                      ✅
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="task-emoji-btn cancel-btn"
                      title="Cancel"
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <>
                    {!task.completed && (
                      <button
                        onClick={() => startEditing(task.id, task.text)}
                        className="task-emoji-btn edit-btn"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="task-emoji-btn delete-btn"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}