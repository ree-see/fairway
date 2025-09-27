import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../services/ApiService';
import { RoundStatistics, Round, ApiError } from '../types/api';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorState } from '../components/common/ErrorState';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { QuickActions } from '../components/dashboard/QuickActions';
import { HandicapCards } from '../components/dashboard/HandicapCards';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { RecentRounds } from '../components/dashboard/RecentRounds';

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
      
      // DEBUGGING: Clear ALL cache to ensure fresh data for now
      console.log('🧹 Clearing all cache to debug user-specific stats issue');
      await ApiService.clearAllCache();
      
      // Load statistics and recent rounds in parallel
      const [statsResponse, roundsResponse] = await Promise.all([
        ApiService.getRoundStatistics(),
        ApiService.getRecentRounds(3)
      ]);

      if (statsResponse.success && roundsResponse.success) {
        console.log('🎯 Setting dashboard data - statistics:', statsResponse.data!.statistics);
        setDashboardData({
          statistics: statsResponse.data!.statistics,
          recent_rounds: roundsResponse.data!.rounds,
        });
        console.log('🎯 Dashboard data set successfully');
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const apiError = error as ApiError;
      
      // Handle authentication errors specifically
      if (apiError.message?.includes('refresh token') || apiError.status === 401) {
        setError('Session expired. Please log in again.');
        // Note: The auth context will handle the logout/redirect
      } else {
        setError(apiError.message || 'Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear user cache only on manual refresh to ensure fresh data
      await ApiService.clearUserCache();
      await loadDashboardData();
    } catch (error) {
      console.error('Error during refresh:', error);
      setError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const navigateToNewRound = () => {
    navigation.navigate('CourseSelect' as never);
  };

  const navigateToRoundDetail = (roundId: string) => {
    navigation.navigate('RoundDetail' as never, { roundId } as never);
  };


  if (isLoading) {
    return <LoadingScreen message="Loading your golf data..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadDashboardData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <DashboardHeader 
        firstName={user?.first_name}
        onLogout={handleLogout}
      />

      <QuickActions onStartNewRound={navigateToNewRound} />

      <HandicapCards 
        handicapIndex={dashboardData?.statistics?.handicap_index}
        verifiedHandicap={dashboardData?.statistics?.verified_handicap}
      />

      <StatsGrid statistics={dashboardData?.statistics} />

      <RecentRounds 
        rounds={dashboardData?.recent_rounds || []}
        onRoundPress={navigateToRoundDetail}
        recentTrend={dashboardData?.statistics?.recent_trend}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});