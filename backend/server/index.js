const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const plantRoutes = require('./routes/plants');
const wateringRoutes = require('./routes/watering');
const suggestionRoutes = require('./routes/suggestions');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roots-and-wings';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/watering', wateringRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Plant monitoring loop - check watering needs every minute
setInterval(async () => {
  try {
    const Plant = require('./models/Plant');
    const WateringSchedule = require('./models/WateringSchedule');
    const plants = await Plant.find({ isActive: true }).populate('userId');
    
    for (const plant of plants) {
      const now = new Date();
      const lastWatered = new Date(plant.lastWatered);
      const hoursSinceWatering = (now - lastWatered) / (1000 * 60 * 60);
      
      // Check if plant needs water (based on watering interval)
      if (hoursSinceWatering >= plant.wateringInterval) {
        // Emit notification to user
        io.to(`user-${plant.userId._id}`).emit('plant-needs-water', {
          plantId: plant._id,
          plantName: plant.name,
          plantType: plant.type,
          hoursSinceWatering: Math.floor(hoursSinceWatering)
        });
      }
    }

    // Check and execute watering schedules
    const schedules = await WateringSchedule.find({ isActive: true }).populate('plantId');
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    for (const schedule of schedules) {
      if (!schedule.plantId || !schedule.plantId.isActive) continue;

      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      // Check if today is in the schedule's days
      if (schedule.daysOfWeek.includes(currentDay)) {
        // Check if current time is within watering window
        if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes) {
          // Check if we haven't watered recently (within last hour)
          const plant = await Plant.findById(schedule.plantId._id || schedule.plantId);
          if (plant) {
            const lastWatered = new Date(plant.lastWatered);
            const minutesSinceWatering = (now - lastWatered) / (1000 * 60);
            
            // Only water if it's been at least 60 minutes since last watering
            if (minutesSinceWatering >= 60) {
              // Auto-water the plant
              const moistureBefore = plant.soilMoisture;
              const moistureAfter = Math.min(100, moistureBefore + 15);
              
              plant.lastWatered = now;
              plant.soilMoisture = moistureAfter;
              plant.wateringHistory.push({
                timestamp: now,
                duration: (endTimeMinutes - startTimeMinutes) * 60, // duration in seconds
                soilMoistureBefore: moistureBefore,
                soilMoistureAfter: moistureAfter
              });
              
              await plant.save();

              // Notify user
              const userId = schedule.userId._id || schedule.userId;
              io.to(`user-${userId}`).emit('schedule-watering-completed', {
                scheduleId: schedule._id,
                plantId: plant._id,
                plantName: plant.name,
                duration: (endTimeMinutes - startTimeMinutes) * 60
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in plant monitoring:', error);
  }
}, 60000); // Check every minute

module.exports = { app, io };

