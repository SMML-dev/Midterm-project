import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['All', 'Watering', 'Monitoring', 'Environment', 'Planting', 'Seasonal', 'Troubleshooting', 'Nutrition'];

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/suggestions');
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSuggestions();
  };

  const filteredSuggestions = selectedCategory === 'All'
    ? suggestions
    : suggestions.filter(s => s.category === selectedCategory);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#4CAF50']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Agriculture Tips</Text>
        <Text style={styles.headerSubtitle}>Expert suggestions for better farming</Text>
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredSuggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bulb-outline" size={120} color="#ccc" />
            <Text style={styles.emptyText}>No suggestions found</Text>
            <Text style={styles.emptySubtext}>Try selecting a different category</Text>
          </View>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionCard}>
              <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                style={styles.suggestionCardGradient}
              >
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionEmoji}>{suggestion.image}</Text>
                  <View style={styles.suggestionTitleContainer}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{suggestion.category}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.suggestionContent}>{suggestion.content}</Text>
              </LinearGradient>
            </View>
          ))
        )}
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
    fontSize: 18,
    color: '#E8F5E9',
    marginTop: 8,
  },
  categoryScroll: {
    maxHeight: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 25,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
  },
  suggestionCard: {
    margin: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  suggestionCardGradient: {
    padding: 25,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  suggestionEmoji: {
    fontSize: 50,
    marginRight: 20,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryBadgeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  suggestionContent: {
    fontSize: 18,
    color: '#555',
    lineHeight: 28,
  },
});
