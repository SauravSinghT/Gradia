// server.js - FIXED VERSION
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');
const studySetRoutes = require('./routes/studySetRoutes');
const app = express();
const priorityTopicsRoutes = require('./routes/priorityTopicsRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');


// Connect to Database
connectDB();

// CORS Configuration - FIXED
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/roadmaps', roadmapRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/priority-topics', priorityTopicsRoutes);
app.use('/api/studysets', studySetRoutes);
// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running!', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Frontend URL: http://localhost:8080 or http://localhost:5173`);
});
module.exports = app;