import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme';

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
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.xl,
    marginBottom: 0,
    padding: theme.padding.card,
    borderRadius: theme.radius.card,
    ...theme.shadows.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.badge,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.background.tertiary,
    borderColor: theme.colors.primary.main,
  },
  toggleButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.semibold,
  },
  toggleButtonTextActive: {
    color: theme.colors.primary.main,
  },
});