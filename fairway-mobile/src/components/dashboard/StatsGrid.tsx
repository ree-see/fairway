import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoundStatistics } from '../../types/api';

interface StatsGridProps {
  statistics?: RoundStatistics;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ statistics }) => {
  console.log('📱 StatsGrid received statistics:', statistics);
  console.log('📱 StatsGrid total_rounds value:', statistics?.total_rounds);
  
  const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
      return '--';
    }
    return Number(value).toFixed(decimals);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Golf Stats</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics?.total_rounds || 0}</Text>
          <Text style={styles.statLabel}>Rounds Played</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics?.verified_rounds || 0}</Text>
          <Text style={styles.statLabel}>Verified Rounds</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatNumber(statistics?.average_score)}
          </Text>
          <Text style={styles.statLabel}>Average Score</Text>
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
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});