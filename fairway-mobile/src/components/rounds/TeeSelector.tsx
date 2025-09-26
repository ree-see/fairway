import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TeeBox {
  color: string;
  name: string;
  distance: number;
}

interface TeeSelectorProps {
  teeOptions: TeeBox[];
  selectedTees: string;
  onTeeSelect: (color: string) => void;
}

export const TeeSelector: React.FC<TeeSelectorProps> = ({ 
  teeOptions, 
  selectedTees, 
  onTeeSelect 
}) => {
  const getTeeColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      black: '#000000',
      blue: '#2196F3',
      white: '#FFFFFF',
      red: '#F44336',
    };
    return colorMap[color] || '#FFFFFF';
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tee Selection</Text>
      {teeOptions.map((tee) => (
        <TouchableOpacity
          key={tee.color}
          style={[styles.teeOption, selectedTees === tee.color && styles.teeOptionSelected]}
          onPress={() => onTeeSelect(tee.color)}
        >
          <View style={styles.teeRow}>
            <View style={[styles.teeColorIndicator, { backgroundColor: getTeeColor(tee.color) }]} />
            <View style={styles.teeInfo}>
              <Text style={[styles.teeOptionText, selectedTees === tee.color && styles.teeOptionTextSelected]}>
                {tee.name}
              </Text>
              <Text style={styles.teeDistance}>{tee.distance} yards</Text>
            </View>
          </View>
          {selectedTees === tee.color && (
            <Text style={styles.selectedIndicator}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
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
  teeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teeOptionSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
  },
  teeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teeColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  teeInfo: {
    flex: 1,
  },
  teeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  teeOptionTextSelected: {
    color: '#2E7D32',
  },
  teeDistance: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  selectedIndicator: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
});