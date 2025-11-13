import express from "express";
import {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  addTask,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
} from "../controllers/detailedScheduleController.js";
import {
  importXERFile,
  previewXERFile,
} from "../controllers/xerImportController.js";
import { xerUpload, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// ========================================
// XER FILE IMPORT
// ========================================
router.post("/schedule/import-xer", xerUpload.single('xerFile'), handleUploadError, importXERFile);     // Import XER file and save to DB
router.post("/schedule/preview-xer", xerUpload.single('xerFile'), handleUploadError, previewXERFile);   // Preview XER file without saving

// Test endpoint - Create sample schedule
router.post("/schedule/test", (req, res) => {
  const sampleData = {
    project: "Test Project from API",
    start_date: "10-Oct-25", 
    end_date: "10-Jun-26", 
    duration: 244,
    tasks: [
      {
        name: "Test Task 1",
        duration: 30,
        start_date: "10-Oct-25",
        end_date: "09-Nov-25",
        subtasks: []
      }
    ]
  };
  
  req.body = sampleData;
  return createSchedule(req, res);
});

// ========================================
// SCHEDULE CRUD
// ========================================
router.post("/schedule", createSchedule);                    // Create new schedule
router.get("/schedule", getAllSchedules);                    // Get all schedules
router.get("/schedule/:id", getScheduleById);                // Get schedule by ID
router.put("/schedule/:id", updateSchedule);                 // Update entire schedule
router.delete("/schedule/:id", deleteSchedule);              // Delete schedule

// ========================================
// TASK CRUD (within a schedule)
// ========================================
router.post("/schedule/:id/task", addTask);                  // Add task to schedule
router.put("/schedule/:id/task/:taskIndex", updateTask);     // Update task by index
router.delete("/schedule/:id/task/:taskIndex", deleteTask);  // Delete task by index

// ========================================
// SUBTASK CRUD (nested within tasks)
// ========================================
// Add subtask: /schedule/:id/task/:taskIndex/subtask?path=0.1
router.post("/schedule/:id/task/:taskIndex/subtask", addSubtask);

// Update subtask: /schedule/:id/task/:taskIndex/subtask/:subtaskIndex?path=0.1
router.put("/schedule/:id/task/:taskIndex/subtask/:subtaskIndex", updateSubtask);

// Delete subtask: /schedule/:id/task/:taskIndex/subtask/:subtaskIndex?path=0.1
router.delete("/schedule/:id/task/:taskIndex/subtask/:subtaskIndex", deleteSubtask);

export default router;
