import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../services/api';

const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return await SecureStore.deleteItemAsync(key);
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    console.log('AuthContext - User state changed:', user);
  }, [user]);

  const loadUser = async () => {
    try {
      const token = await storage.getItem('token');
      console.log('Loading user, token exists:', !!token);
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        console.log('Loaded user from /auth/me:', response.data.user);
        setUser(response.data.user);
      } else {
        console.log('No token found, user not logged in');
        setUser(null);
      }
    } catch (error) {
      console.log('No user logged in or error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login...', { email });
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      await storage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Setting user state:', user);
      setUser(user);
      console.log('User state should be updated now');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        const serverMessage = error.response.data?.message;
        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else {
          errorMessage = `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:3000';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('Attempting registration...', { username, email });
      const response = await api.post('/auth/register', { username, email, password });
      console.log('Registration response:', response.data);
      const { token, user } = response.data;
      await storage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Setting user state:', user);
      setUser(user);
      console.log('User state should be updated now');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));
      
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        const serverMessage = error.response.data?.message;
        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid data. Please check your input.';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid credentials.';
        } else {
          errorMessage = `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:3000';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await storage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

