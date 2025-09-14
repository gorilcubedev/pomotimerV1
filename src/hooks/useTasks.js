import { useState, useEffect, useCallback } from 'react';

export const useTasks = () => {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);

  const addTask = useCallback(() => {
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
  }, [newTask, tasks]);

  const toggleTask = useCallback((id) => {
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
  }, [tasks, activeTaskId]);

  const deleteTask = useCallback((id) => {
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
  }, [tasks, editingTaskId, activeTaskId]);

  const startEditing = useCallback((id, currentText) => {
    setEditingTaskId(id);
    setEditingText(currentText);
  }, []);

  const saveEdit = useCallback((id) => {
    if (editingText.trim()) {
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, text: editingText.trim() } : task
      ));
    }
    setEditingTaskId(null);
    setEditingText('');
  }, [editingText, tasks]);

  const cancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditingText('');
  }, []);

  const handleEditKeyPress = useCallback((e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
  }, [tasks]);

  return {
    tasks,
    setTasks,
    newTask,
    setNewTask,
    editingTaskId,
    setEditingTaskId,
    editingText,
    setEditingText,
    activeTaskId,
    setActiveTaskId,
    addTask,
    toggleTask,
    deleteTask,
    startEditing,
    saveEdit,
    cancelEdit,
    handleEditKeyPress
  };
};