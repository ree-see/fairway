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
import { theme } from '../theme';

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
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
  },
  courseName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary.light,
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
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  optionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  optionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  optionButtonTextSelected: {
    color: theme.colors.primary.main,
  },
  optionButtonSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  teeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teeOptionSelected: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
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
    color: theme.colors.primary.main,
  },
  teeDistance: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  selectedIndicator: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary.main,
    fontWeight: theme.fontWeight.bold,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
  },
  startButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  startButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});