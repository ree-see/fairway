import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";

interface ScoreHeaderProps {
  courseName: string;
  scoreDisplay: string;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  courseName,
  scoreDisplay,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseLabel}>ROUND</Text>
          <Text style={styles.courseName} numberOfLines={2}>
            {courseName}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text
            style={styles.scoreDisplay}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.5}
          >
            {scoreDisplay}
          </Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any, topInset: number) => StyleSheet.create({
  container: {
    backgroundColor: colors.success,
    paddingTop: topInset,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  courseInfo: {
    flex: 1,
    marginRight: 16,
  },
  courseLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scoreContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  scoreDisplay: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 40,
    width: 120,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 1.2,
    marginTop: 2,
  },
});
