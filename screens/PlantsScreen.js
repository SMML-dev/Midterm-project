import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import api from '../services/api';
import { searchPlantImage, getDefaultPlantImage } from '../services/plantSearch';

const { width } = Dimensions.get('window');
const PLANT_TYPES = ['Tomato', 'Lettuce', 'Basil', 'Pepper', 'Cucumber', 'Strawberry', 'Herbs', 'Other'];

export default function PlantsScreen({ navigation }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newPlant, setNewPlant] = useState({
    name: '',
    type: 'Tomato',
    wateringInterval: '24',
    imageUrl: '',
  });

  useEffect(() => {
    loadPlants();
  }, []);

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

  const handleSearchPlants = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a plant name to search');
      return;
    }

    setSearching(true);
    try {
      const plantType = PLANT_TYPES.find(t => 
        t.toLowerCase().includes(searchQuery.toLowerCase())
      ) || 'Other';
      
      const imageUrl = await searchPlantImage(searchQuery, plantType);
      
      setSearchResults([{
        name: searchQuery,
        type: plantType,
        imageUrl: imageUrl,
        suggested: true
      }]);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search plants');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setNewPlant({
      name: result.name,
      type: result.type,
      wateringInterval: '24',
      imageUrl: result.imageUrl,
    });
    setSearchModalVisible(false);
    setModalVisible(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddPlant = async () => {
    if (!newPlant.name.trim()) {
      Alert.alert('Error', 'Please enter a plant name');
      return;
    }

    try {
      // If no image URL, get default based on type
      let imageUrl = newPlant.imageUrl;
      if (!imageUrl) {
        imageUrl = await searchPlantImage(newPlant.name, newPlant.type);
      }

      await api.post('/plants', {
        name: newPlant.name,
        type: newPlant.type,
        wateringInterval: parseInt(newPlant.wateringInterval),
        imageUrl: imageUrl,
      });
      setModalVisible(false);
      setNewPlant({ name: '', type: 'Tomato', wateringInterval: '24', imageUrl: '' });
      loadPlants();
      Alert.alert('Success', 'Plant added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add plant');
    }
  };

  const handleDeletePlant = (plantId) => {
    Alert.alert(
      'Delete Plant',
      'Are you sure you want to delete this plant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/plants/${plantId}`);
              loadPlants();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plant');
            }
          },
        },
      ]
    );
  };

  const togglePlantStatus = async (plant) => {
    try {
      await api.put(`/plants/${plant._id}`, {
        isActive: !plant.isActive,
      });
      loadPlants();
    } catch (error) {
      Alert.alert('Error', 'Failed to update plant');
    }
  };

  const getPlantImage = (plant) => {
    if (plant.imageUrl) {
      return plant.imageUrl;
    }
    return getDefaultPlantImage(plant.type);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plants</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, styles.searchButton]}
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {plants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={100} color="#ccc" />
            <Text style={styles.emptyText}>No plants yet</Text>
            <Text style={styles.emptySubtext}>Add your first plant to get started</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.emptyButtonText}>Search Plants Online</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plantsGrid}>
            {plants.map((plant) => (
              <TouchableOpacity
                key={plant._id}
                style={[styles.plantCard, !plant.isActive && styles.plantCardInactive]}
                onPress={() => navigation.navigate('PlantDetail', { plantId: plant._id })}
              >
                <ExpoImage
                  source={{ uri: getPlantImage(plant) }}
                  style={styles.plantImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.plantOverlay}>
                  <View style={styles.plantCardHeader}>
                    <View style={styles.plantInfo}>
                      <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
                      <Text style={styles.plantType}>{plant.type}</Text>
                    </View>
                    <View style={styles.plantActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          togglePlantStatus(plant);
                        }}
                        style={styles.toggleButton}
                      >
                        <Ionicons
                          name={plant.isActive ? 'pause-circle' : 'play-circle'}
                          size={24}
                          color={plant.isActive ? '#FF9800' : '#4CAF50'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeletePlant(plant._id);
                        }}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={24} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.plantStatus}>
                    <View style={styles.statusItem}>
                      <Ionicons name="water-outline" size={16} color="#2196F3" />
                      <Text style={styles.statusText}>{plant.soilMoisture}%</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <Ionicons name="thermometer-outline" size={16} color="#FF5722" />
                      <Text style={styles.statusText}>{plant.temperature}°C</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <Ionicons name="cloud-outline" size={16} color="#2196F3" />
                      <Text style={styles.statusText}>{plant.humidity}%</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Search Plants Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Plants Online</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a plant (e.g., Tomato, Basil, Lettuce)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchPlants}
              />
              <TouchableOpacity
                style={styles.searchButtonLarge}
                onPress={handleSearchPlants}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="search" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultCard}
                    onPress={() => handleSelectSearchResult(result)}
                  >
                    <ExpoImage
                      source={{ uri: result.imageUrl }}
                      style={styles.searchResultImage}
                      contentFit="cover"
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{result.name}</Text>
                      <Text style={styles.searchResultType}>{result.type}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Plant Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Plant</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {newPlant.imageUrl ? (
              <ExpoImage
                source={{ uri: newPlant.imageUrl }}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Plant Name"
              value={newPlant.name}
              onChangeText={(text) => setNewPlant({ ...newPlant, name: text })}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Plant Type</Text>
              <ScrollView style={styles.typeScroll} horizontal showsHorizontalScrollIndicator={false}>
                {PLANT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      newPlant.type === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setNewPlant({ ...newPlant, type })}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        newPlant.type === type && styles.typeOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Watering Interval (hours)"
              value={newPlant.wateringInterval}
              onChangeText={(text) => setNewPlant({ ...newPlant, wateringInterval: text })}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddPlant}>
              <Text style={styles.saveButtonText}>Add Plant</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  searchButton: {
    backgroundColor: '#2196F3',
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
    backgroundColor: '#2196F3',
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
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  plantCard: {
    width: (width - 45) / 2,
    height: 280,
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  plantCardInactive: {
    opacity: 0.6,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  plantOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 15,
  },
  plantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  plantType: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  plantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  deleteButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  plantStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
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
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
  },
  searchButtonLarge: {
    backgroundColor: '#2196F3',
    width: 55,
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    maxHeight: 400,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  searchResultType: {
    fontSize: 14,
    color: '#666',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  typeScroll: {
    maxHeight: 60,
  },
  typeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  typeOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  typeOptionTextSelected: {
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
