import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RoundConfigHeaderProps {
  courseName: string;
}

export const RoundConfigHeader: React.FC<RoundConfigHeaderProps> = ({ courseName }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Configure Your Round</Text>
      <Text style={styles.courseName}>{courseName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});