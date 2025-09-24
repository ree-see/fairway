import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Course {
  id: string;
  name: string;
  location: string;
  distance: string;
  rating: number;
  slope: number;
}

const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    distance: '0.8 miles',
    rating: 75.5,
    slope: 145,
  },
  {
    id: '2',
    name: 'Torrey Pines South',
    location: 'La Jolla, CA',
    distance: '2.3 miles',
    rating: 75.0,
    slope: 129,
  },
  {
    id: '3',
    name: 'Spyglass Hill Golf Course',
    location: 'Pebble Beach, CA',
    distance: '1.2 miles',
    rating: 75.4,
    slope: 148,
  },
];

export const CourseSelectScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [courses] = useState(mockCourses);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchText.toLowerCase()) ||
    course.location.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectCourse = (course: Course) => {
    navigation.navigate('Scorecard' as never, { course } as never);
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseCard} onPress={() => selectCourse(item)}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{item.name}</Text>
        <Text style={styles.courseDistance}>{item.distance}</Text>
      </View>
      <Text style={styles.courseLocation}>{item.location}</Text>
      <View style={styles.courseStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.statValue}>{item.rating}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Slope</Text>
          <Text style={styles.statValue}>{item.slope}</Text>
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
        </View>
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.coursesList}
        showsVerticalScrollIndicator={false}
      />
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
    gap: 24,
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