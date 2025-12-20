const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPriorityTopics,
  savePriorityTopic,
  deletePriorityTopic,
  updatePriorityTopic,
} = require('../controllers/priorityTopicsController');

// All routes are protected (require JWT)
router.use(protect);
// router.post('/save-all', saveAllTopics);
// GET all priority topics for user
router.get('/', getPriorityTopics);

// POST new priority topic
router.post('/', savePriorityTopic);

// PUT update priority topic
router.put('/:id', updatePriorityTopic);

// DELETE priority topic
router.delete('/:id', deletePriorityTopic);

module.exports = router;