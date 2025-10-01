import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert, Animated, Dimensions } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { useRoute, useNavigation } from "@react-navigation/native";
import ApiService from "../services/ApiService";
import LiveActivityService from "../services/LiveActivityService";
import AuthDebugger from "../utils/AuthDebugger";
import {
  Course,
  DetailedCourse,
  Hole,
  Round,
  HoleScore,
  HoleScoreInput,
  ApiError,
} from "../types/api";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { ScoreHeader } from "../components/scorecard/ScoreHeader";
import { HoleCard } from "../components/scorecard/HoleCard";
import { HoleSelector } from "../components/scorecard/HoleSelector";
import { SubmitButton } from "../components/scorecard/SubmitButton";
import { MenuButton } from "../components/scorecard/MenuButton";
import { RoundMenu } from "../components/scorecard/RoundMenu";

const { width: screenWidth } = Dimensions.get("window");

interface ScoringHole extends Hole {
  strokes?: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
}

interface RoundConfig {
  course: Course;
  roundType: "9" | "18";
  nineHoleOption: "front" | "back" | null;
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
  const [roundPersistedToDb, setRoundPersistedToDb] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
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
        throw new Error("Failed to load course details");
      }

      const detailedCourse = courseResponse.data.course;

      // Store all holes for display but filter active holes based on round configuration
      const allCourseHoles: ScoringHole[] = detailedCourse.holes.map(
        (hole) => ({
          ...hole,
          strokes: undefined,
          putts: undefined,
          fairway_hit: false,
          green_in_regulation: false,
          up_and_down: false,
        }),
      );

      // Determine which holes are active for this round
      let activeHoleNumbers: number[] = [];
      if (config.roundType === "9") {
        if (config.nineHoleOption === "front") {
          activeHoleNumbers = detailedCourse.holes
            .filter((hole) => hole.number <= 9)
            .map((hole) => hole.number);
        } else {
          activeHoleNumbers = detailedCourse.holes
            .filter((hole) => hole.number >= 10)
            .map((hole) => hole.number);
        }
      } else {
        activeHoleNumbers = detailedCourse.holes.map((hole) => hole.number);
      }

      const courseHoles = allCourseHoles;

      setHoles(courseHoles);
      setActiveHoleNumbers(activeHoleNumbers);

      // Create a temporary round object (not saved to DB yet)
      const tempRound: Partial<Round> = {
        id: "temp-" + Date.now(), // Temporary ID
        course_id: config.course.id,
        course_name: config.course.name,
        started_at: new Date().toISOString(),
        tee_color: config.selectedTees,
        is_provisional: true,
        status: "in_progress",
      };

      setCurrentRound(tempRound as Round);

      // Start Live Activity for iOS Dynamic Island
      if (LiveActivityService.isLiveActivitySupported()) {
        await LiveActivityService.startRoundActivity({
          courseId: parseInt(config.course.id) || 0,
          courseName: config.course.name,
          startTime: tempRound.started_at!,
          currentHole: 1,
          totalHoles: activeHoleNumbers.length,
          scoreToPar: 0,
          currentScore: 0,
        });
      }
    } catch (error) {
      console.error("Error initializing round:", error);
      const apiError = error as ApiError;

      // Handle authentication errors specifically
      if (
        apiError.message?.includes("refresh token") ||
        apiError.status === 401
      ) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [
            {
              text: "Clear Auth & Go Back",
              onPress: async () => {
                await AuthDebugger.clearAllAuth();
                navigation.goBack();
              },
            },
            { text: "Go Back", onPress: () => navigation.goBack() },
          ],
        );
      } else {
        Alert.alert("Error", apiError.message || "Failed to start round", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveRoundToDB = async (): Promise<Round> => {
    if (!currentRound) {
      throw new Error("No current round to save");
    }

    // If already persisted, just return the current round
    if (roundPersistedToDb && !currentRound.id.startsWith("temp-")) {
      return currentRound;
    }

    try {
      // Create the round in the database
      const roundData = {
        course_id: currentRound.course_id,
        started_at: currentRound.started_at,
        tee_color: currentRound.tee_color,
        is_provisional: true,
        holes_played: config.totalHoles,
      };

      const roundResponse = await ApiService.createRound(roundData);
      if (!roundResponse.success || !roundResponse.data) {
        throw new Error("Failed to create round");
      }

      const savedRound = roundResponse.data.round;
      setCurrentRound(savedRound);
      setRoundPersistedToDb(true);

      return savedRound;
    } catch (error) {
      console.error("Error saving round to DB:", error);
      throw error;
    }
  };

  const updateHoleScore = async (field: "strokes" | "putts", value: string) => {
    const numValue = parseInt(value) || undefined;

    // Update staged hole only - don't save to main holes array yet
    setStagedHole((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: numValue };
    });

    // Note: Score saved to main array only when navigating away from hole
  };

  const updateHoleBool = (
    field: "fairway_hit" | "green_in_regulation" | "up_and_down",
    value: boolean,
  ) => {
    // Update staged hole only - don't save to main holes array yet
    setStagedHole((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const getScoreToPar = (holesData = holes) => {
    const completedHoles = holesData.filter(
      (hole) => hole.strokes && hole.strokes > 0,
    );
    const totalStrokes = completedHoles.reduce(
      (total, hole) => total + (hole.strokes || 0),
      0,
    );
    const totalPar = completedHoles.reduce(
      (total, hole) => total + hole.par,
      0,
    );
    return totalStrokes - totalPar;
  };

  const getCompletedHoles = (holesData = holes) => {
    return holesData.filter((hole) => hole.strokes && hole.strokes > 0).length;
  };

  const getScoreDisplay = () => {
    const completedHoles = getCompletedHoles();
    const scoreToPar = getScoreToPar();

    if (completedHoles === 0) {
      return "E";
    }

    if (scoreToPar === 0) {
      return completedHoles === activeHoleNumbers.length
        ? "E"
        : `E thru ${completedHoles}`;
    }

    const scoreText = scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
    return completedHoles === activeHoleNumbers.length
      ? scoreText
      : `${scoreText} thru ${completedHoles}`;
  };

  // Save staged hole data to the main holes array
  const saveStagedHole = () => {
    if (stagedHole) {
      setHoles((prev) =>
        prev.map((hole, index) =>
          index === currentHoleIndex ? { ...stagedHole } : hole,
        ),
      );
    }
  };

  // Load hole data into staging when switching holes
  const loadHoleData = (holeIndex: number) => {
    if (holeIndex >= 0 && holeIndex < holes.length) {
      setStagedHole({ ...holes[holeIndex] });
    }
  };

  // Custom setCurrentHoleIndex that saves before switching with animation
  const navigateToHole = (newHoleIndex: number) => {
    if (newHoleIndex !== currentHoleIndex) {
      saveStagedHole(); // Save current hole before switching

      // Fade out animation
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Switch hole
        setCurrentHoleIndex(newHoleIndex);
        loadHoleData(newHoleIndex);

        // Fade in animation
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
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
    { useNativeDriver: true },
  );

  const onHandlerStateChange = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;

    if (event.nativeEvent.state === 5) {
      // GESTURE_STATE_END
      const shouldSwipe =
        Math.abs(translationX) > screenWidth / 4 || Math.abs(velocityX) > 500;

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
    return completedHoles === activeHoleNumbers.length; // Show when all active holes are completed
  };

  const submitRound = () => {
    const completedHoles = getCompletedHoles();
    if (completedHoles === activeHoleNumbers.length) {
      handleSubmit();
    }
  };

  const handlePauseRound = async () => {
    try {
      // Save round to database if not already persisted
      if (!roundPersistedToDb) {
        await saveRoundToDB();
        Alert.alert("Round Saved", "Your progress has been saved", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error pausing round:", error);
      Alert.alert("Error", "Failed to save round. Try again?", [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: handlePauseRound },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!currentRound) {
      Alert.alert("Error", "No active round found");
      return;
    }

    try {
      setIsSubmitting(true);

      // Save round to DB first if not already persisted
      let roundToSubmit = currentRound;
      if (!roundPersistedToDb) {
        roundToSubmit = await saveRoundToDB();
      }

      // Save all hole scores to the backend
      const holesWithScores = holes.filter(
        (hole) => hole.strokes && hole.strokes > 0,
      );

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
          await ApiService.addHoleScore(roundToSubmit.id, holeScoreData);
        } catch (error) {
          console.error(`Failed to save hole ${hole.number} score:`, error);
        }
      }

      // Calculate round statistics
      const totalScore = holes.reduce(
        (total, hole) => total + (hole.strokes || 0),
        0,
      );
      const totalPutts = holes.reduce(
        (total, hole) => total + (hole.putts || 0),
        0,
      );
      const fairwaysHit = holes.filter(
        (hole) => hole.par >= 4 && hole.fairway_hit,
      ).length;
      const greensInRegulation = holes.filter(
        (hole) => hole.green_in_regulation,
      ).length;

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

      const response = await ApiService.updateRound(
        roundToSubmit.id,
        roundUpdateData,
      );

      if (response.success) {
        // End Live Activity
        if (LiveActivityService.isLiveActivitySupported()) {
          await LiveActivityService.endActivity();
        }

        Alert.alert(
          "Round Submitted!",
          `Total Score: ${totalScore}\nScore to Par: ${getScoreToPar() > 0 ? "+" : ""}${getScoreToPar()}\n\nFairways Hit: ${fairwaysHit}\nGreens in Regulation: ${greensInRegulation}`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } else {
        throw new Error(response.error || "Failed to submit round");
      }
    } catch (error) {
      console.error("Error submitting round:", error);
      const apiError = error as ApiError;
      Alert.alert("Error", apiError.message || "Failed to submit round");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Starting your round..." />;
  }

  const currentHole = stagedHole || holes[currentHoleIndex];

  return (
    <View style={styles.container}>
      <ScoreHeader
        courseName={config.course.name}
        scoreDisplay={getScoreDisplay()}
      />

      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.holeContainer,
            {
              transform: [{ translateX }],
              opacity: cardOpacity,
            },
          ]}
        >
          <HoleCard
            hole={currentHole}
            onUpdateScore={updateHoleScore}
            onUpdateBool={updateHoleBool}
          />
        </Animated.View>
      </PanGestureHandler>

      <HoleSelector
        holes={holes}
        activeHoleNumbers={activeHoleNumbers}
        currentHoleIndex={currentHoleIndex}
        onSelectHole={navigateToHole}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  holeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: "center",
  },
});
