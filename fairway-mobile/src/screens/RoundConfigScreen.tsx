import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Course } from '../types/api';

interface TeeBox {
  color: string;
  name: string;
  distance: number;
}

export const RoundConfigScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { course } = route.params as { course: Course };

  const [roundType, setRoundType] = useState<'9' | '18' | null>(null);
  const [nineHoleOption, setNineHoleOption] = useState<'front' | 'back' | null>(null);
  const [selectedTees, setSelectedTees] = useState<string>('white');

  // Common tee options - in a real app, this would come from course data
  const teeOptions: TeeBox[] = [
    { color: 'black', name: 'Championship Tees', distance: 7200 },
    { color: 'blue', name: 'Blue Tees', distance: 6800 },
    { color: 'white', name: 'White Tees', distance: 6400 },
    { color: 'red', name: 'Red Tees', distance: 5800 },
  ];

  const startRound = () => {
    if (!roundType) {
      Alert.alert('Round Type Required', 'Please select 9 holes or 18 holes');
      return;
    }

    if (roundType === '9' && !nineHoleOption) {
      Alert.alert('Nine Hole Selection', 'Please select front 9 or back 9');
      return;
    }

    const roundConfig = {
      course,
      roundType,
      nineHoleOption,
      selectedTees,
      totalHoles: roundType === '9' ? 9 : 18,
      startingHole: roundType === '9' && nineHoleOption === 'back' ? 10 : 1,
    };

    navigation.navigate('FocusedRound' as never, roundConfig as never);
  };

  const getTeeColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      black: '#000000',
      blue: '#2196F3',
      white: '#FFFFFF',
      red: '#F44336',
    };
    return colorMap[color] || '#FFFFFF';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Configure Your Round</Text>
          <Text style={styles.courseName}>{course.name}</Text>
        </View>

        {/* Round Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Type</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.optionButton, roundType === '9' && styles.optionButtonSelected]}
              onPress={() => {
                setRoundType('9');
                if (nineHoleOption === null) setNineHoleOption('front');
              }}
            >
              <Text style={[styles.optionButtonText, roundType === '9' && styles.optionButtonTextSelected]}>
                9 Holes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, roundType === '18' && styles.optionButtonSelected]}
              onPress={() => {
                setRoundType('18');
                setNineHoleOption(null);
              }}
            >
              <Text style={[styles.optionButtonText, roundType === '18' && styles.optionButtonTextSelected]}>
                18 Holes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nine Hole Options */}
        {roundType === '9' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Which Nine?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.optionButton, nineHoleOption === 'front' && styles.optionButtonSelected]}
                onPress={() => setNineHoleOption('front')}
              >
                <Text style={[styles.optionButtonText, nineHoleOption === 'front' && styles.optionButtonTextSelected]}>
                  Front 9
                </Text>
                <Text style={styles.optionButtonSubtext}>Holes 1-9</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.optionButton, nineHoleOption === 'back' && styles.optionButtonSelected]}
                onPress={() => setNineHoleOption('back')}
              >
                <Text style={[styles.optionButtonText, nineHoleOption === 'back' && styles.optionButtonTextSelected]}>
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
              style={[styles.teeOption, selectedTees === tee.color && styles.teeOptionSelected]}
              onPress={() => setSelectedTees(tee.color)}
            >
              <View style={styles.teeRow}>
                <View style={[styles.teeColorIndicator, { backgroundColor: getTeeColor(tee.color) }]} />
                <View style={styles.teeInfo}>
                  <Text style={[styles.teeOptionText, selectedTees === tee.color && styles.teeOptionTextSelected]}>
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={startRound}>
          <Text style={styles.startButtonText}>Start Round</Text>
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
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  optionButtonTextSelected: {
    color: '#2E7D32',
  },
  optionButtonSubtext: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  teeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teeOptionSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  teeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teeColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  teeInfo: {
    flex: 1,
  },
  teeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  teeOptionTextSelected: {
    color: '#2E7D32',
  },
  teeDistance: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  selectedIndicator: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  startButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});