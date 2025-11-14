import io from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

let socket = null;

export const initSocket = async () => {
  if (socket?.connected) return socket;

  const token = await SecureStore.getItemAsync('token');
  if (!token) {
    console.log('No token found, skipping socket connection');
    return null;
  }

  const serverUrl = __DEV__ 
    ? 'http://localhost:3000' 
    : (process.env.SOCKET_URL || 'http://localhost:3000');

  socket = io(serverUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Listen for plant watering needs
  socket.on('plant-needs-water', async (data) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Plant Needs Water!',
        body: `${data.plantName} (${data.plantType}) needs watering. It's been ${data.hoursSinceWatering} hours since last watering.`,
        sound: true,
        data: { plantId: data.plantId },
      },
      trigger: null,
    });
  });

  // Listen for watering events
  socket.on('watering-started', (data) => {
    console.log('Watering started:', data);
  });

  socket.on('watering-stopped', (data) => {
    console.log('Watering stopped:', data);
  });

  return socket;
};

export const joinUserRoom = (userId) => {
  if (socket) {
    socket.emit('join-user-room', userId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

