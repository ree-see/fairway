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
  Modal,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ApiService from '../services/ApiService';
import LiveActivityService from '../services/LiveActivityService';
import AuthDebugger from '../utils/AuthDebugger';
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
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    initializeRound();
  }, []);

  const initializeRound = async () => {
    try {
      setIsLoading(true);
      
      // Debug auth tokens
      await AuthDebugger.debugStoredTokens();
      
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

      // Start Live Activity for iOS Dynamic Island
      if (LiveActivityService.isLiveActivitySupported()) {
        await LiveActivityService.startRoundActivity({
          courseId: parseInt(course.id) || 0,
          courseName: course.name,
          startTime: roundData.started_at,
          currentHole: 1,
          totalHoles: courseHoles.length,
          scoreToPar: 0,
          currentScore: 0,
        });
      }
      
    } catch (error) {
      console.error('Error initializing round:', error);
      const apiError = error as ApiError;
      
      // Handle authentication errors specifically
      if (apiError.message?.includes('refresh token') || apiError.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            { text: 'Clear Auth & Go Back', onPress: async () => {
              await AuthDebugger.clearAllAuth();
              navigation.goBack();
            }},
            { text: 'Go Back', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert(
          'Error', 
          apiError.message || 'Failed to start round',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateHoleScore = async (holeNumber: number, field: 'strokes' | 'putts', value: string) => {
    const numValue = parseInt(value) || undefined;
    
    setHoles(prev => {
      const updatedHoles = prev.map(hole => 
        hole.number === holeNumber 
          ? { ...hole, [field]: numValue }
          : hole
      );

      // Update Live Activity when strokes are updated (use setTimeout to ensure state has updated)
      if (field === 'strokes' && numValue && currentRound && LiveActivityService.isLiveActivitySupported()) {
        setTimeout(async () => {
          const scoreToPar = updatedHoles.reduce((total, hole) => total + ((hole.strokes || 0) - hole.par), 0);
          const completedHoles = updatedHoles.filter(hole => hole.strokes && hole.strokes > 0).length;
          
          console.log('Updating Live Activity:', {
            hole: Math.max(1, completedHoles),
            totalHoles: updatedHoles.length,
            scoreToPar,
            startTime: currentRound.started_at
          });
          
          await LiveActivityService.updateScore(
            Math.max(1, completedHoles), 
            updatedHoles.length, 
            scoreToPar, 
            currentRound.started_at
          );
        }, 100); // Small delay to ensure state has updated
      }

      return updatedHoles;
    });
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
    // Only calculate score to par for completed holes
    const completedHoles = holes.filter(hole => hole.strokes && hole.strokes > 0);
    const totalStrokes = completedHoles.reduce((total, hole) => total + (hole.strokes || 0), 0);
    const totalPar = completedHoles.reduce((total, hole) => total + hole.par, 0);
    return totalStrokes - totalPar;
  };

  const getCompletedHoles = () => {
    return holes.filter(hole => hole.strokes && hole.strokes > 0).length;
  };

  const shouldShowSubmitButton = () => {
    const completedHoles = getCompletedHoles();
    return completedHoles === 9 || completedHoles === 18;
  };

  const getScoreDisplay = () => {
    const completedHoles = getCompletedHoles();
    const scoreToPar = getScoreToPar();
    
    if (completedHoles === 0) {
      return 'E';
    }
    
    if (scoreToPar === 0) {
      return completedHoles === 18 ? 'E' : `E thru ${completedHoles}`;
    }
    
    const scoreText = scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
    return completedHoles === 18 ? scoreText : `${scoreText} thru ${completedHoles}`;
  };

  const submitRound = () => {
    const completedHoles = getCompletedHoles();
    if (completedHoles === 9) {
      Alert.alert(
        '9-Hole Round',
        'You have completed 9 holes. Submit as a 9-hole round?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: () => handleSubmit() },
        ]
      );
    } else if (completedHoles === 18) {
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
        // End Live Activity
        if (LiveActivityService.isLiveActivitySupported()) {
          await LiveActivityService.endActivity();
        }

        Alert.alert(
          'Round Submitted!',
          `Total Score: ${totalScore}\nScore to Par: ${getScoreToPar() > 0 ? '+' : ''}${getScoreToPar()}\n\nFairways Hit: ${fairwaysHit}\nGreens in Regulation: ${greensInRegulation}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
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
      {/* Custom Focused Round Header */}
      <View style={styles.focusedHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.courseNameFocused}>{course?.name}</Text>
          <Text style={styles.holeProgress}>
            Hole {getCompletedHoles() + 1}/18
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.scoreDisplayFocused}>
            <Text style={styles.scoreLabelFocused}>Score</Text>
            <Text style={[styles.scoreValueFocused, { color: getScoreToPar() > 0 ? '#F44336' : getScoreToPar() < 0 ? '#4CAF50' : '#FFFFFF' }]}>
              {getScoreDisplay()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scorecard}>
        <View style={styles.holes}>
          {holes.map(renderHole)}
        </View>
      </ScrollView>

      {shouldShowSubmitButton() && (
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
      )}

      {/* Floating Action Button for Menu */}
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => setShowMenu(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>⋮</Text>
      </TouchableOpacity>

      {/* Round Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>Continue Round</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              Alert.alert(
                'Pause Round',
                'Save progress and return to Dashboard?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Pause & Exit', onPress: () => navigation.goBack() }
                ]
              );
            }}>
              <Text style={styles.menuItemText}>Pause Round</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              Alert.alert('Round Settings', 'Settings coming soon: Change tees, add playing partners');
            }}>
              <Text style={styles.menuItemText}>Round Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              Alert.alert('Summary', `Completed: ${getCompletedHoles()}/18 holes\nScore: ${getScoreToPar() > 0 ? '+' : ''}${getScoreToPar()}`);
            }}>
              <Text style={styles.menuItemText}>View Summary</Text>
            </TouchableOpacity>
            
            {shouldShowSubmitButton() && (
              <TouchableOpacity style={[styles.menuItem, styles.menuItemSuccess]} onPress={() => {
                setShowMenu(false);
                submitRound();
              }}>
                <Text style={[styles.menuItemText, styles.menuItemTextSuccess]}>End Round</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => {
              setShowMenu(false);
              Alert.alert(
                'Exit Without Saving?',
                'All progress will be lost. Return to Dashboard?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => {
                    // End Live Activity if running
                    if (LiveActivityService.isLiveActivitySupported()) {
                      LiveActivityService.endActivity();
                    }
                    navigation.goBack();
                  }}
                ]
              );
            }}>
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Exit Without Saving</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  focusedHeader: {
    backgroundColor: '#2E7D32',
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Account for status bar
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  courseNameFocused: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  holeProgress: {
    fontSize: 12,
    color: '#E8F5E8',
  },
  scoreDisplayFocused: {
    alignItems: 'center',
  },
  scoreLabelFocused: {
    fontSize: 10,
    color: '#E8F5E8',
    marginBottom: 2,
  },
  scoreValueFocused: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
  },
  menuItemSuccess: {
    backgroundColor: '#E8F5E8',
  },
  menuItemTextSuccess: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  menuItemDanger: {
    backgroundColor: '#FFEBEE',
  },
  menuItemTextDanger: {
    color: '#F44336',
    fontWeight: 'bold',
  },
});