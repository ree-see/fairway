import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import { Round, ApiError } from '../types/api';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorState } from '../components/common/ErrorState';
import { theme } from '../theme';

type FilterStatus = 'all' | 'completed' | 'in_progress' | 'verified';

export const RoundsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const LIMIT = 10;

  useEffect(() => {
    loadRounds(true);
  }, [filterStatus]);

  const loadRounds = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setOffset(0);
        setError(null);
      }

      const currentOffset = reset ? 0 : offset;
      const status = filterStatus === 'all' ? undefined : filterStatus;

      const response = await ApiService.getRounds(status, LIMIT, currentOffset);

      if (response.success && response.data) {
        const newRounds = response.data.rounds;

        if (reset) {
          setRounds(newRounds);
        } else {
          setRounds(prev => [...prev, ...newRounds]);
        }

        setHasMore(response.data.pagination?.has_more || false);
        setOffset(currentOffset + LIMIT);
      } else {
        setError('Failed to load rounds');
      }
    } catch (error) {
      console.error('Error loading rounds:', error);
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to load rounds');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      loadRounds(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRounds(true);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (round: Round) => {
    if (round.is_verified) {
      return (
        <View style={[styles.badge, styles.verifiedBadge]}>
          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>Verified</Text>
        </View>
      );
    } else if (round.status === 'in_progress') {
      return (
        <View style={[styles.badge, styles.inProgressBadge]}>
          <Ionicons name="time" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>In Progress</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.badge, styles.provisionalBadge]}>
          <Ionicons name="time" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>Provisional</Text>
        </View>
      );
    }
  };

  const renderRoundItem = ({ item }: { item: Round }) => {
    const coursePar = item.course_par || 72;
    const scoreToPar = (item.total_strokes || 0) - coursePar;

    return (
      <TouchableOpacity
        style={styles.roundCard}
        onPress={() => navigation.navigate('RoundDetail', { roundId: item.id })}
      >
        <View style={styles.roundHeader}>
          <Text style={styles.courseName} numberOfLines={1}>
            {item.course_name}
          </Text>
          {getStatusBadge(item)}
        </View>

        <View style={styles.roundDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.detailText}>{formatDate(item.started_at)}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{item.total_strokes || '--'}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Par</Text>
              <Text style={styles.scoreValue}>{coursePar}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text
                style={[
                  styles.scoreValue,
                  {
                    color:
                      scoreToPar > 0
                        ? theme.colors.status.error
                        : scoreToPar < 0
                        ? theme.colors.status.success
                        : theme.colors.status.info,
                  },
                ]}
              >
                {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="golf-outline" size={64} color={theme.colors.text.tertiary} />
        <Text style={styles.emptyText}>No rounds found</Text>
        <Text style={styles.emptySubtext}>
          {filterStatus === 'all'
            ? 'Start a new round to see it here'
            : `No ${filterStatus} rounds`}
        </Text>
      </View>
    );
  };

  if (isLoading && rounds.length === 0) {
    return <LoadingScreen message="Loading rounds..." />;
  }

  if (error && rounds.length === 0) {
    return <ErrorState error={error} onRetry={() => loadRounds(true)} />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('completed')}
        >
          <Text
            style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'in_progress' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('in_progress')}
        >
          <Text
            style={[styles.filterText, filterStatus === 'in_progress' && styles.filterTextActive]}
          >
            In Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'verified' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('verified')}
        >
          <Text style={[styles.filterText, filterStatus === 'verified' && styles.filterTextActive]}>
            Verified
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rounds List */}
      <FlatList
        data={rounds}
        renderItem={renderRoundItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    marginTop: theme.spacing.massive,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.input,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary.main,
  },
  filterText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  roundCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.card,
    padding: theme.padding.card,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  courseName: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.badge,
    gap: theme.spacing.xs,
  },
  verifiedBadge: {
    backgroundColor: theme.colors.status.success,
  },
  provisionalBadge: {
    backgroundColor: theme.colors.status.warning,
  },
  inProgressBadge: {
    backgroundColor: theme.colors.status.info,
  },
  badgeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.xxs,
    fontWeight: theme.fontWeight.semibold,
  },
  roundDetails: {
    gap: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    justifyContent: 'space-around',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.ui.border,
  },
  scoreLabel: {
    fontSize: theme.fontSize.xxs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.sm,
  },
});