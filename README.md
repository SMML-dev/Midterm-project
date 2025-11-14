# Roots and Wings - Smart Agriculture Management App

A fully functional React Native application for managing your agricultural plants with real-time monitoring, remote watering controls, and intelligent scheduling.

## Project Structure

This project is separated into two main parts:

```
roots-and-wings/
├── backend/          # Backend API server
│   ├── server/       # Express server, routes, models
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
│
└── (root)/           # Frontend React Native app
    ├── screens/      # React Native screens
    ├── context/      # React context
    ├── services/     # API and socket services
    ├── assets/       # App assets
    ├── package.json  # Frontend dependencies
    └── App.js        # Main app component
```

## Features

- 🌱 **Plant Management**: Add, view, and manage multiple plants
- 💧 **Remote Watering**: Start and stop watering from anywhere
- 📊 **Real-time Monitoring**: Track soil moisture, temperature, and humidity
- 📈 **Visualization**: View plant evolution with interactive charts
- ⏰ **Smart Scheduling**: Set automatic watering schedules
- 🔔 **Notifications**: Get alerts when plants need water
- 💡 **Agriculture Tips**: Access expert suggestions and best practices
- 🔐 **Authentication**: Secure login, register, and logout

## Tech Stack

### Frontend
- React Native with Expo
- React Navigation
- Expo Notifications
- Socket.io Client
- React Native Chart Kit

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io
- JWT Authentication

## License

This project is open source and available for educational purposes.
