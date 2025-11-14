const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Tomato', 'Lettuce', 'Basil', 'Pepper', 'Cucumber', 'Strawberry', 'Herbs', 'Other']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastWatered: {
    type: Date,
    default: Date.now
  },
  wateringInterval: {
    type: Number,
    default: 24, // hours
    min: 1,
    max: 168
  },
  soilMoisture: {
    type: Number,
    default: 50, // percentage
    min: 0,
    max: 100
  },
  temperature: {
    type: Number,
    default: 22, // celsius
    min: 0,
    max: 50
  },
  humidity: {
    type: Number,
    default: 60, // percentage
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  wateringHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // seconds
      default: 0
    },
    soilMoistureBefore: Number,
    soilMoistureAfter: Number
  }]
});

module.exports = mongoose.model('Plant', plantSchema);

