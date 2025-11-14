const express = require('express');
const Plant = require('../models/Plant');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Get all plants for user
router.get('/', authenticate, async (req, res) => {
  try {
    const plants = await Plant.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single plant
router.get('/:id', authenticate, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create plant
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type, wateringInterval, imageUrl } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const plant = new Plant({
      userId: req.user._id,
      name,
      type,
      wateringInterval: wateringInterval || 24,
      imageUrl: imageUrl || ''
    });

    await plant.save();
    res.status(201).json(plant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update plant
router.put('/:id', authenticate, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    Object.assign(plant, req.body);
    await plant.save();
    res.json(plant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete plant
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const plant = await Plant.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get plant statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    const stats = {
      totalWaterings: plant.wateringHistory.length,
      averageMoisture: plant.wateringHistory.length > 0
        ? plant.wateringHistory.reduce((sum, h) => sum + (h.soilMoistureAfter || 0), 0) / plant.wateringHistory.length
        : plant.soilMoisture,
      lastWatered: plant.lastWatered,
      wateringHistory: plant.wateringHistory.slice(-30) // Last 30 waterings
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

