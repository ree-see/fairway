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
    <View style={styles.header}>
      <Text style={styles.courseName}>{courseName}</Text>
      <Text style={styles.scoreDisplay}>{scoreDisplay}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 100 : 80,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  scoreDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});