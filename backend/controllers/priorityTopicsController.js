// backend/controllers/priorityTopicsController.js
const PriorityTopic = require('../models/PriorityTopic');

// @desc    Get all priority topics for a user
// @route   GET /api/priority-topics
// @desc    Save all topics from an analysis
// @route   POST /api/priority-topics/save-all
// @body    { analysisId, topics: [{ name, importance, frequency, chapters, explanation }] }
const getPriorityTopics = async (req, res) => {
  try {
    const userId = req.user._id;
    const topics = await PriorityTopic.find({ userId }).sort('-createdAt');
    res.json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error('❌ getPriorityTopics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch priority topics',
      error: error.message,
    });
  }
};
const saveAllTopics = async (req, res) => {
  try {
    const { analysisId, topics } = req.body;
    const userId = req.user._id;

    console.log('💾 saveAllTopics called for analysis:', analysisId);

    // Validate required fields
    if (!analysisId || !topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        message: 'analysisId and topics array are required',
      });
    }

    // Create topics array
    const savedTopics = [];
    for (const topic of topics) {
      // Check for duplicate
      const existing = await PriorityTopic.findOne({
        userId,
        name: topic.name,
      });
      if (existing) continue; // Skip duplicates

      const newTopic = new PriorityTopic({
        userId,
        name: topic.name,
        importance: topic.importance,
        frequency: topic.frequency,
        chapters: topic.chapters || [],
        explanation: topic.explanation,
        sourceAnalysisId: analysisId,
      });
      await newTopic.save();
      savedTopics.push(newTopic);
    }

    console.log(`✅ Saved ${savedTopics.length} topics`);

    res.status(201).json({
      success: true,
      message: `Saved ${savedTopics.length} topics`,
      data: savedTopics,
    });
  } catch (error) {
    console.error('❌ saveAllTopics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save topics',
      error: error.message,
    });
  }
};


// @desc    Save a new priority topic
// @route   POST /api/priority-topics
// @body    { topic, importance, frequency, chapters, explanation, sourceAnalysisId? }
const savePriorityTopic = async (req, res) => {
  try {
    const { topic, importance, frequency, chapters, explanation, sourceAnalysisId } = req.body;
    const userId = req.user._id;

    console.log('💾 savePriorityTopic called');
    console.log('   userId:', userId);
    console.log('   topic:', topic);
    console.log('   importance:', importance);

    // Validate required fields
    if (!topic || !importance || frequency === undefined) {
      return res.status(400).json({
        success: false,
        message: 'topic, importance, and frequency are required',
      });
    }

    // Validate importance
    const allowedImportance = ['critical', 'high', 'medium'];
    if (!allowedImportance.includes(importance)) {
      return res.status(400).json({
        success: false,
        message: `Invalid importance. Allowed: ${allowedImportance.join(', ')}`,
      });
    }

    // Check for duplicate topic for this user
    const existingTopic = await PriorityTopic.findOne({
      userId,
      name: topic,
    });

    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: 'You have already saved this topic',
      });
    }

    // Create priority topic
    const priorityTopic = new PriorityTopic({
      userId,
      name: topic,
      importance,
      frequency,
      chapters: chapters || [],
      explanation,
      sourceAnalysisId,
    });

    await priorityTopic.save();

    console.log('✅ Priority topic saved:', priorityTopic._id);

    res.status(201).json({
      success: true,
      message: 'Topic saved successfully',
      data: priorityTopic,
    });
  } catch (error) {
    console.error('❌ savePriorityTopic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save priority topic',
      error: error.message,
    });
  }
};

// @desc    Update a priority topic
// @route   PUT /api/priority-topics/:id
// @body    { importance?, frequency?, chapters?, explanation? }
const updatePriorityTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { importance, frequency, chapters, explanation } = req.body;

    console.log('✏️ updatePriorityTopic called for:', id);

    const updateData = {};
    if (importance) updateData.importance = importance;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (chapters) updateData.chapters = chapters;
    if (explanation) updateData.explanation = explanation;

    const topic = await PriorityTopic.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Priority topic not found',
      });
    }

    console.log('✅ Priority topic updated:', id);

    res.json({
      success: true,
      message: 'Topic updated successfully',
      data: topic,
    });
  } catch (error) {
    console.error('❌ updatePriorityTopic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update priority topic',
      error: error.message,
    });
  }
};

// @desc    Delete a priority topic
// @route   DELETE /api/priority-topics/:id
const deletePriorityTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log('🗑️ deletePriorityTopic called for:', id);

    const topic = await PriorityTopic.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Priority topic not found',
      });
    }

    console.log('✅ Priority topic deleted:', id);

    res.json({
      success: true,
      message: 'Topic deleted successfully',
      data: topic,
    });
  } catch (error) {
    console.error('❌ deletePriorityTopic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete priority topic',
      error: error.message,
    });
  }
};

module.exports = {

  getPriorityTopics,
  savePriorityTopic,
  updatePriorityTopic,
  deletePriorityTopic,
};