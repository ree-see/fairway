import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import { Course, ApiError } from '../types/api';
import { useDebouncedSearch } from '../hooks/useDebounce';

export const CourseSelectScreen: React.FC = () => {
  const navigation = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized search function to prevent recreation on every render
  const searchFunction = useCallback(async (query: string) => {
    try {
      const response = await ApiService.searchCourses(query);
      if (response.success && response.data) {
        return response.data.courses;
      }
      // Fallback to local filtering if API search fails
      return courses.filter(course =>
        course.name.toLowerCase().includes(query.toLowerCase()) ||
        course.full_address.toLowerCase().includes(query.toLowerCase()) ||
        course.city.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      // Fallback to local filtering on error
      return courses.filter(course =>
        course.name.toLowerCase().includes(query.toLowerCase()) ||
        course.full_address.toLowerCase().includes(query.toLowerCase()) ||
        course.city.toLowerCase().includes(query.toLowerCase())
      );
    }
  }, [courses]);

  // Use debounced search hook
  const {
    query: searchText,
    setQuery: setSearchText,
    results: searchResults,
    isSearching,
    error: searchError,
  } = useDebouncedSearch(searchFunction, 300);

  // Get the courses to display (search results or all courses)
  const displayCourses = searchResults || courses;

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getCourses();
      
      if (response.success && response.data) {
        setCourses(response.data.courses);
      } else {
        Alert.alert('Error', 'Failed to load courses');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      const apiError = error as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCourse = (course: Course) => {
    navigation.navigate('Scorecard' as never, { course } as never);
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseCard} onPress={() => selectCourse(item)}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{item.name}</Text>
        {item.distance_meters && (
          <Text style={styles.courseDistance}>
            {(item.distance_meters * 0.000621371).toFixed(1)} mi
          </Text>
        )}
      </View>
      <Text style={styles.courseLocation}>
        {[item.city, item.state].filter(Boolean).join(', ')}
      </Text>
      <View style={styles.courseStats}>
        {item.course_rating && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>{item.course_rating}</Text>
          </View>
        )}
        {item.slope_rating && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Slope</Text>
            <Text style={styles.statValue}>{item.slope_rating}</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Par</Text>
          <Text style={styles.statValue}>{item.par}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Holes</Text>
          <Text style={styles.statValue}>{item.holes_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses by name or location"
            value={searchText}
            onChangeText={setSearchText}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#2E7D32" style={styles.searchLoading} />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : (
        <FlatList
          data={displayCourses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="golf" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {searchText ? 'No courses found matching your search' : 'No courses available'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  searchLoading: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  coursesList: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  courseDistance: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  courseLocation: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  courseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});