import mongoose from "mongoose";

const baselineSchema = new mongoose.Schema({
  recovery_programe_comparison: String,
  submission_date: String,
  Approval_date: String,
  planned: String,
  actual: String,
  days_ahead_delay: String
});
const progressSCurveSchema = new mongoose.Schema({
  month:String,
  planned:String,
  actual:String,
});
const engineeringQuantityStatus= new mongoose.Schema({
   status_name:String,
   status_value:String,
})
const engineeringQuantitySchema=new mongoose.Schema({
  kpi_name:String,
  category:String,
  responsibility:String,
  status:[engineeringQuantityStatus]
});
const overAllProgressSchema=new mongoose.Schema({
  progress_name:String,
  progress_planned_thisWeek:String,
  progress_actual_thisWeek:String,
  progress_planned_lastWeek:String,
  progress_actual_lastWeek:String,
});
const topIssuesSchema=new mongoose.Schema({
  issue:String,
  originator:String,
  category:String,
  recommended_action:String,
  actionBy:String,
});
const manPowerHistogramSchema = new mongoose.Schema({
  manpower_month:String,
  manpower_actual:String,
  manpower_planned:String,
});
const mainRisksSchema = new mongoose.Schema({
  risk_description:String,
  risk_category:String,
  risk_impact:String,
  risk_response:String,
});
const progressPhotosSchema = new mongoose.Schema({
  img_name:String,
  img_path:String,
});
//Main Schema
const dailyProgressSchema = new mongoose.Schema({
  employer: String,
  contractor: String,
  project_name: String,
  project_id: String,
  consultant: String,
  date: { type: Date, default: Date.now },
  report_no: String,
  month: String,
  week_no: String,
  elapsed_date: String,
  remaining_days: String,
  commencement_date: String,
  duration: String,
  completion_date: String,
  forcast_completion_date: String,
  eot_granted: Number,
  anticipated_eot: Number,
  contract_value: Number,
  confirmed_variations: Number,
  revised_control_value: Number,
  cumullative_percentage_certified: Number,
  certified_to_date: Number,
  cost_of_changes: Number,

  baseline: [baselineSchema], // multiple baseline objects
  progressSCurve:[progressSCurveSchema], // multiple baseline objects
  engineeringQuantity:[engineeringQuantitySchema], // multiple baseline Objects.
  overall_schedule_performance_percentage:String,
  overall_actual_performance_percentage:String,
  overall_progress_daysAheadDelay:Number,
  overallProgress:[overAllProgressSchema],
  topIssues:[topIssuesSchema],
  manPowerHistogram:[manPowerHistogramSchema],
  mainRisks:[mainRisksSchema],
  progressPhotos:[progressPhotosSchema],
});

const dailyProgress = new  mongoose.model("DailyProgress", dailyProgressSchema);
export default dailyProgress;
