import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CourseInfoProps {
  courseName: string;
  startedAt: string;
  completedAt?: string;
}

export const CourseInfo: React.FC<CourseInfoProps> = ({ 
  courseName, 
  startedAt, 
  completedAt 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.courseName}>{courseName}</Text>
      <Text style={styles.roundDate}>{formatDate(startedAt)}</Text>
      <Text style={styles.roundTime}>Started at {formatTime(startedAt)}</Text>
      {completedAt && (
        <Text style={styles.roundTime}>Finished at {formatTime(completedAt)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  roundDate: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  roundTime: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 2,
  },
});