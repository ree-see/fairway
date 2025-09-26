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
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.holeNumber}>Hole {hole.number}</Text>
        <Text style={styles.holeDetails}>Par {hole.par} • {hole.distance}yd</Text>
      </View>
      
      <View style={styles.scoreRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Strokes</Text>
          <TextInput
            style={styles.scoreInput}
            value={hole.strokes?.toString() || ''}
            onChangeText={(value) => onUpdateScore('strokes', value)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Putts</Text>
          <TextInput
            style={styles.scoreInput}
            value={hole.putts?.toString() || ''}
            onChangeText={(value) => onUpdateScore('putts', value)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>

      {hole.par >= 4 && (
        <TouchableOpacity
          style={[styles.boolButton, hole.fairway_hit && styles.boolButtonActive]}
          onPress={() => onUpdateBool('fairway_hit', !hole.fairway_hit)}
        >
          <Text style={[styles.boolButtonText, hole.fairway_hit && styles.boolButtonTextActive]}>
            Fairway Hit
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.boolButton, hole.green_in_regulation && styles.boolButtonActive]}
        onPress={() => onUpdateBool('green_in_regulation', !hole.green_in_regulation)}
      >
        <Text style={[styles.boolButtonText, hole.green_in_regulation && styles.boolButtonTextActive]}>
          Green in Regulation
        </Text>
      </TouchableOpacity>

      {!hole.green_in_regulation && (
        <TouchableOpacity
          style={[styles.boolButton, hole.up_and_down && styles.boolButtonActive]}
          onPress={() => onUpdateBool('up_and_down', !hole.up_and_down)}
        >
          <Text style={[styles.boolButtonText, hole.up_and_down && styles.boolButtonTextActive]}>
            Up & Down
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
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
});