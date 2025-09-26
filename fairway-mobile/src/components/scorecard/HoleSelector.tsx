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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Hole</Text>
      <View style={styles.gridContainer}>
        {holes.map((hole, index) => {
          const isActive = activeHoleNumbers.includes(hole.number);
          const isCurrentHole = index === currentHoleIndex;
          const isCompleted = hole.strokes !== undefined;
          
          return (
            <TouchableOpacity
              key={hole.id}
              style={[
                styles.selector,
                isCurrentHole && styles.selectorActive,
                isCompleted && styles.selectorCompleted,
                !isActive && styles.selectorInactive
              ]}
              onPress={() => isActive ? onSelectHole(index) : null}
              disabled={!isActive}
            >
              <Text style={[
                styles.selectorText,
                isCurrentHole && styles.selectorTextActive,
                isCompleted && styles.selectorTextCompleted,
                !isActive && styles.selectorTextInactive
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
    paddingVertical: 20,
    paddingHorizontal: 16,
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
  selectorInactive: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
    opacity: 0.5,
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
  selectorTextInactive: {
    color: '#CCCCCC',
  },
});