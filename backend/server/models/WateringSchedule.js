const mongoose = require('mongoose');

const wateringScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true
  },
  startTime: {
    type: String, // HH:mm format
    required: true
  },
  endTime: {
    type: String, // HH:mm format
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  daysOfWeek: [{
    type: Number, // 0 = Sunday, 1 = Monday, etc.
    min: 0,
    max: 6
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WateringSchedule', wateringScheduleSchema);

