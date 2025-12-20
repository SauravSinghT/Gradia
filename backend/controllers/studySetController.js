const StudySet = require('../models/StudySet');

// @desc    Get all study sets for user
// @route   GET /api/studysets
const getStudySets = async (req, res) => {
  try {
    const sets = await StudySet.find({ userId: req.user._id }).sort('-updatedAt');
    res.json({ success: true, data: sets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new empty study set
// @route   POST /api/studysets
const createStudySet = async (req, res) => {
  try {
    const { title, description } = req.body;
    const newSet = await StudySet.create({
      userId: req.user._id,
      title,
      description,
      files: []
    });
    res.status(201).json({ success: true, data: newSet });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add an analyzed file to a specific set
// @route   POST /api/studysets/:id/files
const addFileToSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileType, analysisData } = req.body;

    const studySet = await StudySet.findOne({ _id: id, userId: req.user._id });

    if (!studySet) {
      return res.status(404).json({ success: false, message: 'Study set not found' });
    }

    // Push new file to array
    studySet.files.push({
      fileName,
      fileType,
      analysisData,
      uploadedAt: new Date()
    });

    await studySet.save();
    res.json({ success: true, data: studySet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a study set
// @route   DELETE /api/studysets/:id
const deleteStudySet = async (req, res) => {
  try {
    const set = await StudySet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!set) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a specific file from a set
// @route   DELETE /api/studysets/:setId/files/:fileId
const deleteFileFromSet = async (req, res) => {
  try {
    const { setId, fileId } = req.params;
    const studySet = await StudySet.findOne({ _id: setId, userId: req.user._id });

    if (!studySet) return res.status(404).json({ success: false, message: 'Set not found' });

    // Filter out the file
    studySet.files = studySet.files.filter(f => f._id.toString() !== fileId);
    await studySet.save();

    res.json({ success: true, data: studySet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudySets,
  createStudySet,
  addFileToSet,
  deleteStudySet,
  deleteFileFromSet
};