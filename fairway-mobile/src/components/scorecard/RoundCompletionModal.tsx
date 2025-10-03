import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface RoundCompletionModalProps {
  visible: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDiscard: () => void;
  scoreData: {
    score: number;
    par: number;
    fairways: number;
    greens: number;
  };
  isSubmitting: boolean;
}

export const RoundCompletionModal: React.FC<RoundCompletionModalProps> = ({
  visible,
  onSave,
  onEdit,
  onDiscard,
  scoreData,
  isSubmitting,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  const scoreToPar = scoreData.score - scoreData.par;
  const scoreToParText = scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onEdit}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.title}>Round Complete!</Text>
            <Text style={styles.subtitle}>
              Great round! Here's your summary
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Total Score</Text>
                <Text style={styles.scoreValue}>{scoreData.score}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Score to Par</Text>
                <Text style={[styles.scoreValue, styles.scoreToParValue]}>
                  {scoreToParText}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flag-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.statLabel}>Fairways</Text>
                <Text style={styles.statValue}>{scoreData.fairways}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="golf-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.statLabel}>GIR</Text>
                <Text style={styles.statValue}>{scoreData.greens}</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={onSave}
              disabled={isSubmitting}
              activeOpacity={0.7}
              accessibilityLabel="Save round"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.buttonText}>Save Round</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={onEdit}
              disabled={isSubmitting}
              activeOpacity={0.7}
              accessibilityLabel="Edit round"
            >
              <Text style={styles.buttonText}>Edit Scores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={onDiscard}
              disabled={isSubmitting}
              activeOpacity={0.7}
              accessibilityLabel="Discard round"
            >
              <Text style={styles.buttonText}>Discard Round</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.ui.border,
    marginHorizontal: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scoreToParValue: {
    color: colors.success,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
