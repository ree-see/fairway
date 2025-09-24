import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

interface Hole {
  number: number;
  par: number;
  distance: number;
  stroke?: number;
  putts?: number;
  fairway_hit?: boolean;
  green_in_regulation?: boolean;
  up_and_down?: boolean;
}

const mockHoles: Hole[] = [
  { number: 1, par: 4, distance: 389 },
  { number: 2, par: 5, distance: 502 },
  { number: 3, par: 3, distance: 178 },
  { number: 4, par: 4, distance: 408 },
  { number: 5, par: 4, distance: 425 },
  { number: 6, par: 3, distance: 198 },
  { number: 7, par: 5, distance: 543 },
  { number: 8, par: 4, distance: 392 },
  { number: 9, par: 4, distance: 421 },
  { number: 10, par: 4, distance: 378 },
  { number: 11, par: 3, distance: 156 },
  { number: 12, par: 5, distance: 567 },
  { number: 13, par: 4, distance: 445 },
  { number: 14, par: 4, distance: 412 },
  { number: 15, par: 3, distance: 205 },
  { number: 16, par: 5, distance: 589 },
  { number: 17, par: 4, distance: 398 },
  { number: 18, par: 4, distance: 443 },
];

export const ScorecardScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { course } = route.params as any;
  const [holes, setHoles] = useState<Hole[]>(mockHoles);
  const [currentHole, setCurrentHole] = useState(1);

  const updateHoleScore = (holeNumber: number, field: 'stroke' | 'putts', value: string) => {
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
    return holes.reduce((total, hole) => total + (hole.stroke || 0), 0);
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
    const completedHoles = holes.filter(hole => hole.stroke).length;
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

  const handleSubmit = () => {
    Alert.alert(
      'Round Submitted!',
      `Total Score: ${getTotalScore()}\nScore to Par: ${getScoreToPar() > 0 ? '+' : ''}${getScoreToPar()}`,
      [{ text: 'OK', onPress: () => navigation.navigate('Home' as never) }]
    );
  };

  const renderHole = (hole: Hole) => (
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
            value={hole.stroke?.toString() || ''}
            onChangeText={(value) => updateHoleScore(hole.number, 'stroke', value)}
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
        <TouchableOpacity style={styles.submitButton} onPress={submitRound}>
          <Text style={styles.submitButtonText}>Submit Round</Text>
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});