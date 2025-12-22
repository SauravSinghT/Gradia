const Roadmap = require('../models/Roadmap');

// @desc    Save a new roadmap
// @route   POST /api/roadmaps
const saveRoadmap = async (req, res) => {
  try {
    const { career, timeline, milestones, totalProgress } = req.body;

    const roadmap = new Roadmap({
      user: req.user._id, // Comes from authMiddleware
      career,
      timeline,
      milestones,
      totalProgress
    });

    const createdRoadmap = await roadmap.save();
    res.status(201).json(createdRoadmap);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save roadmap', error: error.message });
  }
};

// @desc    Get all roadmaps for logged in user
// @route   GET /api/roadmaps
const getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(roadmaps);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roadmaps', error: error.message });
  }
};

// @desc    Update roadmap progress (general task completion)
// @route   PUT /api/roadmaps/:id
const updateRoadmap = async (req, res) => {
  try {
    const { milestones, totalProgress } = req.body;
    const roadmap = await Roadmap.findById(req.params.id);

    if (roadmap && roadmap.user.toString() === req.user._id.toString()) {
      roadmap.milestones = milestones || roadmap.milestones;
      roadmap.totalProgress = totalProgress !== undefined ? totalProgress : roadmap.totalProgress;
      
      const updatedRoadmap = await roadmap.save();
      res.json(updatedRoadmap);
    } else {
      res.status(404).json({ message: 'Roadmap not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// @desc    Delete a roadmap
// @route   DELETE /api/roadmaps/:id
const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (roadmap && roadmap.user.toString() === req.user._id.toString()) {
      await roadmap.deleteOne();
      res.json({ message: 'Roadmap removed' });
    } else {
      res.status(404).json({ message: 'Roadmap not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

// @desc    Save a quiz report to a specific milestone
// @route   POST /api/roadmaps/:roadmapId/milestones/:milestoneId/quiz
const saveQuizReport = async (req, res) => {
  try {
    const { roadmapId, milestoneId } = req.params;
    const { score, total, strongAreas, weakAreas, summary } = req.body;

    // 1. Find Roadmap
    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    // 2. Find Milestone
    const milestone = roadmap.milestones.find(m => m.id === milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    // 3. Add Report
    const newReport = {
      score,
      total,
      strongAreas,
      weakAreas,
      summary,
      takenAt: new Date()
    };

    if (!milestone.quizReports) milestone.quizReports = [];
    milestone.quizReports.push(newReport);

    // --- PROGRESS LOGIC START ---
    
    // A. Check if user passed (e.g., > 60% score)
    const percentage = (score / total) * 100;
    const isPass = percentage >= 60;

    if (isPass) {
      // 1. Mark Milestone as Completed
      milestone.completed = true;

      // 2. (Optional) Mark all tasks inside this milestone as completed
      // This ensures the "Tasks" view stays consistent with the "Quiz" view
      if (milestone.tasks) {
        milestone.tasks.forEach(task => task.completed = true);
      }
    }

    // B. Recalculate Global Roadmap Progress
    // Logic: (Completed Milestones / Total Milestones) * 100
    const totalMilestones = roadmap.milestones.length;
    const completedMilestones = roadmap.milestones.filter(m => m.completed).length;
    
    roadmap.totalProgress = totalMilestones === 0 
      ? 0 
      : Math.round((completedMilestones / totalMilestones) * 100);

    // --- PROGRESS LOGIC END ---

    await roadmap.save();

    res.status(201).json({
      report: newReport,
      newTotalProgress: roadmap.totalProgress,
      milestoneCompleted: milestone.completed
    });

  } catch (error) {
    console.error("Save Quiz Error:", error);
    res.status(500).json({ message: 'Failed to save quiz report', error: error.message });
  }
};

module.exports = { 
  saveRoadmap, 
  getRoadmaps, 
  updateRoadmap, 
  deleteRoadmap,
  saveQuizReport // <--- Exporting the new function
};