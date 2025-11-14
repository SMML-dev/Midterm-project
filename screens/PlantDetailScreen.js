import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../services/api';
import { getDefaultPlantImage } from '../services/plantSearch';

const screenWidth = Dimensions.get('window').width;

export default function PlantDetailScreen({ route, navigation }) {
  const { plantId } = route.params;
  const [plant, setPlant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isWatering, setIsWatering] = useState(false);

  useEffect(() => {
    loadPlantData();
    // Refresh every 30 seconds
    const interval = setInterval(loadPlantData, 30000);
    return () => clearInterval(interval);
  }, [plantId]);

  const loadPlantData = async () => {
    try {
      const [plantResponse, statsResponse] = await Promise.all([
        api.get(`/plants/${plantId}`),
        api.get(`/plants/${plantId}/stats`),
      ]);
      setPlant(plantResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading plant data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlantData();
  };

  const handleWatering = async (action) => {
    try {
      if (action === 'start') {
        await api.post(`/watering/start/${plantId}`);
        setIsWatering(true);
      } else {
        await api.post(`/watering/stop/${plantId}`, { duration: 30 });
        setIsWatering(false);
        loadPlantData();
      }
    } catch (error) {
      console.error('Error controlling watering:', error);
      Alert.alert('Error', 'Failed to control watering');
    }
  };

  if (loading || !plant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading plant details...</Text>
      </View>
    );
  }

  const chartData = {
    labels: stats?.wateringHistory
      .slice(-7)
      .map((h, i) => format(new Date(h.timestamp), 'MMM dd')) || [],
    datasets: [
      {
        data: stats?.wateringHistory
          .slice(-7)
          .map((h) => h.soilMoistureAfter || 0) || [],
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const getMoistureColor = (moisture) => {
    if (moisture < 30) return '#F44336';
    if (moisture < 60) return '#FF9800';
    return '#4CAF50';
  };

  const getPlantImage = () => {
    if (plant.imageUrl) {
      return plant.imageUrl;
    }
    return getDefaultPlantImage(plant.type);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Plant Image Header */}
      <View style={styles.imageHeader}>
        <ExpoImage
          source={{ uri: getPlantImage() }}
          style={styles.plantHeaderImage}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        >
          <View style={styles.plantHeaderInfo}>
            <Text style={styles.plantHeaderName}>{plant.name}</Text>
            <Text style={styles.plantHeaderType}>{plant.type}</Text>
            <View style={styles.statusBadgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: plant.isActive ? '#4CAF50' : '#999' },
                ]}
              >
                <Text style={styles.statusText}>
                  {plant.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Current Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <LinearGradient
            colors={[getMoistureColor(plant.soilMoisture), getMoistureColor(plant.soilMoisture) + 'DD']}
            style={styles.metricCardGradient}
          >
            <Ionicons name="water" size={40} color="#fff" />
            <Text style={styles.metricValue}>{plant.soilMoisture}%</Text>
            <Text style={styles.metricLabel}>Soil Moisture</Text>
          </LinearGradient>
        </View>
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#FF5722', '#FF7043']}
            style={styles.metricCardGradient}
          >
            <Ionicons name="thermometer" size={40} color="#fff" />
            <Text style={styles.metricValue}>{plant.temperature}°C</Text>
            <Text style={styles.metricLabel}>Temperature</Text>
          </LinearGradient>
        </View>
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#2196F3', '#42A5F5']}
            style={styles.metricCardGradient}
          >
            <Ionicons name="cloud" size={40} color="#fff" />
            <Text style={styles.metricValue}>{plant.humidity}%</Text>
            <Text style={styles.metricLabel}>Humidity</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Watering Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.waterButton,
            isWatering && styles.waterButtonActive,
          ]}
          onPress={() => handleWatering(isWatering ? 'stop' : 'start')}
        >
          <Ionicons
            name={isWatering ? 'stop-circle' : 'water'}
            size={28}
            color="#fff"
          />
          <Text style={styles.waterButtonText}>
            {isWatering ? 'Stop Watering' : 'Start Watering'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="water" size={32} color="#2E7D32" />
            <Text style={styles.statValue}>{stats?.totalWaterings || 0}</Text>
            <Text style={styles.statLabel}>Total Waterings</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={32} color="#2196F3" />
            <Text style={styles.statValue}>
              {Math.round(stats?.averageMoisture || 0)}%
            </Text>
            <Text style={styles.statLabel}>Avg Moisture</Text>
          </View>
        </View>
        <View style={styles.lastWateredContainer}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.lastWatered}>
            Last Watered: {format(new Date(plant.lastWatered), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>
      </View>

      {/* Chart */}
      {stats?.wateringHistory && stats.wateringHistory.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Moisture Evolution</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={280}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#E8F5E9',
              backgroundGradientTo: '#C8E6C9',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 20,
              },
              propsForDots: {
                r: '8',
                strokeWidth: '3',
                stroke: '#2E7D32',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        </View>
      )}

      {/* Watering History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Watering History</Text>
        {stats?.wateringHistory && stats.wateringHistory.length > 0 ? (
          stats.wateringHistory.slice(-10).reverse().map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <Ionicons name="water" size={24} color="#2196F3" />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                </Text>
                <Text style={styles.historyDuration}>
                  Duration: {entry.duration}s
                </Text>
              </View>
              <View style={styles.historyMoisture}>
                <Text style={styles.historyMoistureText}>
                  {entry.soilMoistureBefore}% → {entry.soilMoistureAfter}%
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noHistoryContainer}>
            <Ionicons name="water-outline" size={60} color="#ccc" />
            <Text style={styles.noHistory}>No watering history yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  imageHeader: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  plantHeaderImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 25,
  },
  plantHeaderInfo: {
    alignItems: 'flex-start',
  },
  plantHeaderName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  plantHeaderType: {
    fontSize: 20,
    color: '#E8F5E9',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusBadgeContainer: {
    marginTop: 15,
  },
  statusBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    marginTop: -50,
  },
  metricCard: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  metricCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.9,
  },
  controlsContainer: {
    padding: 20,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  waterButtonActive: {
    backgroundColor: '#F44336',
  },
  waterButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  lastWateredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  lastWatered: {
    fontSize: 16,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 20,
  },
  historyContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 25,
    borderRadius: 25,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  historyMoisture: {
    alignItems: 'flex-end',
  },
  historyMoistureText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  noHistoryContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noHistory: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});
