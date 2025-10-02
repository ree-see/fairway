import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface ScoringHole {
  id: string;
  number: number;
  par: number;
  distance: number;
  strokes?: number;
  putts?: number;
  fairway_hit?: boolean;
  fairway_miss_type?: "out_of_bounds" | "hazard" | "rough" | null;
  fairway_miss_direction?: "left" | "right" | null;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
}

interface HoleCardProps {
  hole: ScoringHole;
  onUpdateScore: (field: "strokes" | "putts", value: string) => void;
  onUpdateBool: (
    field: "fairway_hit" | "green_in_regulation" | "up_and_down",
    value: boolean,
  ) => void;
  onUpdateMissType: (type: "out_of_bounds" | "hazard" | "rough" | null) => void;
  onUpdateMissDirection: (direction: "left" | "right" | null) => void;
}

export const HoleCard: React.FC<HoleCardProps> = ({
  hole,
  onUpdateScore,
  onUpdateBool,
  onUpdateMissType,
  onUpdateMissDirection,
}) => {
  const { colors } = useTheme();

  const getScoreToPar = () => {
    if (!hole.strokes) return null;
    const diff = hole.strokes - hole.par;
    if (diff === 0) return "E";
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const scoreToPar = getScoreToPar();

  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      {/* Hole Header */}
      <View style={styles.header}>
        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>HOLE {hole.number}</Text>
          <Text style={styles.holeDetails}>
            Par {hole.par} • {hole.distance} yards
          </Text>
        </View>
        {scoreToPar && (
          <View style={styles.scoreChip}>
            <Text style={styles.scoreChipText}>{scoreToPar}</Text>
          </View>
        )}
      </View>

      {/* Score Inputs */}
      <View style={styles.scoreSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>STROKES</Text>
          <TextInput
            style={styles.scoreInput}
            value={hole.strokes?.toString() || ""}
            onChangeText={(value) => onUpdateScore("strokes", value)}
            keyboardType="numeric"
            maxLength={2}
            placeholder="-"
            placeholderTextColor="#CCCCCC"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>PUTTS</Text>
          <TextInput
            style={styles.scoreInput}
            value={hole.putts?.toString() || ""}
            onChangeText={(value) => onUpdateScore("putts", value)}
            keyboardType="numeric"
            maxLength={2}
            placeholder="-"
            placeholderTextColor="#CCCCCC"
          />
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>HOLE STATS</Text>

        {hole.par >= 4 && (
          <>
            <TouchableOpacity
              style={[
                styles.statButton,
                hole.fairway_hit && styles.statButtonActive,
              ]}
              onPress={() => onUpdateBool("fairway_hit", !hole.fairway_hit)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  hole.fairway_hit && styles.checkboxActive,
                ]}
              >
                {hole.fairway_hit && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.statButtonText,
                  hole.fairway_hit && styles.statButtonTextActive,
                ]}
              >
                Fairway Hit
              </Text>
            </TouchableOpacity>

            {hole.fairway_hit === false && (
              <View style={styles.fairwayMissSection}>
                <Text style={styles.fairwayMissLabel}>Miss Details</Text>

                {/* Miss Direction */}
                <View style={styles.missButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.missButton,
                      hole.fairway_miss_direction === "left" &&
                        styles.missButtonActive,
                    ]}
                    onPress={() =>
                      onUpdateMissDirection(
                        hole.fairway_miss_direction === "left" ? null : "left",
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.missButtonText,
                        hole.fairway_miss_direction === "left" &&
                          styles.missButtonTextActive,
                      ]}
                    >
                      ← Left
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.missButton,
                      hole.fairway_miss_direction === "right" &&
                        styles.missButtonActive,
                    ]}
                    onPress={() =>
                      onUpdateMissDirection(
                        hole.fairway_miss_direction === "right"
                          ? null
                          : "right",
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.missButtonText,
                        hole.fairway_miss_direction === "right" &&
                          styles.missButtonTextActive,
                      ]}
                    >
                      Right →
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Miss Type */}
                <View style={styles.missButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.missButton,
                      hole.fairway_miss_type === "rough" &&
                        styles.missButtonActive,
                    ]}
                    onPress={() =>
                      onUpdateMissType(
                        hole.fairway_miss_type === "rough" ? null : "rough",
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.missButtonText,
                        hole.fairway_miss_type === "rough" &&
                          styles.missButtonTextActive,
                      ]}
                    >
                      Rough
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.missButton,
                      hole.fairway_miss_type === "hazard" &&
                        styles.missButtonActive,
                    ]}
                    onPress={() =>
                      onUpdateMissType(
                        hole.fairway_miss_type === "hazard" ? null : "hazard",
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.missButtonText,
                        hole.fairway_miss_type === "hazard" &&
                          styles.missButtonTextActive,
                      ]}
                    >
                      Hazard
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.missButton,
                      hole.fairway_miss_type === "out_of_bounds" &&
                        styles.missButtonActive,
                    ]}
                    onPress={() =>
                      onUpdateMissType(
                        hole.fairway_miss_type === "out_of_bounds"
                          ? null
                          : "out_of_bounds",
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.missButtonText,
                        hole.fairway_miss_type === "out_of_bounds" &&
                          styles.missButtonTextActive,
                      ]}
                    >
                      OB
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[
            styles.statButton,
            hole.green_in_regulation && styles.statButtonActive,
          ]}
          onPress={() =>
            onUpdateBool("green_in_regulation", !hole.green_in_regulation)
          }
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              hole.green_in_regulation && styles.checkboxActive,
            ]}
          >
            {hole.green_in_regulation && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text
            style={[
              styles.statButtonText,
              hole.green_in_regulation && styles.statButtonTextActive,
            ]}
          >
            Green in Regulation
          </Text>
        </TouchableOpacity>

        {!hole.green_in_regulation && (
          <TouchableOpacity
            style={[
              styles.statButton,
              hole.up_and_down && styles.statButtonActive,
            ]}
            onPress={() => onUpdateBool("up_and_down", !hole.up_and_down)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                hole.up_and_down && styles.checkboxActive,
              ]}
            >
              {hole.up_and_down && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text
              style={[
                styles.statButtonText,
                hole.up_and_down && styles.statButtonTextActive,
              ]}
            >
              Up & Down
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card.background,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 0,
    marginBottom: 24,
  },
  holeInfo: {
    flex: 1,
  },
  holeNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  holeDetails: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  scoreChip: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: "center",
  },
  scoreChipText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreSection: {
    flexDirection: "row",
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    alignItems: "center",
  },
  inputGroup: {
    flex: 1,
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  scoreInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    width: "100%",
    height: 64,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: colors.success,
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: colors.ui.divider,
    marginHorizontal: 20,
  },
  statsSection: {
    marginBottom: 0,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.button.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  statButtonActive: {
    backgroundColor: colors.button.active,
    borderColor: colors.button.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.ui.border,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.secondary,
  },
  checkboxActive: {
    backgroundColor: colors.button.primary,
    borderColor: colors.button.primary,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "bold",
  },
  statButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "600",
    flex: 1,
  },
  statButtonTextActive: {
    color: colors.button.primary,
  },
  fairwayMissSection: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  fairwayMissLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  missButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  missButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  missButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  missButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  missButtonTextActive: {
    color: colors.text.inverse,
  },
});
