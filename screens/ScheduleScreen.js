import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { getDefaultPlantImage } from '../services/plantSearch';

const { width } = Dimensions.get('window');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    plantId: '',
    startTime: '08:00',
    endTime: '08:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
  });

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds to show schedule status
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [schedulesResponse, plantsResponse] = await Promise.all([
        api.get('/watering/schedule'),
        api.get('/plants'),
      ]);
      setSchedules(schedulesResponse.data);
      setPlants(plantsResponse.data.filter(p => p.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.plantId) {
      Alert.alert('Error', 'Please select a plant');
      return;
    }

    if (newSchedule.daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    try {
      await api.post('/watering/schedule', newSchedule);
      setModalVisible(false);
      setNewSchedule({
        plantId: '',
        startTime: '08:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
      });
      loadData();
      Alert.alert('Success', 'Schedule created successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create schedule');
    }
  };

  const handleDeleteSchedule = (scheduleId) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/watering/schedule/${scheduleId}`);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const toggleScheduleActive = async (schedule) => {
    try {
      await api.put(`/watering/schedule/${schedule._id}`, {
        isActive: !schedule.isActive,
      });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const toggleDay = (day) => {
    const days = [...newSchedule.daysOfWeek];
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    setNewSchedule({ ...newSchedule, daysOfWeek: days.sort() });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isScheduleActiveNow = (schedule) => {
    if (!schedule.isActive) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    return (
      schedule.daysOfWeek.includes(currentDay) &&
      currentTimeMinutes >= startTimeMinutes &&
      currentTimeMinutes < endTimeMinutes
    );
  };

  const getPlantImage = (plant) => {
    if (plant?.imageUrl) return plant.imageUrl;
    if (plant?.plantId?.imageUrl) return plant.plantId.imageUrl;
    return getDefaultPlantImage(plant?.type || plant?.plantId?.type || 'Other');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Watering Schedule</Text>
        <Text style={styles.headerSubtitle}>Automate your plant care</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={120} color="#ccc" />
            <Text style={styles.emptyText}>No schedules yet</Text>
            <Text style={styles.emptySubtext}>Create a schedule to automate watering</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.emptyButtonText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedules.map((schedule) => {
            const isActiveNow = isScheduleActiveNow(schedule);
            const plant = schedule.plantId || plants.find(p => p._id === schedule.plantId);

            return (
              <View key={schedule._id} style={styles.scheduleCard}>
                {isActiveNow && (
                  <View style={styles.activeIndicator}>
                    <View style={styles.activeIndicatorDot} />
                    <Text style={styles.activeIndicatorText}>Watering Now</Text>
                  </View>
                )}
                
                <View style={styles.scheduleHeader}>
                  <View style={styles.schedulePlantInfo}>
                    {plant && (
                      <ExpoImage
                        source={{ uri: getPlantImage(plant) }}
                        style={styles.schedulePlantImage}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.schedulePlantDetails}>
                      <Text style={styles.plantName}>
                        {plant?.name || schedule.plantId?.name || 'Unknown Plant'}
                      </Text>
                      <Text style={styles.plantType}>
                        {plant?.type || schedule.plantId?.type || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scheduleActions}>
                    <Switch
                      value={schedule.isActive}
                      onValueChange={() => toggleScheduleActive(schedule)}
                      trackColor={{ false: '#ccc', true: '#4CAF50' }}
                      thumbColor="#fff"
                    />
                    <TouchableOpacity
                      onPress={() => handleDeleteSchedule(schedule._id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.scheduleTime}>
                  <Ionicons name="time" size={24} color="#2E7D32" />
                  <Text style={styles.timeText}>
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </Text>
                </View>

                <View style={styles.daysContainer}>
                  {DAYS.map((day, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dayBadge,
                        schedule.daysOfWeek.includes(index) && styles.dayBadgeActive,
                        schedule.daysOfWeek.includes(index) && isActiveNow && new Date().getDay() === index && styles.dayBadgeActiveNow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          schedule.daysOfWeek.includes(index) && styles.dayTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: schedule.isActive ? '#4CAF50' : '#999' },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  {isActiveNow && (
                    <View style={styles.wateringNowBadge}>
                      <Ionicons name="water" size={16} color="#fff" />
                      <Text style={styles.wateringNowText}>Watering Now</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add Schedule Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Watering Schedule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Plant</Text>
            <ScrollView style={styles.plantsList} horizontal showsHorizontalScrollIndicator={false}>
              {plants.map((plant) => (
                <TouchableOpacity
                  key={plant._id}
                  style={[
                    styles.plantOptionCard,
                    newSchedule.plantId === plant._id && styles.plantOptionCardSelected,
                  ]}
                  onPress={() => setNewSchedule({ ...newSchedule, plantId: plant._id })}
                >
                  <ExpoImage
                    source={{ uri: getPlantImage(plant) }}
                    style={styles.plantOptionImage}
                    contentFit="cover"
                  />
                  <Text
                    style={[
                      styles.plantOptionText,
                      newSchedule.plantId === plant._id && styles.plantOptionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {plant.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Start Time</Text>
            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                value={newSchedule.startTime}
                onChangeText={(text) => setNewSchedule({ ...newSchedule, startTime: text })}
                placeholder="HH:mm"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.label}>End Time</Text>
            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                value={newSchedule.endTime}
                onChangeText={(text) => setNewSchedule({ ...newSchedule, endTime: text })}
                placeholder="HH:mm"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.label}>Days of Week</Text>
            <View style={styles.daysSelector}>
              {DAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.daySelector,
                    newSchedule.daysOfWeek.includes(index) && styles.daySelectorActive,
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.daySelectorText,
                      newSchedule.daysOfWeek.includes(index) && styles.daySelectorTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddSchedule}>
              <Text style={styles.saveButtonText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    color: '#E8F5E9',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 28,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
    zIndex: 1,
  },
  activeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  activeIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  schedulePlantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  schedulePlantImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 15,
  },
  schedulePlantDetails: {
    flex: 1,
  },
  plantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  plantType: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  deleteButton: {
    padding: 8,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 15,
  },
  timeText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  dayBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    minWidth: 50,
    alignItems: 'center',
  },
  dayBadgeActive: {
    backgroundColor: '#2E7D32',
  },
  dayBadgeActiveNow: {
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  wateringNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  wateringNowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 15,
  },
  plantsList: {
    marginBottom: 20,
  },
  plantOptionCard: {
    width: 120,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  plantOptionCardSelected: {
    borderColor: '#2E7D32',
    borderWidth: 3,
  },
  plantOptionImage: {
    width: '100%',
    height: 100,
  },
  plantOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    padding: 10,
    textAlign: 'center',
  },
  plantOptionTextSelected: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  timeInputContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    marginBottom: 20,
  },
  timeInput: {
    padding: 18,
    fontSize: 18,
    color: '#333',
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 25,
  },
  daySelector: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  daySelectorActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  daySelectorText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  daySelectorTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
