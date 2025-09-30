import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOLE_ITEM_WIDTH = 60;
const HOLE_ITEM_SPACING = 12;

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
  const scrollViewRef = useRef<ScrollView>(null);
  const activeHoles = holes.filter(hole => activeHoleNumbers.includes(hole.number));

  // Auto-scroll to current hole when it changes
  useEffect(() => {
    if (scrollViewRef.current && activeHoles.length > 0) {
      const activeIndex = activeHoles.findIndex(
        hole => holes.findIndex(h => h.number === hole.number) === currentHoleIndex
      );

      if (activeIndex !== -1) {
        const scrollPosition = activeIndex * (HOLE_ITEM_WIDTH + HOLE_ITEM_SPACING) -
                             (SCREEN_WIDTH / 2) + (HOLE_ITEM_WIDTH / 2);

        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }
    }
  }, [currentHoleIndex, activeHoles]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={HOLE_ITEM_WIDTH + HOLE_ITEM_SPACING}
        snapToAlignment="center"
      >
        {activeHoles.map((hole) => {
          const holeIndex = holes.findIndex(h => h.number === hole.number);
          const isCurrentHole = holeIndex === currentHoleIndex;
          const isCompleted = hole.strokes !== undefined && hole.strokes > 0;

          return (
            <TouchableOpacity
              key={hole.id}
              style={[
                styles.holeItem,
                isCurrentHole && styles.holeItemActive,
              ]}
              onPress={() => onSelectHole(holeIndex)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.holeNumber,
                isCurrentHole && styles.holeNumberActive,
              ]}>
                {hole.number}
              </Text>
              {isCompleted && (
                <View style={styles.completedDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - HOLE_ITEM_WIDTH) / 2,
    gap: HOLE_ITEM_SPACING,
  },
  holeItem: {
    width: HOLE_ITEM_WIDTH,
    height: HOLE_ITEM_WIDTH,
    borderRadius: HOLE_ITEM_WIDTH / 2,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  holeItemActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
    transform: [{ scale: 1.15 }],
  },
  holeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
  },
  holeNumberActive: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  completedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
});