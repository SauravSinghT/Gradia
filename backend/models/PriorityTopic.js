const mongoose = require('mongoose');

const priorityTopicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    importance: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium'],
      index: true,
    },
    frequency: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    chapters: {
      type: [String],
      default: [],
    },
    explanation: {
      type: String,
      required: true,
    },
    sourceAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'History',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for efficient queries
priorityTopicSchema.index({ userId: 1, createdAt: -1 });
priorityTopicSchema.index({ userId: 1, importance: 1 });
priorityTopicSchema.index({ userId: 1, name: 1 });

const PriorityTopic = mongoose.model('PriorityTopic', priorityTopicSchema);

module.exports = PriorityTopic;