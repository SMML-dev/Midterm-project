import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import api from '../services/api';
import { initSocket, joinUserRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { getDefaultPlantImage } from '../services/plantSearch';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wateringStates, setWateringStates] = useState({});

  useEffect(() => {
    loadPlants();
    if (user) {
      initializeSocket();
    }
  }, [user]);

  useEffect(() => {
    // Refresh plants every 30 seconds
    const interval = setInterval(() => {
      loadPlants();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeSocket = async () => {
    const socket = await initSocket();
    if (socket && user) {
      const userId = user.id || user._id;
      if (userId) {
        joinUserRoom(userId);
      }
    }
  };

  const loadPlants = async () => {
    try {
      const response = await api.get('/plants');
      setPlants(response.data);
    } catch (error) {
      console.error('Error loading plants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const handleWatering = async (plantId, action) => {
    try {
      if (action === 'start') {
        await api.post(`/watering/start/${plantId}`);
        setWateringStates({ ...wateringStates, [plantId]: true });
        Alert.alert('Success', 'Watering started');
      } else {
        await api.post(`/watering/stop/${plantId}`, { duration: 30 });
        setWateringStates({ ...wateringStates, [plantId]: false });
        Alert.alert('Success', 'Watering stopped');
        loadPlants();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to control watering');
    }
  };

  const getMoistureColor = (moisture) => {
    if (moisture < 30) return '#F44336';
    if (moisture < 60) return '#FF9800';
    return '#4CAF50';
  };

  const getMoistureStatus = (moisture) => {
    if (moisture < 30) return 'Low';
    if (moisture < 60) return 'Moderate';
    return 'Good';
  };

  // Filter active plants - this is the key fix
  const activePlants = plants.filter(p => p.isActive === true);
  const needsWater = activePlants.filter(p => {
    const now = new Date();
    const lastWatered = new Date(p.lastWatered);
    const hoursSince = (now - lastWatered) / (1000 * 60 * 60);
    return hoursSince >= p.wateringInterval;
  });

  const getPlantImage = (plant) => {
    if (plant.imageUrl) {
      return plant.imageUrl;
    }
    return getDefaultPlantImage(plant.type);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {user?.username}! 👋</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#E8F5E9', '#C8E6C9']}
              style={styles.statCardGradient}
            >
              <Ionicons name="leaf" size={40} color="#2E7D32" />
              <Text style={styles.statNumber}>{activePlants.length}</Text>
              <Text style={styles.statLabel}>Active Plants</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#E3F2FD', '#BBDEFB']}
              style={styles.statCardGradient}
            >
              <Ionicons name="water" size={40} color="#2196F3" />
              <Text style={styles.statNumber}>{needsWater.length}</Text>
              <Text style={styles.statLabel}>Need Water</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Active Plants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Plants</Text>
            <TouchableOpacity
              style={styles.addButtonSmall}
              onPress={() => navigation.navigate('Plants')}
            >
              <Ionicons name="add-circle" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          
          {activePlants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={100} color="#ccc" />
              <Text style={styles.emptyText}>No active plants yet</Text>
              <Text style={styles.emptySubtext}>Add plants to start monitoring</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('Plants')}
              >
                <Text style={styles.addButtonText}>Add Your First Plant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activePlants.map((plant) => {
              const needsWatering = needsWater.some(p => p._id === plant._id);
              const isWatering = wateringStates[plant._id];

              return (
                <View key={plant._id} style={styles.plantCard}>
                  <View style={styles.plantImageContainer}>
                    <ExpoImage
                      source={{ uri: getPlantImage(plant) }}
                      style={styles.plantImage}
                      contentFit="cover"
                      transition={200}
                    />
                    {needsWatering && (
                      <View style={styles.needsWaterBadge}>
                        <Ionicons name="water" size={20} color="#fff" />
                        <Text style={styles.needsWaterText}>Needs Water</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.plantContent}>
                    <View style={styles.plantHeader}>
                      <View style={styles.plantInfo}>
                        <Text style={styles.plantName}>{plant.name}</Text>
                        <Text style={styles.plantType}>{plant.type}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => navigation.navigate('PlantDetail', { plantId: plant._id })}
                      >
                        <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.plantMetrics}>
                      <View style={styles.metric}>
                        <Ionicons name="water" size={24} color={getMoistureColor(plant.soilMoisture)} />
                        <View style={styles.metricTextContainer}>
                          <Text style={styles.metricValue}>{plant.soilMoisture}%</Text>
                          <Text style={styles.metricLabel}>{getMoistureStatus(plant.soilMoisture)}</Text>
                        </View>
                      </View>
                      <View style={styles.metric}>
                        <Ionicons name="thermometer" size={24} color="#FF5722" />
                        <View style={styles.metricTextContainer}>
                          <Text style={styles.metricValue}>{plant.temperature}°C</Text>
                          <Text style={styles.metricLabel}>Temp</Text>
                        </View>
                      </View>
                      <View style={styles.metric}>
                        <Ionicons name="cloud" size={24} color="#2196F3" />
                        <View style={styles.metricTextContainer}>
                          <Text style={styles.metricValue}>{plant.humidity}%</Text>
                          <Text style={styles.metricLabel}>Humidity</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.waterButton,
                        isWatering && styles.waterButtonActive
                      ]}
                      onPress={() => handleWatering(plant._id, isWatering ? 'stop' : 'start')}
                    >
                      <Ionicons
                        name={isWatering ? 'stop-circle' : 'water'}
                        size={24}
                        color="#fff"
                      />
                      <Text style={styles.waterButtonText}>
                        {isWatering ? 'Stop Watering' : 'Start Watering'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.lastWatered}>
                      Last watered: {format(new Date(plant.lastWatered), 'MMM dd, yyyy HH:mm')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 25,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#E8F5E9',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardGradient: {
    padding: 25,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButtonSmall: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  plantCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    marginBottom: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  plantImageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  needsWaterBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  needsWaterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  plantContent: {
    padding: 25,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  plantType: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  detailsButton: {
    padding: 8,
  },
  plantMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    paddingVertical: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
  },
  metric: {
    alignItems: 'center',
    gap: 8,
  },
  metricTextContainer: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 18,
    borderRadius: 15,
    gap: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  waterButtonActive: {
    backgroundColor: '#F44336',
  },
  waterButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastWatered: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
