// backend/routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllHistory,
  getHistoryById,
  saveHistory,
  updateHistory,
  deleteHistory,
  deleteHistoryByType,
  getHistoryStats,
} = require('../controllers/historyController');

// All routes are protected (require JWT)
router.use(protect);

// GET routes
router.get('/', getAllHistory);
router.get('/stats', getHistoryStats);
router.get('/:id', getHistoryById);

// POST route
router.post('/', saveHistory);

// PUT route
router.put('/:id', updateHistory);

// DELETE routes
router.delete('/:id', deleteHistory);
router.delete('/type/:historyType', deleteHistoryByType);

module.exports = router;
