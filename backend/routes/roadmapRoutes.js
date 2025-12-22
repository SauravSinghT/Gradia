const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  saveRoadmap, 
  getRoadmaps, 
  updateRoadmap, 
  deleteRoadmap,
  saveQuizReport // Import the new controller
} = require('../controllers/roadmapController');

router.route('/')
  .post(protect, saveRoadmap)
  .get(protect, getRoadmaps);

router.route('/:id')
  .put(protect, updateRoadmap)
  .delete(protect, deleteRoadmap);

// NEW ROUTE for saving quiz reports
router.route('/:roadmapId/milestones/:milestoneId/quiz')
  .post(protect, saveQuizReport);

module.exports = router;