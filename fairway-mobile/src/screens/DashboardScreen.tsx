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
import { AuthService } from '../services/auth';

interface UserStats {
  rounds_played: number;
  verified_rounds: number;
  handicap_index?: number;
  verified_handicap?: number;
  average_score?: number;
  recent_rounds: Array<{
    id: string;
    course_name: string;
    total_strokes: number;
    started_at: string;
    is_verified: boolean;
  }>;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const authService = new AuthService();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // This would call the /api/v1/auth/stats endpoint
      // For now, we'll use mock data
      const mockStats: UserStats = {
        rounds_played: 12,
        verified_rounds: 8,
        handicap_index: 15.4,
        verified_handicap: 14.8,
        average_score: 88.2,
        recent_rounds: [
          {
            id: '1',
            course_name: 'Pebble Beach Golf Links',
            total_strokes: 85,
            started_at: '2023-12-20T10:00:00Z',
            is_verified: true,
          },
          {
            id: '2',
            course_name: 'Torrey Pines South',
            total_strokes: 92,
            started_at: '2023-12-15T09:30:00Z',
            is_verified: false,
          },
        ],
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.primaryButtonText}>Start New Round</Text>
        </TouchableOpacity>
      </View>

      {/* Handicap Cards */}
      <View style={styles.handicapSection}>
        <Text style={styles.sectionTitle}>Your Handicap</Text>
        
        <View style={styles.handicapCards}>
          <View style={styles.handicapCard}>
            <Text style={styles.handicapLabel}>Provisional</Text>
            <Text style={styles.handicapValue}>
              {stats?.handicap_index?.toFixed(1) || '--'}
            </Text>
          </View>
          
          <View style={[styles.handicapCard, styles.verifiedCard]}>
            <Text style={styles.handicapLabel}>Verified</Text>
            <Text style={styles.handicapValue}>
              {stats?.verified_handicap?.toFixed(1) || '--'}
            </Text>
            {stats?.verified_handicap && (
              <Text style={styles.verifiedBadge}>✓ VERIFIED</Text>
            )}
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.rounds_played || 0}</Text>
            <Text style={styles.statLabel}>Rounds Played</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.verified_rounds || 0}</Text>
            <Text style={styles.statLabel}>Verified Rounds</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats?.average_score?.toFixed(1) || '--'}
            </Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
        </View>
      </View>

      {/* Recent Rounds */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Rounds</Text>
        
        {stats?.recent_rounds?.length ? (
          stats.recent_rounds.map((round) => (
            <View key={round.id} style={styles.roundCard}>
              <View style={styles.roundHeader}>
                <Text style={styles.courseName}>{round.course_name}</Text>
                <View style={styles.roundBadges}>
                  {round.is_verified && (
                    <View style={styles.verifiedRoundBadge}>
                      <Text style={styles.verifiedRoundText}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.roundScore}>{round.total_strokes}</Text>
                </View>
              </View>
              <Text style={styles.roundDate}>{formatDate(round.started_at)}</Text>
            </View>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
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

export default DashboardScreen;