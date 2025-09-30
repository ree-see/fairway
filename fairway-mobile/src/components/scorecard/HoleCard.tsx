import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

interface ScoringHole {
  id: string;
  number: number;
  par: number;
  distance: number;
  strokes?: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
}

interface HoleCardProps {
  hole: ScoringHole;
  onUpdateScore: (field: 'strokes' | 'putts', value: string) => void;
  onUpdateBool: (field: 'fairway_hit' | 'green_in_regulation' | 'up_and_down', value: boolean) => void;
}

export const HoleCard: React.FC<HoleCardProps> = ({
  hole,
  onUpdateScore,
  onUpdateBool
}) => {
  const getScoreToPar = () => {
    if (!hole.strokes) return null;
    const diff = hole.strokes - hole.par;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const scoreToPar = getScoreToPar();

  return (
    <View style={styles.card}>
      {/* Hole Header */}
      <View style={styles.header}>
        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>HOLE {hole.number}</Text>
          <Text style={styles.holeDetails}>Par {hole.par} • {hole.distance} yards</Text>
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
            value={hole.strokes?.toString() || ''}
            onChangeText={(value) => onUpdateScore('strokes', value)}
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
            value={hole.putts?.toString() || ''}
            onChangeText={(value) => onUpdateScore('putts', value)}
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
          <TouchableOpacity
            style={[styles.statButton, hole.fairway_hit && styles.statButtonActive]}
            onPress={() => onUpdateBool('fairway_hit', !hole.fairway_hit)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, hole.fairway_hit && styles.checkboxActive]}>
              {hole.fairway_hit && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.statButtonText, hole.fairway_hit && styles.statButtonTextActive]}>
              Fairway Hit
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.statButton, hole.green_in_regulation && styles.statButtonActive]}
          onPress={() => onUpdateBool('green_in_regulation', !hole.green_in_regulation)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, hole.green_in_regulation && styles.checkboxActive]}>
            {hole.green_in_regulation && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.statButtonText, hole.green_in_regulation && styles.statButtonTextActive]}>
            Green in Regulation
          </Text>
        </TouchableOpacity>

        {!hole.green_in_regulation && (
          <TouchableOpacity
            style={[styles.statButton, hole.up_and_down && styles.statButtonActive]}
            onPress={() => onUpdateBool('up_and_down', !hole.up_and_down)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, hole.up_and_down && styles.checkboxActive]}>
              {hole.up_and_down && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.statButtonText, hole.up_and_down && styles.statButtonTextActive]}>
              Up & Down
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Swipe Hint */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
        <Text style={styles.swipeText}>Swipe to navigate holes</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  holeInfo: {
    flex: 1,
  },
  holeNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  holeDetails: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  scoreChip: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  scoreChipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreSection: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    alignItems: 'center',
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  scoreInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    height: 64,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    flex: 1,
  },
  statButtonTextActive: {
    color: '#1B5E20',
  },
  swipeHint: {
    alignItems: 'center',
    paddingTop: 12,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  swipeText: {
    fontSize: 12,
    color: '#BBBBBB',
    fontWeight: '500',
  },
});