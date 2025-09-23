import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Course } from '../types';

const CourseSelectScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyCourses();
    } else {
      loadDefaultCourses();
    }
  }, [userLocation]);

  const requestLocationPermission = async () => {
    try {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      
      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        console.log('Location permission denied');
        loadDefaultCourses();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      loadDefaultCourses();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        loadDefaultCourses();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const loadNearbyCourses = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    try {
      // This would call the /api/v1/courses/nearby endpoint
      // For now, we'll use mock data with distance calculation
      const mockCourses: Course[] = [
        {
          id: '1',
          name: 'Pebble Beach Golf Links',
          address: '1700 17-Mile Drive',
          latitude: 36.5681,
          longitude: -121.9494,
          rating: 74.5,
          slope: 145,
          holes: [],
        },
        {
          id: '2',
          name: 'Torrey Pines South Course',
          address: '11480 N Torrey Pines Rd',
          latitude: 32.8969,
          longitude: -117.2506,
          rating: 75.1,
          slope: 144,
          holes: [],
        },
        {
          id: '3',
          name: 'Bethpage Black',
          address: '99 Quaker Meeting House Rd',
          latitude: 40.7445,
          longitude: -73.4635,
          rating: 77.0,
          slope: 148,
          holes: [],
        },
      ];

      // Add distance calculation for nearby courses
      const coursesWithDistance = mockCourses.map(course => ({
        ...course,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          course.latitude,
          course.longitude
        ),
      }));

      // Sort by distance
      coursesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setCourses(coursesWithDistance);
    } catch (error) {
      console.error('Error loading nearby courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultCourses = async () => {
    setIsLoading(true);
    try {
      // Mock data for default courses
      const mockCourses: Course[] = [
        {
          id: '1',
          name: 'Pebble Beach Golf Links',
          address: '1700 17-Mile Drive, Pebble Beach, CA',
          latitude: 36.5681,
          longitude: -121.9494,
          rating: 74.5,
          slope: 145,
          holes: [],
        },
        {
          id: '2',
          name: 'Torrey Pines South Course',
          address: '11480 N Torrey Pines Rd, La Jolla, CA',
          latitude: 32.8969,
          longitude: -117.2506,
          rating: 75.1,
          slope: 144,
          holes: [],
        },
      ];

      setCourses(mockCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchCourses = async (query: string) => {
    if (!query.trim()) {
      if (userLocation) {
        loadNearbyCourses();
      } else {
        loadDefaultCourses();
      }
      return;
    }

    setIsLoading(true);
    try {
      // This would call the /api/v1/courses/search endpoint
      // For now, filter mock data
      const allCourses: Course[] = [
        {
          id: '1',
          name: 'Pebble Beach Golf Links',
          address: '1700 17-Mile Drive, Pebble Beach, CA',
          latitude: 36.5681,
          longitude: -121.9494,
          rating: 74.5,
          slope: 145,
          holes: [],
        },
        {
          id: '2',
          name: 'Torrey Pines South Course',
          address: '11480 N Torrey Pines Rd, La Jolla, CA',
          latitude: 32.8969,
          longitude: -117.2506,
          rating: 75.1,
          slope: 144,
          holes: [],
        },
        {
          id: '3',
          name: 'Augusta National Golf Club',
          address: '2604 Washington Rd, Augusta, GA',
          latitude: 33.5030,
          longitude: -82.0199,
          rating: 76.2,
          slope: 137,
          holes: [],
        },
      ];

      const filteredCourses = allCourses.filter(course =>
        course.name.toLowerCase().includes(query.toLowerCase()) ||
        course.address.toLowerCase().includes(query.toLowerCase())
      );

      setCourses(filteredCourses);
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const selectCourse = (course: Course) => {
    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to start a round. This helps verify you are at the course.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable Location', onPress: requestLocationPermission },
        ]
      );
      return;
    }

    // Check if user is near the course (within 1km for demo)
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      course.latitude,
      course.longitude
    );

    if (distance > 1.0) {
      Alert.alert(
        'Not at Course',
        `You appear to be ${distance.toFixed(1)}km away from ${course.name}. You must be at the course to start a verified round.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Anyway', onPress: () => startRound(course) },
        ]
      );
      return;
    }

    startRound(course);
  };

  const startRound = (course: Course) => {
    navigation.navigate('Scorecard' as never, { courseId: course.id } as never);
  };

  const renderCourseItem = ({ item }: { item: Course & { distance?: number } }) => (
    <TouchableOpacity style={styles.courseCard} onPress={() => selectCourse(item)}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{item.name}</Text>
        {item.distance && (
          <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        )}
      </View>
      <Text style={styles.courseAddress}>{item.address}</Text>
      <View style={styles.courseStats}>
        <Text style={styles.statText}>Rating: {item.rating}</Text>
        <Text style={styles.statText}>Slope: {item.slope}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            searchCourses(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Finding courses...</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
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
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  listContainer: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  courseAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statText: {
    fontSize: 14,
    color: '#888888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
});

export default CourseSelectScreen;