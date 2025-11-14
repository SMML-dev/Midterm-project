# Roots and Wings - Backend Server

Backend API server for the Roots and Wings agriculture management application.

## Features

- RESTful API for plant management
- User authentication with JWT
- Real-time updates with Socket.io
- MongoDB database integration
- Automatic plant monitoring and notifications

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string:
```env
MONGODB_URI=mongodb://localhost:27017/roots-and-wings
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
```

## Running the Server

### Development Mode
```bash
npm run dev
```
(Uses nodemon for auto-restart on file changes)

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Plants
- `GET /api/plants` - Get all plants (protected)
- `GET /api/plants/:id` - Get single plant (protected)
- `POST /api/plants` - Create plant (protected)
- `PUT /api/plants/:id` - Update plant (protected)
- `DELETE /api/plants/:id` - Delete plant (protected)
- `GET /api/plants/:id/stats` - Get plant statistics (protected)

### Watering
- `POST /api/watering/start/:plantId` - Start watering (protected)
- `POST /api/watering/stop/:plantId` - Stop watering (protected)
- `POST /api/watering/schedule` - Create schedule (protected)
- `GET /api/watering/schedule` - Get schedules (protected)
- `PUT /api/watering/schedule/:id` - Update schedule (protected)
- `DELETE /api/watering/schedule/:id` - Delete schedule (protected)

### Suggestions
- `GET /api/suggestions` - Get all suggestions
- `GET /api/suggestions/category/:category` - Get by category
- `GET /api/suggestions/random` - Get random suggestion

## Real-time Events (Socket.io)

### Client → Server
- `join-user-room` - Join user's notification room

### Server → Client
- `plant-needs-water` - Emitted when plant needs watering
- `watering-started` - Emitted when watering starts
- `watering-stopped` - Emitted when watering stops

## Database Models

### User
- username (unique)
- email (unique)
- password (hashed)
- createdAt

### Plant
- userId (reference)
- name
- type
- isActive
- lastWatered
- wateringInterval
- soilMoisture
- temperature
- humidity
- wateringHistory

### WateringSchedule
- userId (reference)
- plantId (reference)
- startTime
- endTime
- daysOfWeek
- isActive

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)

## CORS

The server is configured to accept requests from any origin. For production, update CORS settings in `server/index.js`.

## Plant Monitoring

The server automatically monitors all active plants every minute and sends notifications when plants need watering based on their watering interval.

