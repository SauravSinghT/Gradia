const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStudySets,
  createStudySet,
  addFileToSet,
  deleteStudySet,
  deleteFileFromSet
} = require('../controllers/studySetController');

router.use(protect);

router.get('/', getStudySets);
router.post('/', createStudySet);
router.post('/:id/files', addFileToSet);
router.delete('/:id', deleteStudySet);
router.delete('/:setId/files/:fileId', deleteFileFromSet);

module.exports = router;