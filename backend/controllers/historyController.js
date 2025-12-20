const { History } = require('../models/History');
const mongoose = require('mongoose');
const getAllHistory = async (req, res) => {
  try {
    const { historyType, limit = 20, skip = 0, sortBy = '-createdAt' } = req.query;
    const userId = req.user._id;

    console.log('📥 getAllHistory called');
    console.log('   userId:', userId);
    console.log('   historyType:', historyType);
    console.log('   limit:', limit);
    console.log('   skip:', skip);

    // Build filter
    const filter = { userId };
    
    // Handle multiple historyTypes (comma-separated)
    if (historyType) {
      const types = historyType.split(',').map(t => t.trim());
      if (types.length > 1) {
        filter.historyType = { $in: types };
      } else {
        filter.historyType = types[0];
      }
    }

    console.log('🔍 Filter:', JSON.stringify(filter));

    // Query
    const totalCount = await History.countDocuments(filter);
    console.log('📊 Total count:', totalCount);

    const history = await History.find(filter)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .exec();

    console.log(`✅ Found ${history.length} history items`);

    res.json({
      success: true,
      total: totalCount,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('❌ getAllHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message,
    });
  }
};

// @desc    Get a single history item by ID
// @route   GET /api/history/:id
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log('📖 getHistoryById called for:', id);

    const history = await History.findOne({
      _id: id,
      userId,
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found',
      });
    }

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('❌ getHistoryById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history item',
      error: error.message,
    });
  }
};

// @desc    Save a new history item
// @route   POST /api/history
// @body    { historyType, title, sourceFileName?, description?, data, metadata? }
const saveHistory = async (req, res) => {
  try {
    const { historyType, title, sourceFileName, description, data, metadata } = req.body;
    const userId = req.user._id;

    console.log('💾 saveHistory called');
    console.log('   userId:', userId);
    console.log('   historyType:', historyType);
    console.log('   title:', title);

    // Validate historyType
    const allowedTypes = ['summary', 'chat', 'priority_topic', 'note', 'flashcard', 'quiz', 'quizAttempt'];
    if (!allowedTypes.includes(historyType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid historyType. Allowed: ${allowedTypes.join(', ')}`,
      });
    }

    // Validate required fields
    if (!title || !data) {
      return res.status(400).json({
        success: false,
        message: 'title and data are required',
      });
    }

    // Create history item
    const historyItem = new History({
      userId,
      historyType,
      title,
      sourceFileName,
      description,
      data,
      metadata: metadata || {},
    });

    await historyItem.save();

    console.log('✅ History item saved:', historyItem._id);

    res.status(201).json({
      success: true,
      message: 'History item saved successfully',
      data: historyItem,
    });
  } catch (error) {
    console.error('❌ saveHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save history',
      error: error.message,
    });
  }
};

// @desc    Update a history item
// @route   PUT /api/history/:id
// @body    { title?, description?, metadata? }
const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, description, metadata } = req.body;

    console.log('✏️ updateHistory called for:', id);

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (metadata) updateData.metadata = metadata;

    const history = await History.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found',
      });
    }

    console.log('✅ History item updated:', id);

    res.json({
      success: true,
      message: 'History item updated successfully',
      data: history,
    });
  } catch (error) {
    console.error('❌ updateHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update history',
      error: error.message,
    });
  }
};

// @desc    Delete a history item
// @route   DELETE /api/history/:id
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log('🗑️ deleteHistory called for:', id);

    const history = await History.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History item not found',
      });
    }

    console.log('✅ History item deleted:', id);

    res.json({
      success: true,
      message: 'History item deleted successfully',
      data: history,
    });
  } catch (error) {
    console.error('❌ deleteHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history',
      error: error.message,
    });
  }
};

// @desc    Delete all history of a specific type for user
// @route   DELETE /api/history/type/:historyType
const deleteHistoryByType = async (req, res) => {
  try {
    const { historyType } = req.params;
    const userId = req.user._id;

    console.log('🗑️ deleteHistoryByType called for:', historyType);

    const result = await History.deleteMany({
      userId,
      historyType,
    });

    console.log('✅ Deleted', result.deletedCount, 'items');

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} history items`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('❌ deleteHistoryByType error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history',
      error: error.message,
    });
  }
};

// @desc    Get history statistics
// @route   GET /api/history/stats
const getHistoryStats = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('📊 getHistoryStats called for:', userId);

    const stats = await History.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$historyType',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCount = await History.countDocuments({ userId });

    console.log('✅ Stats retrieved:', { totalCount, byType: stats });

    res.json({
      success: true,
      data: {
        totalHistory: totalCount,
        byType: stats,
      },
    });
  } catch (error) {
    console.error('❌ getHistoryStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllHistory,
  getHistoryById,
  saveHistory,
  updateHistory,
  deleteHistory,
  deleteHistoryByType,
  getHistoryStats,
};