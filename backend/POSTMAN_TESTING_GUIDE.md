# Postman Testing Guide for Roots and Wings Backend

This guide will help you test all the backend API endpoints using Postman.

## Prerequisites

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   You should see: `Server running on port 3000`

2. **Install Postman**
   - Download from [postman.com](https://www.postman.com/downloads/)
   - Or use the web version

3. **Import the Collection**
   - Open Postman
   - Click "Import" button
   - Select `Postman_Collection.json` from the `backend/` folder
   - The collection will be imported with all endpoints

## Setting Up Environment Variables

1. In Postman, click on "Environments" in the left sidebar
2. Click "Create Environment" or use the default "My Environment"
3. Add these variables:
   - `baseUrl`: `http://localhost:3000`
   - `authToken`: (will be auto-filled after login)
   - `userId`: (will be auto-filled after login)
   - `plantId`: (will be auto-filled after creating a plant)
   - `scheduleId`: (will be auto-filled after creating a schedule)

4. Select the environment from the dropdown in the top right

## Testing Flow

### Step 1: Authentication

#### 1.1 Register a New User
- **Endpoint**: `POST /api/auth/register`
- **Body** (JSON):
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**: 201 Created
- **Response Body**: Contains `token` and `user` object
- **Note**: The token is automatically saved to `authToken` variable

#### 1.2 Login User
- **Endpoint**: `POST /api/auth/login`
- **Body** (JSON):
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Expected Response**: 200 OK
- **Response Body**: Contains `token` and `user` object

#### 1.3 Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK
- **Response Body**: Current user information

### Step 2: Plant Management

#### 2.1 Get All Plants
- **Endpoint**: `GET /api/plants`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK
- **Response Body**: Array of plants (empty initially)

#### 2.2 Create a Plant
- **Endpoint**: `POST /api/plants`
- **Headers**: 
  - `Authorization: Bearer {{authToken}}`
  - `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "name": "Tomato Plant 1",
    "type": "Tomato",
    "wateringInterval": 24
  }
  ```
- **Expected Response**: 201 Created
- **Response Body**: Created plant object with `_id`
- **Note**: The `plantId` is automatically saved to the variable

#### 2.3 Get Single Plant
- **Endpoint**: `GET /api/plants/{{plantId}}`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK
- **Response Body**: Plant object

#### 2.4 Update Plant
- **Endpoint**: `PUT /api/plants/{{plantId}}`
- **Headers**: 
  - `Authorization: Bearer {{authToken}}`
  - `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "name": "Updated Tomato Plant",
    "soilMoisture": 65,
    "temperature": 23
  }
  ```
- **Expected Response**: 200 OK
- **Response Body**: Updated plant object

#### 2.5 Get Plant Statistics
- **Endpoint**: `GET /api/plants/{{plantId}}/stats`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK
- **Response Body**: Statistics object with watering history

#### 2.6 Delete Plant
- **Endpoint**: `DELETE /api/plants/{{plantId}}`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK

### Step 3: Watering Controls

#### 3.1 Start Watering
- **Endpoint**: `POST /api/watering/start/{{plantId}}`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK
- **Response Body**: Success message and plant object

#### 3.2 Stop Watering
- **Endpoint**: `POST /api/watering/stop/{{plantId}}`
- **Headers**: 
  - `Authorization: Bearer {{authToken}}`
  - `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "duration": 30
  }
  ```
- **Expected Response**: 200 OK
- **Response Body**: Updated plant with new moisture level

### Step 4: Watering Schedules

#### 4.1 Create Schedule
- **Endpoint**: `POST /api/watering/schedule`
- **Headers**: 
  - `Authorization: Bearer {{authToken}}`
  - `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "plantId": "{{plantId}}",
    "startTime": "08:00",
    "endTime": "08:30",
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6]
  }
  ```
- **Expected Response**: 201 Created
- **Response Body**: Created schedule object
- **Note**: `scheduleId` is automatically saved

#### 4.2 Get All Schedules
- **Endpoint**: `GET /api/watering/schedule`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK
- **Response Body**: Array of schedules

#### 4.3 Update Schedule
- **Endpoint**: `PUT /api/watering/schedule/{{scheduleId}}`
- **Headers**: 
  - `Authorization: Bearer {{authToken}}`
  - `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "startTime": "09:00",
    "endTime": "09:30",
    "isActive": true
  }
  ```
- **Expected Response**: 200 OK

#### 4.4 Delete Schedule
- **Endpoint**: `DELETE /api/watering/schedule/{{scheduleId}}`
- **Headers**: `Authorization: Bearer {{authToken}}`
- **Expected Response**: 200 OK

### Step 5: Suggestions (Public Endpoints)

#### 5.1 Get All Suggestions
- **Endpoint**: `GET /api/suggestions`
- **Headers**: None required
- **Expected Response**: 200 OK
- **Response Body**: Array of all suggestions

#### 5.2 Get by Category
- **Endpoint**: `GET /api/suggestions/category/Watering`
- **Headers**: None required
- **Expected Response**: 200 OK
- **Response Body**: Array of suggestions in that category
- **Available Categories**: Watering, Monitoring, Environment, Planting, Seasonal, Troubleshooting, Nutrition

#### 5.3 Get Random Suggestion
- **Endpoint**: `GET /api/suggestions/random`
- **Headers**: None required
- **Expected Response**: 200 OK
- **Response Body**: Single random suggestion object

## Testing Tips

1. **Use the Collection Runner**: 
   - Click on the collection name
   - Click "Run" to execute all requests in sequence
   - The collection is ordered correctly (auth → plants → watering → suggestions)

2. **Check Environment Variables**:
   - After login/register, check that `authToken` is set
   - After creating a plant, check that `plantId` is set
   - You can view variables in the environment panel

3. **Error Testing**:
   - Try registering with an existing email (should get 400 error)
   - Try accessing protected routes without token (should get 401 error)
   - Try accessing another user's plant (should get 404 error)

4. **Response Validation**:
   - Check status codes match expected values
   - Verify response structure matches API documentation
   - Check that data is persisted (create, then get to verify)

## Common Issues

### 401 Unauthorized
- **Cause**: Missing or invalid token
- **Solution**: Make sure you've logged in and `authToken` is set

### 404 Not Found
- **Cause**: Invalid plant ID or plant doesn't belong to user
- **Solution**: Create a new plant and use its ID

### 500 Internal Server Error
- **Cause**: Server error or MongoDB connection issue
- **Solution**: Check server logs and MongoDB connection

### Connection Refused
- **Cause**: Backend server is not running
- **Solution**: Start the server with `npm start` in the backend directory

## Expected Response Examples

### Register Response (201)
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### Plant Response (201)
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "name": "Tomato Plant 1",
  "type": "Tomato",
  "isActive": true,
  "lastWatered": "2024-01-01T00:00:00.000Z",
  "wateringInterval": 24,
  "soilMoisture": 50,
  "temperature": 22,
  "humidity": 60,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "wateringHistory": []
}
```

## Next Steps

After testing all endpoints:
1. Verify all CRUD operations work correctly
2. Test error cases (invalid data, unauthorized access)
3. Check that data persists in MongoDB
4. Test real-time features (Socket.io) separately if needed

