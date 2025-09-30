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
import { theme } from '../theme';

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
    navigation.navigate('RoundConfig' as never, { course } as never);
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
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses by name or location"
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={theme.colors.primary.main} style={styles.searchLoading} />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
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
              <Ionicons name="golf" size={48} color={theme.colors.text.tertiary} />
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
    backgroundColor: theme.colors.background.primary,
  },
  searchSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  searchLoading: {
    marginLeft: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  coursesList: {
    padding: theme.spacing.lg,
  },
  courseCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.card,
    padding: theme.padding.card,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  courseName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  courseDistance: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary.main,
    fontWeight: theme.fontWeight.semibold,
  },
  courseLocation: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  courseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary.main,
  },
});