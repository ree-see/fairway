import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RoundTypeSelectorProps {
  roundType: '9' | '18' | null;
  nineHoleOption: 'front' | 'back' | null;
  onRoundTypeChange: (type: '9' | '18') => void;
  onNineHoleOptionChange: (option: 'front' | 'back') => void;
}

export const RoundTypeSelector: React.FC<RoundTypeSelectorProps> = ({
  roundType,
  nineHoleOption,
  onRoundTypeChange,
  onNineHoleOptionChange
}) => {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Round Type</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionButton, roundType === '9' && styles.optionButtonSelected]}
            onPress={() => onRoundTypeChange('9')}
          >
            <Text style={[styles.optionButtonText, roundType === '9' && styles.optionButtonTextSelected]}>
              9 Holes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.optionButton, roundType === '18' && styles.optionButtonSelected]}
            onPress={() => onRoundTypeChange('18')}
          >
            <Text style={[styles.optionButtonText, roundType === '18' && styles.optionButtonTextSelected]}>
              18 Holes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {roundType === '9' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which Nine?</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.optionButton, nineHoleOption === 'front' && styles.optionButtonSelected]}
              onPress={() => onNineHoleOptionChange('front')}
            >
              <Text style={[styles.optionButtonText, nineHoleOption === 'front' && styles.optionButtonTextSelected]}>
                Front 9
              </Text>
              <Text style={styles.optionButtonSubtext}>Holes 1-9</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, nineHoleOption === 'back' && styles.optionButtonSelected]}
              onPress={() => onNineHoleOptionChange('back')}
            >
              <Text style={[styles.optionButtonText, nineHoleOption === 'back' && styles.optionButtonTextSelected]}>
                Back 9
              </Text>
              <Text style={styles.optionButtonSubtext}>Holes 10-18</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  optionButtonTextSelected: {
    color: '#2E7D32',
  },
  optionButtonSubtext: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
});