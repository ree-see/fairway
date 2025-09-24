import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../services/ApiService';
import { RoundStatistics, Round, ApiError } from '../types/api';

interface DashboardData {
  statistics: RoundStatistics;
  recent_rounds: Round[];
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Clear cache to ensure fresh data
      await ApiService.clearAllCache();
      
      // Load statistics and recent rounds in parallel
      const [statsResponse, roundsResponse] = await Promise.all([
        ApiService.getRoundStatistics(),
        ApiService.getRecentRounds(3)
      ]);

      // Debug: Log the recent rounds data
      console.log('Dashboard recent rounds data:', roundsResponse.data?.rounds);

      if (statsResponse.success && roundsResponse.success) {
        setDashboardData({
          statistics: statsResponse.data!.statistics,
          recent_rounds: roundsResponse.data!.rounds,
        });
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const navigateToNewRound = () => {
    navigation.navigate('CourseSelect' as never);
  };

  const navigateToRoundDetail = (roundId: string) => {
    console.log('Navigating to round detail with roundId:', roundId);
    // Use push instead of navigate to force a new screen instance
    navigation.push('RoundDetail' as never, { roundId } as never);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
      return '--';
    }
    return Number(value).toFixed(decimals);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your golf data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.first_name}!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={navigateToNewRound}>
          <Text style={styles.primaryButtonText}>⛳ Start New Round</Text>
        </TouchableOpacity>
      </View>

      {/* Handicap Cards */}
      <View style={styles.handicapSection}>
        <Text style={styles.sectionTitle}>Your Handicap Index</Text>
        
        <View style={styles.handicapCards}>
          <View style={styles.handicapCard}>
            <Text style={styles.handicapLabel}>Provisional</Text>
            <Text style={styles.handicapValue}>
              {formatNumber(dashboardData?.statistics?.handicap_index)}
            </Text>
            <Text style={styles.handicapNote}>Based on all rounds</Text>
          </View>
          
          <View style={[styles.handicapCard, styles.verifiedCard]}>
            <Text style={styles.handicapLabel}>Verified</Text>
            <Text style={styles.handicapValue}>
              {formatNumber(dashboardData?.statistics?.verified_handicap)}
            </Text>
            {dashboardData?.statistics.verified_handicap && (
              <Text style={styles.verifiedBadge}>✅ VERIFIED</Text>
            )}
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Golf Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData?.statistics.total_rounds || 0}</Text>
            <Text style={styles.statLabel}>Rounds Played</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardData?.statistics.verified_rounds || 0}</Text>
            <Text style={styles.statLabel}>Verified Rounds</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatNumber(dashboardData?.statistics?.average_score)}
            </Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
        </View>
      </View>

      {/* Recent Rounds */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Rounds</Text>
        
        {dashboardData?.recent_rounds?.length ? (
          dashboardData.recent_rounds.map((round) => (
            <TouchableOpacity 
              key={round.id} 
              style={styles.roundCard}
              onPress={() => {
                console.log('Round card pressed, round object:', round);
                console.log('Round ID being passed:', round.id);
                navigateToRoundDetail(round.id);
              }}
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
              {dashboardData.statistics.recent_trend && (
                <Text style={styles.trendText}>
                  Trend: {dashboardData.statistics.recent_trend}
                </Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No rounds yet</Text>
            <Text style={styles.emptySubtext}>Start your first round to see it here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  handicapSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  handicapCards: {
    flexDirection: 'row',
    gap: 12,
  },
  handicapCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  handicapLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  handicapValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  handicapNote: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
  },
  verifiedBadge: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsSection: {
    padding: 20,
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
  recentSection: {
    padding: 20,
  },
  roundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: '#333333',
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
    color: '#2E7D32',
  },
  roundDate: {
    fontSize: 14,
    color: '#666666',
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
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});