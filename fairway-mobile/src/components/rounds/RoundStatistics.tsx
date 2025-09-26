import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Round } from '../../types/api';

interface RoundStatisticsProps {
  round: Round;
}

export const RoundStatistics: React.FC<RoundStatisticsProps> = ({ round }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Round Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{round.total_strokes || '--'}</Text>
          <Text style={styles.statLabel}>Total Score</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{round.total_putts || '--'}</Text>
          <Text style={styles.statLabel}>Total Putts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{round.fairways_hit || 0}</Text>
          <Text style={styles.statLabel}>Fairways Hit</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{round.greens_in_regulation || 0}</Text>
          <Text style={styles.statLabel}>Greens in Reg</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, round.is_verified ? styles.verifiedBadge : styles.provisionalBadge]}>
          <Ionicons 
            name={round.is_verified ? "checkmark-circle" : "time"} 
            size={16} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusText}>
            {round.is_verified ? 'Verified' : 'Provisional'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  statusRow: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  provisionalBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});