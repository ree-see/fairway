import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Round } from '../../types/api';
import { theme } from '../../theme';

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
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.xl,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statusRow: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.badge,
    gap: theme.spacing.sm,
  },
  verifiedBadge: {
    backgroundColor: theme.colors.status.success,
  },
  provisionalBadge: {
    backgroundColor: theme.colors.status.warning,
  },
  statusText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});