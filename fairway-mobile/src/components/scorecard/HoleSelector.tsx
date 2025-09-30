import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ScoringHole {
  id: string;
  number: number;
  strokes?: number;
}

interface HoleSelectorProps {
  holes: ScoringHole[];
  activeHoleNumbers: number[];
  currentHoleIndex: number;
  onSelectHole: (index: number) => void;
}

export const HoleSelector: React.FC<HoleSelectorProps> = ({
  holes,
  activeHoleNumbers,
  currentHoleIndex,
  onSelectHole
}) => {
  // Filter to only show active holes
  const activeHoles = holes.filter(hole => activeHoleNumbers.includes(hole.number));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Hole</Text>
      <View style={styles.gridContainer}>
        {activeHoles.map((hole) => {
          const holeIndex = holes.findIndex(h => h.number === hole.number);
          const isCurrentHole = holeIndex === currentHoleIndex;
          const isCompleted = hole.strokes !== undefined;

          return (
            <TouchableOpacity
              key={hole.id}
              style={[
                styles.selector,
                isCurrentHole && styles.selectorActive,
                isCompleted && styles.selectorCompleted,
              ]}
              onPress={() => onSelectHole(holeIndex)}
            >
              <Text style={[
                styles.selectorText,
                isCurrentHole && styles.selectorTextActive,
                isCompleted && styles.selectorTextCompleted,
              ]}>
                {hole.number}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  selector: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectorActive: {
    backgroundColor: '#C41E3A',
    borderColor: '#C41E3A',
  },
  selectorCompleted: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  selectorTextCompleted: {
    color: '#2E7D32',
  },
});