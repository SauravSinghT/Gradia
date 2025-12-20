// backend/models/History.js
const mongoose = require('mongoose');

// Base History Schema
const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    historyType: {
      type: String,
      required: true,
      enum: ['summary', 'chat', 'prioritytopic', 'note', 'flashcard', 'quiz', 'quizAttempt'],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    sourceFileName: String,
    description: String,
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'historyType',
  }
);

// Create base model
const History = mongoose.model('History', historySchema);

// ==================== DISCRIMINATORS ====================

// SUMMARY History
const summaryHistorySchema = new mongoose.Schema({
  data: {
    chapter: String,
    overview: String,
    topics: [
      {
        name: String,
        explanation: String,
        details: String,
      },
    ],
    keyPoints: [String],
    expectedQuestions: [String],
  },
  metadata: {
    fileSize: Number,
    pageCount: Number,
    processingTime: Number,
  },
});

const SummaryHistory = History.discriminator('summary', summaryHistorySchema);

// CHAT History
const chatHistorySchema = new mongoose.Schema({
  data: {
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
        },
        content: String,
        timestamp: Date,
      },
    ],
    totalMessages: Number,
  },
  metadata: {
    chatDuration: Number,
    topic: String,
  },
});

const ChatHistory = History.discriminator('chat', chatHistorySchema);

// PRIORITY TOPIC History
const priorityTopicHistorySchema = new mongoose.Schema({
  data: {
    topics: [
      {
        topic: String,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low'],
        },
        reason: String,
        resources: [String],
      },
    ],
    analysisDate: Date,
  },
  metadata: {
    subject: String,
    totalTopics: Number,
  },
});

const PriorityTopicHistory = History.discriminator('priority_topic', priorityTopicHistorySchema);

// NOTE History
const noteHistorySchema = new mongoose.Schema({
  data: {
    content: String,
    format: {
      type: String,
      enum: ['text', 'markdown', 'html'],
      default: 'markdown',
    },
  },
  metadata: {
    wordCount: Number,
    tags: [String],
  },
});

const NoteHistory = History.discriminator('note', noteHistorySchema);

// FLASHCARD History
const flashcardHistorySchema = new mongoose.Schema({
  data: {
    cards: [
      {
        question: String,
        answer: String,
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
        },
      },
    ],
  },
  metadata: {
    subject: String,
    totalCards: Number,
    reviewCount: Number,
  },
});

const FlashcardHistory = History.discriminator('flashcard', flashcardHistorySchema);

// QUIZ History (Generated quizzes)
const quizHistorySchema = new mongoose.Schema({
  data: {
    id: String,
    name: String,
    topic: String,
    questions: [
      {
        id: String,
        question: String,
        options: [String],
        correctAnswer: Number,
      },
    ],
    completed: Boolean,
    score: Number,
  },
  metadata: {
    questionCount: Number,
  },
});

const QuizHistory = History.discriminator('quiz', quizHistorySchema);

// QUIZ ATTEMPT History (Completed quiz attempts with scores)
const quizAttemptHistorySchema = new mongoose.Schema({
  data: {
    id: String,
    name: String,
    topic: String,
    questions: [
      {
        id: String,
        question: String,
        options: [String],
        correctAnswer: Number,
        userAnswer: Number,
      },
    ],
    completed: Boolean,
    score: Number,
  },
  metadata: {
    questionCount: Number,
    score: Number,
    correctAnswers: Number,
  },
});

const QuizAttemptHistory = History.discriminator('quizAttempt', quizAttemptHistorySchema);

module.exports = {
  History,
  SummaryHistory,
  ChatHistory,
  PriorityTopicHistory,
  NoteHistory,
  FlashcardHistory,
  QuizHistory,
  QuizAttemptHistory,
};
