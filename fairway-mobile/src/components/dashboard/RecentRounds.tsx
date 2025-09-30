import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Round } from '../../types/api';

interface RecentRoundsProps {
  rounds: Round[];
  onRoundPress: (roundId: string) => void;
  recentTrend?: string;
}

export const RecentRounds: React.FC<RecentRoundsProps> = ({ 
  rounds, 
  onRoundPress, 
  recentTrend 
}) => {
  const [isNavigating, setIsNavigating] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRoundPress = (roundId: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    onRoundPress(roundId);
    
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No rounds yet</Text>
      <Text style={styles.emptySubtext}>Start your first round to see it here</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Rounds</Text>
      
      {rounds.length ? (
        rounds.map((round) => (
          <TouchableOpacity 
            key={round.id} 
            style={styles.roundCard}
            onPress={() => handleRoundPress(round.id)}
          >
            <View style={styles.roundHeader}>
              <Text style={styles.courseName}>
                {round.course_name || 'Unknown Course'}
              </Text>
              <View style={styles.roundBadges}>
                {round.is_verified && (
                  <View style={styles.verifiedRoundBadge}>
                    <Text style={styles.verifiedRoundText}>✓</Text>
                  </View>
                )}
                <Text style={styles.roundScore}>{round.total_strokes || '--'}</Text>
              </View>
            </View>
            <Text style={styles.roundDate}>{formatDate(round.started_at)}</Text>
            {recentTrend && (
              <Text style={styles.trendText}>
                Trend: {recentTrend}
              </Text>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState />
      )}
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
  roundCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EEEEEE',
    flex: 1,
  },
  roundBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedRoundBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedRoundText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roundScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  roundDate: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  trendText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});