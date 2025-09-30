import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface QuickActionsProps {
  onStartNewRound: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onStartNewRound }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.primaryButton} onPress={onStartNewRound}>
        <Text style={styles.primaryButtonText}>⛳ Start New Round</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});