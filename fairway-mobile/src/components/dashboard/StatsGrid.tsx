import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoundStatistics } from '../../types/api';
import { useTheme } from '../../contexts/ThemeContext';

interface StatsGridProps {
  statistics?: RoundStatistics;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ statistics }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});