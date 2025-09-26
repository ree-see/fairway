import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ScorecardDisplayOptions {
  showPutts: boolean;
  showFIR: boolean;
  showGIR: boolean;
}

interface ScorecardOptionsProps {
  displayOptions: ScorecardDisplayOptions;
  onToggleOption: (option: keyof ScorecardDisplayOptions) => void;
}

export const ScorecardOptions: React.FC<ScorecardOptionsProps> = ({ 
  displayOptions, 
  onToggleOption 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Scorecard Options</Text>
      
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.toggleButton, displayOptions.showPutts && styles.toggleButtonActive]}
          onPress={() => onToggleOption('showPutts')}
        >
          <Text style={[styles.toggleButtonText, displayOptions.showPutts && styles.toggleButtonTextActive]}>
            Putts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, displayOptions.showFIR && styles.toggleButtonActive]}
          onPress={() => onToggleOption('showFIR')}
        >
          <Text style={[styles.toggleButtonText, displayOptions.showFIR && styles.toggleButtonTextActive]}>
            FIR
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, displayOptions.showGIR && styles.toggleButtonActive]}
          onPress={() => onToggleOption('showGIR')}
        >
          <Text style={[styles.toggleButtonText, displayOptions.showGIR && styles.toggleButtonTextActive]}>
            GIR
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#2E7D32',
  },
});