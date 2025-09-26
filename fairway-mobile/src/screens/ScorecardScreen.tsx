import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useRoute, useNavigation } from '@react-navigation/native';
import ApiService from '../services/ApiService';
import LiveActivityService from '../services/LiveActivityService';
import AuthDebugger from '../utils/AuthDebugger';
import { Course, DetailedCourse, Hole, Round, HoleScore, HoleScoreInput, ApiError } from '../types/api';

const { width: screenWidth } = Dimensions.get('window');

interface ScoringHole extends Hole {
  strokes?: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
}

interface RoundConfig {
  course: Course;
  roundType: '9' | '18';
  nineHoleOption: 'front' | 'back' | null;
  selectedTees: string;
  totalHoles: number;
  startingHole: number;
}

export const ScorecardScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const config = route.params as RoundConfig;
  
  const [holes, setHoles] = useState<ScoringHole[]>([]);
  const [activeHoleNumbers, setActiveHoleNumbers] = useState<number[]>([]);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [stagedHole, setStagedHole] = useState<ScoringHole | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const panRef = useRef<PanGestureHandler>(null);

  useEffect(() => {
    initializeRound();
  }, []);

  // Initialize staging when holes are loaded
  useEffect(() => {
    if (holes.length > 0 && !stagedHole) {
      loadHoleData(currentHoleIndex);
    }
  }, [holes]);

  // Load hole data when currentHoleIndex changes
  useEffect(() => {
    if (holes.length > 0) {
      loadHoleData(currentHoleIndex);
    }
  }, [currentHoleIndex]);

  const initializeRound = async () => {
    try {
      setIsLoading(true);
      
      // Debug auth tokens
      await AuthDebugger.debugStoredTokens();
      
      // Get detailed course data with holes
      const courseResponse = await ApiService.getCourse(config.course.id);
      if (!courseResponse.success || !courseResponse.data) {
        throw new Error('Failed to load course details');
      }
      
      const detailedCourse = courseResponse.data.course;
      
      // Store all holes for display but filter active holes based on round configuration
      const allCourseHoles: ScoringHole[] = detailedCourse.holes.map(hole => ({
        ...hole,
        strokes: undefined,
        putts: undefined,
        fairway_hit: false,
        green_in_regulation: false,
        up_and_down: false,
      }));
      
      // Determine which holes are active for this round
      let activeHoleNumbers: number[] = [];
      if (config.roundType === '9') {
        if (config.nineHoleOption === 'front') {
          activeHoleNumbers = detailedCourse.holes.filter(hole => hole.number <= 9).map(hole => hole.number);
        } else {
          activeHoleNumbers = detailedCourse.holes.filter(hole => hole.number >= 10).map(hole => hole.number);
        }
      } else {
        activeHoleNumbers = detailedCourse.holes.map(hole => hole.number);
      }
      
      const courseHoles = allCourseHoles;
      
      setHoles(courseHoles);
      setActiveHoleNumbers(activeHoleNumbers);
      
      // Create a new round
      const roundData = {
        course_id: config.course.id,
        started_at: new Date().toISOString(),
        tee_color: config.selectedTees,
        is_provisional: true,
        holes_played: config.totalHoles,
      };
      
      const roundResponse = await ApiService.createRound(roundData);
      if (!roundResponse.success || !roundResponse.data) {
        throw new Error('Failed to create round');
      }
      
      setCurrentRound(roundResponse.data.round);

      // Start Live Activity for iOS Dynamic Island
      if (LiveActivityService.isLiveActivitySupported()) {
        await LiveActivityService.startRoundActivity({
          courseId: parseInt(config.course.id) || 0,
          courseName: config.course.name,
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

  const updateHoleScore = async (field: 'strokes' | 'putts', value: string) => {
    const numValue = parseInt(value) || undefined;
    
    // Update staged hole only - don't save to main holes array yet
    setStagedHole(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: numValue };
    });

    // Note: Score saved to main array only when navigating away from hole
  };

  const updateHoleBool = (field: 'fairway_hit' | 'green_in_regulation' | 'up_and_down', value: boolean) => {
    // Update staged hole only - don't save to main holes array yet
    setStagedHole(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const getScoreToPar = (holesData = holes) => {
    const completedHoles = holesData.filter(hole => hole.strokes && hole.strokes > 0);
    const totalStrokes = completedHoles.reduce((total, hole) => total + (hole.strokes || 0), 0);
    const totalPar = completedHoles.reduce((total, hole) => total + hole.par, 0);
    return totalStrokes - totalPar;
  };

  const getCompletedHoles = (holesData = holes) => {
    return holesData.filter(hole => hole.strokes && hole.strokes > 0).length;
  };

  const getScoreDisplay = () => {
    const completedHoles = getCompletedHoles();
    const scoreToPar = getScoreToPar();
    
    if (completedHoles === 0) {
      return 'E';
    }
    
    if (scoreToPar === 0) {
      return completedHoles === holes.length ? 'E' : `E thru ${completedHoles}`;
    }
    
    const scoreText = scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
    return completedHoles === holes.length ? scoreText : `${scoreText} thru ${completedHoles}`;
  };

  // Save staged hole data to the main holes array
  const saveStagedHole = () => {
    if (stagedHole) {
      setHoles(prev => prev.map((hole, index) => 
        index === currentHoleIndex ? { ...stagedHole } : hole
      ));
    }
  };

  // Load hole data into staging when switching holes
  const loadHoleData = (holeIndex: number) => {
    if (holeIndex >= 0 && holeIndex < holes.length) {
      setStagedHole({ ...holes[holeIndex] });
    }
  };

  // Custom setCurrentHoleIndex that saves before switching
  const navigateToHole = (newHoleIndex: number) => {
    if (newHoleIndex !== currentHoleIndex) {
      saveStagedHole(); // Save current hole before switching
      setCurrentHoleIndex(newHoleIndex);
      loadHoleData(newHoleIndex); // Load new hole data
    }
  };

  const goToNextHole = () => {
    if (currentHoleIndex < holes.length - 1) {
      navigateToHole(currentHoleIndex + 1);
    }
  };

  const goToPreviousHole = () => {
    if (currentHoleIndex > 0) {
      navigateToHole(currentHoleIndex - 1);
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;
    
    if (event.nativeEvent.state === 5) { // GESTURE_STATE_END
      const shouldSwipe = Math.abs(translationX) > screenWidth / 4 || Math.abs(velocityX) > 500;
      
      if (shouldSwipe) {
        if (translationX > 0 && currentHoleIndex > 0) {
          // Swipe right - go to previous hole
          goToPreviousHole();
        } else if (translationX < 0 && currentHoleIndex < holes.length - 1) {
          // Swipe left - go to next hole
          goToNextHole();
        }
      }
      
      // Reset animation
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const shouldShowSubmitButton = () => {
    const completedHoles = getCompletedHoles();
    return completedHoles === holes.length; // Show when all holes are completed
  };

  const submitRound = () => {
    const completedHoles = getCompletedHoles();
    if (completedHoles === holes.length) {
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
      
      // Save all hole scores to the backend
      const holesWithScores = holes.filter(hole => hole.strokes && hole.strokes > 0);
      
      for (const hole of holesWithScores) {
        const holeScoreData: HoleScoreInput = {
          hole_number: hole.number,
          strokes: hole.strokes!,
          putts: hole.putts || null,
          fairway_hit: hole.fairway_hit || false,
          green_in_regulation: hole.green_in_regulation || false,
          up_and_down: hole.up_and_down || false,
          penalties: 0,
          drive_distance: null,
          approach_distance: null,
        };

        try {
          await ApiService.addHoleScore(currentRound.id, holeScoreData);
        } catch (error) {
          console.error(`Failed to save hole ${hole.number} score:`, error);
        }
      }
      
      // Calculate round statistics
      const totalScore = holes.reduce((total, hole) => total + (hole.strokes || 0), 0);
      const totalPutts = holes.reduce((total, hole) => total + (hole.putts || 0), 0);
      const fairwaysHit = holes.filter(hole => hole.par >= 4 && hole.fairway_hit).length;
      const greensInRegulation = holes.filter(hole => hole.green_in_regulation).length;

      // Update round with completion data
      const roundUpdateData = {
        completed_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        total_strokes: totalScore,
        total_putts: totalPutts,
        fairways_hit: fairwaysHit,
        greens_in_regulation: greensInRegulation,
        total_penalties: 0,
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Starting your round...</Text>
      </View>
    );
  }

  const currentHole = stagedHole || holes[currentHoleIndex];

  return (
    <View style={styles.container}>
      {/* Simplified Header */}
      <View style={styles.header}>
        <Text style={styles.courseName}>{config.course.name}</Text>
        <Text style={styles.scoreDisplay}>{getScoreDisplay()}</Text>
      </View>

      {/* Single Hole Card with Swipe Navigation */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View 
          style={[
            styles.holeContainer, 
            { transform: [{ translateX }] }
          ]}
        >
          <View style={styles.holeCard}>
            <View style={styles.holeHeader}>
              <Text style={styles.holeNumber}>Hole {currentHole?.number}</Text>
              <Text style={styles.holeDetails}>Par {currentHole?.par} • {currentHole?.distance}yd</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Strokes</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={currentHole?.strokes?.toString() || ''}
                  onChangeText={(value) => updateHoleScore('strokes', value)}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Putts</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={currentHole?.putts?.toString() || ''}
                  onChangeText={(value) => updateHoleScore('putts', value)}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            {currentHole?.par >= 4 && (
              <TouchableOpacity
                style={[styles.boolButton, currentHole?.fairway_hit && styles.boolButtonActive]}
                onPress={() => updateHoleBool('fairway_hit', !currentHole?.fairway_hit)}
              >
                <Text style={[styles.boolButtonText, currentHole?.fairway_hit && styles.boolButtonTextActive]}>
                  Fairway Hit
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.boolButton, currentHole?.green_in_regulation && styles.boolButtonActive]}
              onPress={() => updateHoleBool('green_in_regulation', !currentHole?.green_in_regulation)}
            >
              <Text style={[styles.boolButtonText, currentHole?.green_in_regulation && styles.boolButtonTextActive]}>
                Green in Regulation
              </Text>
            </TouchableOpacity>

            {!currentHole?.green_in_regulation && (
              <TouchableOpacity
                style={[styles.boolButton, currentHole?.up_and_down && styles.boolButtonActive]}
                onPress={() => updateHoleBool('up_and_down', !currentHole?.up_and_down)}
              >
                <Text style={[styles.boolButtonText, currentHole?.up_and_down && styles.boolButtonTextActive]}>
                  Up & Down
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>

      {/* Hole Selectors - Separate from hole card */}
      <View style={styles.holeSelectorContainer}>
        <Text style={styles.holeSelectorTitle}>Select Hole</Text>
        <View style={styles.holeGridContainer}>
          {holes.map((hole, index) => {
            const isActive = activeHoleNumbers.includes(hole.number);
            const isCurrentHole = index === currentHoleIndex;
            const isCompleted = hole.strokes !== undefined;
            
            return (
              <TouchableOpacity
                key={hole.id}
                style={[
                  styles.holeSelector,
                  isCurrentHole && styles.holeSelectorActive,
                  isCompleted && styles.holeSelectorCompleted,
                  !isActive && styles.holeSelectorInactive
                ]}
                onPress={() => isActive ? navigateToHole(index) : null}
                disabled={!isActive}
            >
              <Text style={[
                styles.holeSelectorText,
                isCurrentHole && styles.holeSelectorTextActive,
                isCompleted && styles.holeSelectorTextCompleted,
                !isActive && styles.holeSelectorTextInactive
              ]}>
                {hole.number}
              </Text>
            </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Submit Button - only when all holes completed */}
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

      {/* Bottom Capsule Menu Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.capsuleMenuButton}
          onPress={() => setShowMenu(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.capsuleMenuText}>☰ Menu</Text>
        </TouchableOpacity>
      </View>

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
              Alert.alert('Round Settings', 'Settings coming soon');
            }}>
              <Text style={styles.menuItemText}>Round Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              Alert.alert('Summary', `Completed: ${getCompletedHoles()}/${holes.length} holes\nScore: ${getScoreDisplay()}`);
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
    backgroundColor: '#2E7D32', // Green background for entire screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 100 : 80,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  scoreDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  holeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 8,
    justifyContent: 'flex-start',
  },
  holeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  holeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  holeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  holeDetails: {
    fontSize: 16,
    color: '#666666',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  inputContainer: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    width: 80,
    height: 60,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  boolButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boolButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  boolButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  boolButtonTextActive: {
    color: '#2E7D32',
  },
  holeSelectorContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  holeSelectorTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  holeGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  holeSelector: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  holeSelectorActive: {
    backgroundColor: '#C41E3A', // Cardinal red for current hole
    borderColor: '#C41E3A',
  },
  holeSelectorCompleted: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  holeSelectorInactive: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
    opacity: 0.5,
  },
  holeSelectorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  holeSelectorTextActive: {
    color: '#FFFFFF',
  },
  holeSelectorTextCompleted: {
    color: '#2E7D32',
  },
  holeSelectorTextInactive: {
    color: '#CCCCCC',
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
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 20,
    backgroundColor: '#2E7D32',
  },
  capsuleMenuButton: {
    backgroundColor: '#C41E3A', // Cardinal red
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  capsuleMenuText: {
    fontSize: 16,
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