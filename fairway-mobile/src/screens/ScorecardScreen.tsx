import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ApiService from '../services/ApiService';
import { Course, DetailedCourse, Hole, Round, HoleScore, HoleScoreInput, ApiError } from '../types/api';

interface ScoringHole extends Hole {
  strokes?: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
}

export const ScorecardScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { course } = route.params as { course: Course };
  
  const [holes, setHoles] = useState<ScoringHole[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeRound();
  }, []);

  const initializeRound = async () => {
    try {
      setIsLoading(true);
      
      // Get detailed course data with holes
      const courseResponse = await ApiService.getCourse(course.id);
      if (!courseResponse.success || !courseResponse.data) {
        throw new Error('Failed to load course details');
      }
      
      const detailedCourse = courseResponse.data.course;
      const courseHoles: ScoringHole[] = detailedCourse.holes.map(hole => ({
        ...hole,
        strokes: undefined,
        putts: undefined,
        fairway_hit: false,
        green_in_regulation: false,
        up_and_down: false,
      }));
      
      setHoles(courseHoles);
      
      // Create a new round
      const roundData = {
        course_id: course.id,
        started_at: new Date().toISOString(),
        tee_color: 'white', // Default to white tees
        is_provisional: true,
      };
      
      const roundResponse = await ApiService.createRound(roundData);
      if (!roundResponse.success || !roundResponse.data) {
        throw new Error('Failed to create round');
      }
      
      setCurrentRound(roundResponse.data.round);
      
    } catch (error) {
      console.error('Error initializing round:', error);
      const apiError = error as ApiError;
      Alert.alert(
        'Error', 
        apiError.message || 'Failed to start round',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateHoleScore = (holeNumber: number, field: 'strokes' | 'putts', value: string) => {
    const numValue = parseInt(value) || undefined;
    setHoles(prev => prev.map(hole => 
      hole.number === holeNumber 
        ? { ...hole, [field]: numValue }
        : hole
    ));
  };

  const updateHoleBool = (holeNumber: number, field: 'fairway_hit' | 'green_in_regulation' | 'up_and_down', value: boolean) => {
    setHoles(prev => prev.map(hole => 
      hole.number === holeNumber 
        ? { ...hole, [field]: value }
        : hole
    ));
  };

  const getTotalScore = () => {
    return holes.reduce((total, hole) => total + (hole.strokes || 0), 0);
  };

  const getTotalPar = () => {
    return holes.reduce((total, hole) => total + hole.par, 0);
  };

  const getScoreToPar = () => {
    const total = getTotalScore();
    const par = getTotalPar();
    return total - par;
  };

  const submitRound = () => {
    const completedHoles = holes.filter(hole => hole.strokes).length;
    if (completedHoles < 18) {
      Alert.alert(
        'Incomplete Round',
        `You have only completed ${completedHoles} holes. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: () => handleSubmit() },
        ]
      );
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!currentRound) {
      Alert.alert('Error', 'No active round found');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // First, save all hole scores to the backend
      const holesWithScores = holes.filter(hole => hole.strokes && hole.strokes > 0);
      
      for (const hole of holesWithScores) {
        const holeScoreData: HoleScoreInput = {
          hole_number: hole.number,
          strokes: hole.strokes!,
          putts: hole.putts || null,
          fairway_hit: hole.fairway_hit || false,
          green_in_regulation: hole.green_in_regulation || false,
          up_and_down: hole.up_and_down || false,
          penalties: 0, // Could be enhanced to track penalties per hole
          drive_distance: null,
          approach_distance: null,
        };

        try {
          await ApiService.addHoleScore(currentRound.id, holeScoreData);
        } catch (error) {
          console.error(`Failed to save hole ${hole.number} score:`, error);
          // Continue with other holes even if one fails
        }
      }
      
      // Calculate round statistics
      const totalScore = getTotalScore();
      const totalPutts = holes.reduce((total, hole) => total + (hole.putts || 0), 0);
      const fairwaysHit = holes.filter(hole => hole.par >= 4 && hole.fairway_hit).length;
      const greensInRegulation = holes.filter(hole => hole.green_in_regulation).length;
      const totalPenalties = 0; // Could be enhanced to track penalties per hole

      // Update round with completion data
      const roundUpdateData = {
        completed_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        total_strokes: totalScore,
        total_putts: totalPutts,
        fairways_hit: fairwaysHit,
        greens_in_regulation: greensInRegulation,
        total_penalties: totalPenalties,
      };

      const response = await ApiService.updateRound(currentRound.id, roundUpdateData);
      
      if (response.success) {
        Alert.alert(
          'Round Submitted!',
          `Total Score: ${totalScore}\nScore to Par: ${getScoreToPar() > 0 ? '+' : ''}${getScoreToPar()}\n\nFairways Hit: ${fairwaysHit}\nGreens in Regulation: ${greensInRegulation}`,
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard' as never) }]
        );
      } else {
        throw new Error(response.error || 'Failed to submit round');
      }
      
    } catch (error) {
      console.error('Error submitting round:', error);
      const apiError = error as ApiError;
      Alert.alert('Error', apiError.message || 'Failed to submit round');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHole = (hole: ScoringHole) => (
    <View key={hole.number} style={styles.holeCard}>
      <View style={styles.holeHeader}>
        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>Hole {hole.number}</Text>
          <Text style={styles.holeDetails}>Par {hole.par} • {hole.distance}yd</Text>
        </View>
      </View>
      
      <View style={styles.scoreRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Strokes</Text>
          <TextInput
            style={styles.scoreInput}
            value={hole.strokes?.toString() || ''}
            onChangeText={(value) => updateHoleScore(hole.number, 'strokes', value)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Putts</Text>
          <TextInput
            style={styles.scoreInput}
            value={hole.putts?.toString() || ''}
            onChangeText={(value) => updateHoleScore(hole.number, 'putts', value)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>

      {hole.par >= 4 && (
        <View style={styles.booleanRow}>
          <TouchableOpacity
            style={[styles.boolButton, hole.fairway_hit && styles.boolButtonActive]}
            onPress={() => updateHoleBool(hole.number, 'fairway_hit', !hole.fairway_hit)}
          >
            <Text style={[styles.boolButtonText, hole.fairway_hit && styles.boolButtonTextActive]}>
              Fairway Hit
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!hole.up_and_down && (
        <View style={styles.booleanRow}>
          <TouchableOpacity
            style={[styles.boolButton, hole.green_in_regulation && styles.boolButtonActive]}
            onPress={() => updateHoleBool(hole.number, 'green_in_regulation', !hole.green_in_regulation)}
          >
            <Text style={[styles.boolButtonText, hole.green_in_regulation && styles.boolButtonTextActive]}>
              Green in Regulation
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!hole.green_in_regulation && (
        <View style={styles.booleanRow}>
          <TouchableOpacity
            style={[styles.boolButton, hole.up_and_down && styles.boolButtonActive]}
            onPress={() => updateHoleBool(hole.number, 'up_and_down', !hole.up_and_down)}
          >
            <Text style={[styles.boolButtonText, hole.up_and_down && styles.boolButtonTextActive]}>
              Up & Down
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Starting your round...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.courseName}>{course?.name}</Text>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Total</Text>
            <Text style={styles.scoreValue}>{getTotalScore()}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>To Par</Text>
            <Text style={[styles.scoreValue, { color: getScoreToPar() > 0 ? '#F44336' : '#4CAF50' }]}>
              {getScoreToPar() > 0 ? '+' : ''}{getScoreToPar()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scorecard}>
        <View style={styles.holes}>
          {holes.map(renderHole)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={submitRound}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Round</Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    gap: 24,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  scorecard: {
    flex: 1,
    padding: 20,
  },
  holes: {
    gap: 16,
  },
  holeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  holeHeader: {
    marginBottom: 16,
  },
  holeInfo: {
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  holeDetails: {
    fontSize: 14,
    color: '#666666',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  booleanRow: {
    marginBottom: 8,
  },
  inputContainer: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  scoreInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: 50,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  boolButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boolButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  boolButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  boolButtonTextActive: {
    color: '#2E7D32',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});