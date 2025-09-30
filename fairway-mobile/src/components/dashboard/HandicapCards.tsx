import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HandicapCardsProps {
  handicapIndex?: number | null;
  verifiedHandicap?: number | null;
}

export const HandicapCards: React.FC<HandicapCardsProps> = ({ 
  handicapIndex, 
  verifiedHandicap 
}) => {
  const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
      return '--';
    }
    return Number(value).toFixed(decimals);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Handicap Index</Text>
      
      <View style={styles.handicapCards}>
        <View style={styles.handicapCard}>
          <Text style={styles.handicapLabel}>Provisional</Text>
          <Text style={styles.handicapValue}>
            {formatNumber(handicapIndex)}
          </Text>
          <Text style={styles.handicapNote}>Based on all rounds</Text>
        </View>
        
        <View style={[styles.handicapCard, styles.verifiedCard]}>
          <Text style={styles.handicapLabel}>Verified</Text>
          <Text style={styles.handicapValue}>
            {formatNumber(verifiedHandicap)}
          </Text>
          {verifiedHandicap && (
            <Text style={styles.verifiedBadge}>✅ VERIFIED</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EEEEEE',
    marginBottom: 16,
  },
  handicapCards: {
    flexDirection: 'row',
    gap: 12,
  },
  handicapCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  handicapLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  handicapValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  handicapNote: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
  },
  verifiedBadge: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
});