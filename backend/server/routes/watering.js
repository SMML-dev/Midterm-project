const express = require('express');
const Plant = require('../models/Plant');
const WateringSchedule = require('../models/WateringSchedule');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Start watering
router.post('/start/:plantId', authenticate, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.plantId, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${req.user._id}`).emit('watering-started', {
      plantId: plant._id,
      plantName: plant.name
    });

    res.json({ message: 'Watering started', plant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Stop watering
router.post('/stop/:plantId', authenticate, async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.plantId, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    const { duration = 30 } = req.body; // duration in seconds

    // Update plant after watering
    const moistureBefore = plant.soilMoisture;
    const moistureAfter = Math.min(100, moistureBefore + 20); // Increase moisture

    plant.lastWatered = new Date();
    plant.soilMoisture = moistureAfter;
    plant.wateringHistory.push({
      timestamp: new Date(),
      duration,
      soilMoistureBefore: moistureBefore,
      soilMoistureAfter: moistureAfter
    });

    await plant.save();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${req.user._id}`).emit('watering-stopped', {
      plantId: plant._id,
      plantName: plant.name,
      duration,
      moistureAfter
    });

    res.json({ message: 'Watering stopped', plant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create watering schedule
router.post('/schedule', authenticate, async (req, res) => {
  try {
    const { plantId, startTime, endTime, daysOfWeek } = req.body;

    if (!plantId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Plant ID, start time, and end time are required' });
    }

    const plant = await Plant.findOne({ _id: plantId, userId: req.user._id });
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    const schedule = new WateringSchedule({
      userId: req.user._id,
      plantId,
      startTime,
      endTime,
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6] // All days by default
    });

    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get watering schedules
router.get('/schedule', authenticate, async (req, res) => {
  try {
    const schedules = await WateringSchedule.find({ userId: req.user._id })
      .populate('plantId', 'name type imageUrl');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update watering schedule
router.put('/schedule/:id', authenticate, async (req, res) => {
  try {
    const schedule = await WateringSchedule.findOne({ _id: req.params.id, userId: req.user._id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    Object.assign(schedule, req.body);
    await schedule.save();
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete watering schedule
router.delete('/schedule/:id', authenticate, async (req, res) => {
  try {
    const schedule = await WateringSchedule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

