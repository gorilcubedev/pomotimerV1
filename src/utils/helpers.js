// Pure helper functions - no React dependencies

/**
 * Format seconds into MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Import tasks from various file formats
 * @param {File} file - The file to import
 * @param {Function} setTasks - Function to update tasks state
 * @param {Function} showToast - Function to show toast notifications
 */
export const importTasks = (file, setTasks, showToast) => {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      let importedTasks = [];
      const fileContent = e.target.result;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        // JSON import
        const data = JSON.parse(fileContent);

        if (data.tasks && Array.isArray(data.tasks)) {
          importedTasks = data.tasks.map(task => ({
            id: task.id || Date.now() + Math.random(),
            text: task.text || '',
            completed: Boolean(task.completed),
            pomodoros: Number(task.pomodoros) || 0
          }));
        } else {
          throw new Error('Invalid JSON format: missing tasks array');
        }

      } else if (fileName.endsWith('.csv')) {
        // CSV import
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV file must have at least a header row and one data row');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['id', 'text', 'completed', 'pomodoros'];

        // Check if required headers exist (flexible order)
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        importedTasks = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          return {
            id: parseInt(values[headers.indexOf('id')]) || Date.now() + index,
            text: values[headers.indexOf('text')].replace(/^"|"$/g, '').replace(/""/g, '"'),
            completed: values[headers.indexOf('completed')].toLowerCase() === 'yes' || values[headers.indexOf('completed')] === 'true',
            pomodoros: parseInt(values[headers.indexOf('pomodoros')]) || 0
          };
        });

      } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        // Markdown/Text import
        const lines = fileContent.split('\n').filter(line => line.trim());

        importedTasks = lines.map((line, index) => {
          // Match patterns like: - [ ] Task text (🍅🍅) or - [x] Task text (🍅🍅)
          const checkboxMatch = line.match(/^\s*-\s*\[([ x])\]\s*(.+?)(?:\s*\(🍅*(\d*)\))?\s*$/);

          if (checkboxMatch) {
            const [, checked, text, pomodoroCount] = checkboxMatch;
            return {
              id: Date.now() + index,
              text: text.trim(),
              completed: checked === 'x',
              pomodoros: pomodoroCount ? parseInt(pomodoroCount) : 0
            };
          }

          // If no checkbox pattern found, try to extract just the text
          const textMatch = line.match(/^\s*-\s*(.+?)(?:\s*\(🍅*(\d*)\))?\s*$/);
          if (textMatch) {
            const [, text, pomodoroCount] = textMatch;
            return {
              id: Date.now() + index,
              text: text.trim(),
              completed: false,
              pomodoros: pomodoroCount ? parseInt(pomodoroCount) : 0
            };
          }

          return null;
        }).filter(task => task !== null);

        if (importedTasks.length === 0) {
          throw new Error('No valid tasks found in the markdown file. Use format: - [ ] Task text (🍅🍅)');
        }

      } else {
        throw new Error('Unsupported file format. Please use JSON, CSV, or Markdown files.');
      }

      // Validate imported tasks
      const validTasks = importedTasks.filter(task =>
        task.text && task.text.trim().length > 0
      );

      if (validTasks.length === 0) {
        throw new Error('No valid tasks found in the imported file');
      }

      // Handle potential ID conflicts by regenerating IDs for imported tasks
      const tasksWithNewIds = validTasks.map(task => ({
        ...task,
        id: Date.now() + Math.random() * 1000
      }));

      // Merge with existing tasks
      setTasks(prevTasks => [...prevTasks, ...tasksWithNewIds]);

      showToast(`Successfully imported ${validTasks.length} task(s)!`, 'success');

    } catch (error) {
      console.error('Import error:', error);
      showToast('Import failed: ' + error.message, 'error');
    }
  };

  reader.onerror = () => {
    showToast('Failed to read the file', 'error');
  };

  reader.readAsText(file);
};