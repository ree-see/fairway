import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Course, DetailedCourse } from "../types/api";
import { theme } from "../theme";
import ApiService from "../services/ApiService";

interface TeeBox {
  color: string;
  name: string;
  distance: number;
}

export const RoundConfigScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { course } = route.params as { course: Course };

  const [roundType, setRoundType] = useState<"9" | "18" | null>(null);
  const [nineHoleOption, setNineHoleOption] = useState<"front" | "back" | null>(
    null,
  );
  const [selectedTees, setSelectedTees] = useState<string>("white");
  const [teeOptions, setTeeOptions] = useState<TeeBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourseDetails();
  }, []);

  const loadCourseDetails = async () => {
    try {
      const response = await ApiService.getCourse(course.id);
      if (response.success && response.data) {
        const detailedCourse: DetailedCourse = response.data.course;
        const tees = calculateTeeOptions(detailedCourse);
        setTeeOptions(tees);
      }
    } catch (error) {
      console.error("Error loading course details:", error);
      // Fallback to basic tee options
      setTeeOptions([
        {
          color: "white",
          name: "White Tees",
          distance: course.total_yardage || 6400,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTeeOptions = (detailedCourse: DetailedCourse): TeeBox[] => {
    if (!detailedCourse.holes || detailedCourse.holes.length === 0) {
      return [
        {
          color: "white",
          name: "White Tees",
          distance: course.total_yardage || 6400,
        },
      ];
    }

    const teeColors: {
      [key: string]: { name: string; total: number; count: number };
    } = {
      black: { name: "Championship Tees", total: 0, count: 0 },
      blue: { name: "Blue Tees", total: 0, count: 0 },
      white: { name: "White Tees", total: 0, count: 0 },
      red: { name: "Red Tees", total: 0, count: 0 },
      gold: { name: "Gold Tees", total: 0, count: 0 },
    };

    // Sum yardages for each tee color
    detailedCourse.holes.forEach((hole) => {
      Object.keys(teeColors).forEach((color) => {
        const yardage = hole.yardages[color as keyof typeof hole.yardages];
        if (yardage) {
          teeColors[color].total += yardage;
          teeColors[color].count++;
        }
      });
    });

    // Only include tees that have data for all 18 holes
    const availableTees: TeeBox[] = [];
    Object.entries(teeColors).forEach(([color, data]) => {
      if (data.count === 18) {
        availableTees.push({
          color,
          name: data.name,
          distance: data.total,
        });
      }
    });

    return availableTees.length > 0
      ? availableTees
      : [
          {
            color: "white",
            name: "White Tees",
            distance: course.total_yardage || 6400,
          },
        ];
  };

  const startRound = () => {
    if (!roundType) {
      Alert.alert("Round Type Required", "Please select 9 holes or 18 holes");
      return;
    }

    if (roundType === "9" && !nineHoleOption) {
      Alert.alert("Nine Hole Selection", "Please select front 9 or back 9");
      return;
    }

    const roundConfig = {
      course,
      roundType,
      nineHoleOption,
      selectedTees,
      totalHoles: roundType === "9" ? 9 : 18,
      startingHole: roundType === "9" && nineHoleOption === "back" ? 10 : 1,
    };

    navigation.navigate("FocusedRound" as never, roundConfig as never);
  };

  const getTeeColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      black: "#000000",
      blue: "#2196F3",
      white: "#FFFFFF",
      red: "#F44336",
      gold: "#FFD700",
    };
    return colorMap[color] || "#FFFFFF";
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Set up your round</Text>
          <Text style={styles.courseName}>{course.name}</Text>
        </View>

        {/* Round Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Type</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                roundType === "9" && styles.optionButtonSelected,
              ]}
              onPress={() => {
                setRoundType("9");
                if (nineHoleOption === null) setNineHoleOption("front");
              }}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  roundType === "9" && styles.optionButtonTextSelected,
                ]}
              >
                9 Holes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                roundType === "18" && styles.optionButtonSelected,
              ]}
              onPress={() => {
                setRoundType("18");
                setNineHoleOption(null);
              }}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  roundType === "18" && styles.optionButtonTextSelected,
                ]}
              >
                18 Holes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nine Hole Options */}
        {roundType === "9" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Which Nine?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  nineHoleOption === "front" && styles.optionButtonSelected,
                ]}
                onPress={() => setNineHoleOption("front")}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    nineHoleOption === "front" &&
                      styles.optionButtonTextSelected,
                  ]}
                >
                  Front 9
                </Text>
                <Text style={styles.optionButtonSubtext}>Holes 1-9</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  nineHoleOption === "back" && styles.optionButtonSelected,
                ]}
                onPress={() => setNineHoleOption("back")}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    nineHoleOption === "back" &&
                      styles.optionButtonTextSelected,
                  ]}
                >
                  Back 9
                </Text>
                <Text style={styles.optionButtonSubtext}>Holes 10-18</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tee Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tee Selection</Text>
          {teeOptions.map((tee) => (
            <TouchableOpacity
              key={tee.color}
              style={[
                styles.teeOption,
                selectedTees === tee.color && styles.teeOptionSelected,
              ]}
              onPress={() => setSelectedTees(tee.color)}
            >
              <View style={styles.teeRow}>
                <View
                  style={[
                    styles.teeColorIndicator,
                    { backgroundColor: getTeeColor(tee.color) },
                  ]}
                />
                <View style={styles.teeInfo}>
                  <Text
                    style={[
                      styles.teeOptionText,
                      selectedTees === tee.color &&
                        styles.teeOptionTextSelected,
                    ]}
                  >
                    {tee.name}
                  </Text>
                  <Text style={styles.teeDistance}>{tee.distance} yards</Text>
                </View>
              </View>
              {selectedTees === tee.color && (
                <Text style={styles.selectedIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.startButton} onPress={startRound}>
        <Text style={styles.startButtonText}>Start Round</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.lg,
    paddingTop: 60,
    borderBottomLeftRadius: theme.radius.card,
    borderBottomRightRadius: theme.radius.card,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  courseName: {
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.md,
    color: "#F44336",
  },
  section: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  optionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonSelected: {
    borderColor: "#F44336",
    borderWidth: 2,
  },
  optionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  optionButtonTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.bold,
  },
  optionButtonSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  teeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  teeOptionSelected: {
    borderColor: "#F44336",
    borderWidth: 2,
  },
  teeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teeColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  teeInfo: {
    flex: 1,
  },
  teeOptionText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  teeOptionTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.bold,
  },
  teeDistance: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  selectedIndicator: {
    fontSize: theme.fontSize.lg,
    color: "#F44336",
    fontWeight: theme.fontWeight.bold,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  startButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    width: "75%",
    alignSelf: "center",
    marginBottom: theme.spacing.xl,
  },
  startButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});
