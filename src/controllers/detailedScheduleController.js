import DetailedSchedule from "../models/detailedScheduleModel.js";

// ========================================
// 1. CREATE - Add a new detailed schedule
// ========================================
export const createSchedule = async (req, res) => {
  try {
    console.log('Received schedule data:', req.body);
    
    // Validate required fields
    const { project, start_date, end_date, duration } = req.body;
    if (!project || !start_date || !end_date || duration === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project, start_date, end_date, duration'
      });
    }
    
    const newSchedule = new DetailedSchedule(req.body);
    await newSchedule.save();
    res.status(201).json({
      success: true,
      message: "Detailed schedule created successfully",
      schedule: newSchedule,
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 2. READ - Get all schedules
// ========================================
export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await DetailedSchedule.find();
    res.status(200).json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 3. READ - Get schedule by ID
// ========================================
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await DetailedSchedule.findById(req.params.id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });
    res.status(200).json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 4. UPDATE - Update entire schedule
// ========================================
export const updateSchedule = async (req, res) => {
  try {
    const schedule = await DetailedSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });
    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 5. DELETE - Delete schedule
// ========================================
export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await DetailedSchedule.findByIdAndDelete(req.params.id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });
    res.status(200).json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 6. ADD TASK to a schedule
// ========================================
export const addTask = async (req, res) => {
  try {
    const schedule = await DetailedSchedule.findById(req.params.id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });

    schedule.tasks.push(req.body);
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Task added successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 7. UPDATE TASK by task index
// ========================================
export const updateTask = async (req, res) => {
  try {
    const { id, taskIndex } = req.params;
    const schedule = await DetailedSchedule.findById(id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });

    if (taskIndex < 0 || taskIndex >= schedule.tasks.length)
      return res.status(404).json({ success: false, message: "Task not found" });

    schedule.tasks[taskIndex] = { ...schedule.tasks[taskIndex].toObject(), ...req.body };
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 8. DELETE TASK by task index
// ========================================
export const deleteTask = async (req, res) => {
  try {
    const { id, taskIndex } = req.params;
    const schedule = await DetailedSchedule.findById(id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });

    if (taskIndex < 0 || taskIndex >= schedule.tasks.length)
      return res.status(404).json({ success: false, message: "Task not found" });

    schedule.tasks.splice(taskIndex, 1);
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 9. ADD SUBTASK to a task (nested)
// Path: scheduleId/taskIndex/subtaskPath
// Body: { subtask: {...} }
// Example: /schedule/:id/task/0/subtask?path=0.1.2
// ========================================
export const addSubtask = async (req, res) => {
  try {
    const { id, taskIndex } = req.params;
    const { path } = req.query; // e.g., "0.1" means tasks[0].subtasks[0].subtasks[1]

    const schedule = await DetailedSchedule.findById(id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });

    if (taskIndex < 0 || taskIndex >= schedule.tasks.length)
      return res.status(404).json({ success: false, message: "Task not found" });

    let target = schedule.tasks[taskIndex];

    // Navigate to the nested subtask if path is provided
    if (path) {
      const indices = path.split(".").map(Number);
      for (const index of indices) {
        if (!target.subtasks || index < 0 || index >= target.subtasks.length)
          return res.status(404).json({ success: false, message: "Subtask path not found" });
        target = target.subtasks[index];
      }
    }

    if (!target.subtasks) target.subtasks = [];
    target.subtasks.push(req.body);
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Subtask added successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 10. UPDATE SUBTASK (nested)
// Path: scheduleId/taskIndex/subtask/:subtaskIndex?path=...
// ========================================
export const updateSubtask = async (req, res) => {
  try {
    const { id, taskIndex, subtaskIndex } = req.params;
    const { path } = req.query;

    const schedule = await DetailedSchedule.findById(id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });

    if (taskIndex < 0 || taskIndex >= schedule.tasks.length)
      return res.status(404).json({ success: false, message: "Task not found" });

    let target = schedule.tasks[taskIndex];

    // Navigate to the nested subtask if path is provided
    if (path) {
      const indices = path.split(".").map(Number);
      for (const index of indices) {
        if (!target.subtasks || index < 0 || index >= target.subtasks.length)
          return res.status(404).json({ success: false, message: "Subtask path not found" });
        target = target.subtasks[index];
      }
    }

    if (!target.subtasks || subtaskIndex < 0 || subtaskIndex >= target.subtasks.length)
      return res.status(404).json({ success: false, message: "Subtask not found" });

    target.subtasks[subtaskIndex] = {
      ...target.subtasks[subtaskIndex].toObject(),
      ...req.body,
    };
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Subtask updated successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ========================================
// 11. DELETE SUBTASK (nested)
// ========================================
export const deleteSubtask = async (req, res) => {
  try {
    const { id, taskIndex, subtaskIndex } = req.params;
    const { path } = req.query;

    const schedule = await DetailedSchedule.findById(id);
    if (!schedule)
      return res.status(404).json({ success: false, message: "Schedule not found" });

    if (taskIndex < 0 || taskIndex >= schedule.tasks.length)
      return res.status(404).json({ success: false, message: "Task not found" });

    let target = schedule.tasks[taskIndex];

    // Navigate to the nested subtask if path is provided
    if (path) {
      const indices = path.split(".").map(Number);
      for (const index of indices) {
        if (!target.subtasks || index < 0 || index >= target.subtasks.length)
          return res.status(404).json({ success: false, message: "Subtask path not found" });
        target = target.subtasks[index];
      }
    }

    if (!target.subtasks || subtaskIndex < 0 || subtaskIndex >= target.subtasks.length)
      return res.status(404).json({ success: false, message: "Subtask not found" });

    target.subtasks.splice(subtaskIndex, 1);
    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Subtask deleted successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
