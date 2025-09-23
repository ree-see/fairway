import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Course, Hole, HoleScore } from '../types';

const ScorecardScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { courseId } = route.params as { courseId: string };
  
  const [course, setCourse] = useState<Course | null>(null);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      // This would call the /api/v1/courses/:id/holes endpoint
      // For now, we'll use mock data
      const mockCourse: Course = {
        id: courseId,
        name: 'Pebble Beach Golf Links',
        address: '1700 17-Mile Drive, Pebble Beach, CA',
        latitude: 36.5681,
        longitude: -121.9494,
        rating: 74.5,
        slope: 145,
        holes: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5][i],
          yardage: [350, 380, 180, 420, 550, 360, 160, 400, 380, 370, 390, 170, 520, 410, 150, 380, 360, 580][i],
          handicap: i + 1,
        })),
      };

      setCourse(mockCourse);
      
      // Initialize hole scores
      const initialScores: HoleScore[] = mockCourse.holes.map(hole => ({
        holeNumber: hole.number,
        strokes: 0,
        putts: undefined,
        fairwayHit: undefined,
        greenInRegulation: undefined,
      }));
      
      setHoleScores(initialScores);
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'Failed to load course information');
    } finally {
      setIsLoading(false);
    }
  };

  const updateHoleScore = (holeNumber: number, field: keyof HoleScore, value: any) => {
    setHoleScores(prev => 
      prev.map(score => 
        score.holeNumber === holeNumber 
          ? { ...score, [field]: value }
          : score
      )
    );
  };

  const getCurrentHoleScore = () => {
    return holeScores.find(score => score.holeNumber === currentHole);
  };

  const getCurrentHole = () => {
    return course?.holes.find(hole => hole.number === currentHole);
  };

  const getTotalStrokes = () => {
    return holeScores.reduce((total, score) => total + (score.strokes || 0), 0);
  };

  const getCompletedHoles = () => {
    return holeScores.filter(score => score.strokes > 0).length;
  };

  const navigateToHole = (holeNumber: number) => {
    setCurrentHole(holeNumber);
  };

  const nextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const previousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const finishRound = () => {
    const completedHoles = getCompletedHoles();
    
    if (completedHoles < 9) {
      Alert.alert(
        'Incomplete Round',
        'You need to complete at least 9 holes to finish the round.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Finish Round',
      `Complete round with ${completedHoles} holes and ${getTotalStrokes()} total strokes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            // This would submit the round to the API
            Alert.alert('Round Complete!', 'Your round has been saved.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
  };

  const currentHoleData = getCurrentHole();
  const currentScore = getCurrentHoleScore();

  if (isLoading || !course || !currentHoleData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.roundInfo}>
          {getCompletedHoles()}/18 holes • {getTotalStrokes()} strokes
        </Text>
      </View>

      {/* Hole Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.holeNavigation}
        contentContainerStyle={styles.holeNavigationContent}
      >
        {course.holes.map((hole) => (
          <TouchableOpacity
            key={hole.number}
            style={[
              styles.holeButton,
              currentHole === hole.number && styles.holeButtonActive,
              holeScores[hole.number - 1]?.strokes > 0 && styles.holeButtonCompleted,
            ]}
            onPress={() => navigateToHole(hole.number)}
          >
            <Text style={[
              styles.holeButtonText,
              currentHole === hole.number && styles.holeButtonTextActive,
            ]}>
              {hole.number}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Hole Info */}
      <View style={styles.holeInfo}>
        <Text style={styles.holeTitle}>Hole {currentHoleData.number}</Text>
        <View style={styles.holeDetails}>
          <Text style={styles.holeDetail}>Par {currentHoleData.par}</Text>
          <Text style={styles.holeDetail}>{currentHoleData.yardage} yards</Text>
          <Text style={styles.holeDetail}>HCP {currentHoleData.handicap}</Text>
        </View>
      </View>

      {/* Score Input */}
      <View style={styles.scoreInput}>
        <Text style={styles.inputLabel}>Strokes</Text>
        <View style={styles.strokeButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((strokes) => (
            <TouchableOpacity
              key={strokes}
              style={[
                styles.strokeButton,
                currentScore?.strokes === strokes && styles.strokeButtonActive,
              ]}
              onPress={() => updateHoleScore(currentHole, 'strokes', strokes)}
            >
              <Text style={[
                styles.strokeButtonText,
                currentScore?.strokes === strokes && styles.strokeButtonTextActive,
              ]}>
                {strokes}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Putts (optional)</Text>
        <View style={styles.puttButtons}>
          {[0, 1, 2, 3, 4, 5].map((putts) => (
            <TouchableOpacity
              key={putts}
              style={[
                styles.puttButton,
                currentScore?.putts === putts && styles.puttButtonActive,
              ]}
              onPress={() => updateHoleScore(currentHole, 'putts', putts)}
            >
              <Text style={[
                styles.puttButtonText,
                currentScore?.putts === putts && styles.puttButtonTextActive,
              ]}>
                {putts}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentHoleData.par >= 4 && (
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateHoleScore(currentHole, 'fairwayHit', !currentScore?.fairwayHit)}
            >
              <Text style={styles.checkboxText}>
                {currentScore?.fairwayHit ? '✓' : '○'} Fairway Hit
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => updateHoleScore(currentHole, 'greenInRegulation', !currentScore?.greenInRegulation)}
          >
            <Text style={styles.checkboxText}>
              {currentScore?.greenInRegulation ? '✓' : '○'} Green in Regulation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
          onPress={previousHole}
          disabled={currentHole === 1}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {currentHole === 18 ? (
          <TouchableOpacity style={styles.finishButton} onPress={finishRound}>
            <Text style={styles.finishButtonText}>Finish Round</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={nextHole}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    alignItems: 'center',
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roundInfo: {
    fontSize: 14,
    color: '#C8E6C9',
  },
  holeNavigation: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  holeNavigationContent: {
    paddingHorizontal: 10,
  },
  holeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  holeButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  holeButtonCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  holeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  holeButtonTextActive: {
    color: '#FFFFFF',
  },
  holeInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  holeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  holeDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  holeDetail: {
    fontSize: 16,
    color: '#666666',
  },
  scoreInput: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  strokeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  strokeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  strokeButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  strokeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  strokeButtonTextActive: {
    color: '#FFFFFF',
  },
  puttButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  puttButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  puttButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  puttButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  puttButtonTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    marginBottom: 12,
  },
  checkbox: {
    padding: 8,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333333',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  navButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScorecardScreen;