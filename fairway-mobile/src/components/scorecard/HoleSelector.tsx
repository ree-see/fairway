import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, FlatList, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = 70;
const SPACING = 16;

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
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const activeHoles = holes.filter(hole => activeHoleNumbers.includes(hole.number));

  // Auto-scroll to current hole when it changes
  useEffect(() => {
    if (flatListRef.current && activeHoles.length > 0) {
      const activeIndex = activeHoles.findIndex(
        hole => holes.findIndex(h => h.number === hole.number) === currentHoleIndex
      );

      if (activeIndex !== -1) {
        flatListRef.current.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
    }
  }, [currentHoleIndex, activeHoles]);

  const renderHole = ({ item, index }: { item: ScoringHole; index: number }) => {
    const holeIndex = holes.findIndex(h => h.number === item.number);
    const isCurrentHole = holeIndex === currentHoleIndex;
    const isCompleted = item.strokes !== undefined && item.strokes > 0;

    const inputRange = [
      (index - 2) * (ITEM_SIZE + SPACING),
      (index - 1) * (ITEM_SIZE + SPACING),
      index * (ITEM_SIZE + SPACING),
      (index + 1) * (ITEM_SIZE + SPACING),
      (index + 2) * (ITEM_SIZE + SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 0.85, 1, 0.85, 0.7],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 0.7, 1, 0.7, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => onSelectHole(holeIndex)}
        activeOpacity={0.8}
        style={styles.itemContainer}
      >
        <Animated.View
          style={[
            styles.holeItem,
            isCurrentHole && styles.holeItemActive,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Text
            style={[
              styles.holeNumber,
              isCurrentHole && styles.holeNumberActive,
            ]}
          >
            {item.number}
          </Text>
          {isCompleted && <View style={styles.completedDot} />}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={activeHoles}
        renderItem={renderHole}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={ITEM_SIZE + SPACING}
        decelerationRate="fast"
        snapToAlignment="center"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: ITEM_SIZE + SPACING,
          offset: (ITEM_SIZE + SPACING) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    height: 120,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_WIDTH / 2 - ITEM_SIZE / 2,
    alignItems: 'center',
  },
  itemContainer: {
    width: ITEM_SIZE + SPACING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holeItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
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
  },
  holeNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
  },
  holeNumberActive: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  completedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});