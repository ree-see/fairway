import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface ScoreHeaderProps {
  courseName: string;
  scoreDisplay: string;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  courseName,
  scoreDisplay
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseLabel}>ROUND</Text>
          <Text style={styles.courseName} numberOfLines={1}>{courseName}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreDisplay}>{scoreDisplay}</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1B5E20',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseInfo: {
    flex: 1,
    marginRight: 16,
  },
  courseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.2,
    marginTop: 2,
  },
});