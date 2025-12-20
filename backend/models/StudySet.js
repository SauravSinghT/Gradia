const mongoose = require('mongoose');

const studySetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  // We store the files inside the set
  files: [{
    fileName: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
    // This stores the Gemini analysis result for this specific file
    analysisData: {
        chapter: String,
        overview: String,
        topics: [{
            name: String,
            explanation: String,
            details: String
        }],
        keyPoints: [String],
        expectedQuestions: [String]
    }
  }]
}, {
  timestamps: true 
});

module.exports = mongoose.model('StudySet', studySetSchema);