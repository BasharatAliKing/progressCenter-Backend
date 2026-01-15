import mongoose from "mongoose";

// Recursive schema for nested subtasks
const SubtaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  start_date: { type: String },
  end_date: { type: String },
});

// Self-reference for unlimited nesting
SubtaskSchema.add({
  subtasks: [SubtaskSchema]
});

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  start_date: { type: String },
  end_date: { type: String },
  subtasks: [SubtaskSchema]
});

const DetailedScheduleSchema = new mongoose.Schema({
  project: { type: String, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  duration: { type: Number, required: true },
  schedulePercentageComplete: { type: Number, default: 0 },
  performancePercentageComplete: { type: Number, default: 0 },
  tasks: [TaskSchema]
}, { timestamps: true });

export default mongoose.model("DetailedSchedule", DetailedScheduleSchema);
