const mongoose = require('mongoose');

// New Schema for Quiz Reports
const quizReportSchema = new mongoose.Schema({
  score: Number,
  total: Number,
  strongAreas: [String],
  weakAreas: [String],
  summary: String,
  takenAt: { 
    type: Date, 
    default: Date.now 
  }
});

const taskSchema = new mongoose.Schema({
  id: String,
  title: String,
  completed: { type: Boolean, default: false },
  explanation: String,
  youtube_query: String,
  code_snippet: String,
  exercise: String
});

const milestoneSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  week: Number,
  completed: { type: Boolean, default: false },
  tasks: [taskSchema],
  quizReports: [quizReportSchema] // <--- ADD THIS LINE
});

const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  career: { type: String, required: true },
  timeline: { type: String, required: true },
  totalProgress: { type: Number, default: 0 },
  milestones: [milestoneSchema]
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);