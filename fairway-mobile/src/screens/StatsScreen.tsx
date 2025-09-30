import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import ApiService from "../services/ApiService";
import { RoundStatistics, ApiError } from "../types/api";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { ErrorState } from "../components/common/ErrorState";
import { theme } from "../theme";
import { containers, cards, text as textStyles, layout } from "../theme/commonStyles";

const StatsScreen: React.FC = () => {
  const [statistics, setStatistics] = useState<RoundStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setError(null);
      const response = await ApiService.getRoundStatistics();

      if (response.success && response.data) {
        setStatistics(response.data.statistics);
      } else {
        setError("Failed to load statistics");
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      const apiError = error as ApiError;
      setError(apiError.message || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await ApiService.clearUserCache();
      await loadStatistics();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your stats..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadStatistics} />;
  }

  // Use real statistics data with fallback values
  const stats = {
    handicapIndex: statistics?.handicap_index ?? null,
    averageScore: statistics?.average_score ?? null,
    totalRounds: statistics?.total_rounds || 0,
    verifiedRounds: statistics?.verified_rounds || 0,
    lowestScore: statistics?.lowest_score ?? null,
    // Real performance stats from API
    fairwaysInRegulation: statistics?.fairway_percentage || 0,
    greensInRegulation: statistics?.gir_percentage || 0,
    averagePutts: statistics?.average_putts ?? null,
    scrambling: statistics?.scrambling_percentage || 0,
    strokesGained: {
      driving: statistics?.strokes_gained_driving || 0,
      approach: statistics?.strokes_gained_approach || 0,
      shortGame: statistics?.strokes_gained_short_game || 0,
      putting: statistics?.strokes_gained_putting || 0,
    },
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
  }> = ({ title, value, subtitle }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const getTrendColor = (trend?: string | null) => {
    switch (trend) {
      case "improving":
        return theme.colors.status.success;
      case "declining":
        return theme.colors.status.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getTrendIcon = (trend?: string | null) => {
    switch (trend) {
      case "improving":
        return "↗ Improving";
      case "declining":
        return "↘ Declining";
      default:
        return "→ Stable";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Overview Stats */}
      <SectionCard title="Overview">
        <View style={styles.statRow}>
          <StatCard
            title="Handicap Index"
            value={
              stats.handicapIndex != null &&
              typeof stats.handicapIndex === "number"
                ? stats.handicapIndex.toFixed(1)
                : "--"
            }
          />
          <StatCard
            title="Average Score"
            value={
              stats.averageScore != null &&
              typeof stats.averageScore === "number"
                ? Math.round(stats.averageScore)
                : "--"
            }
          />
        </View>
        <View style={styles.statRow}>
          <StatCard
            title="Total Rounds"
            value={stats.totalRounds}
            subtitle="This Season"
          />
          <StatCard
            title="Best Round"
            value={stats.lowestScore || "--"}
            subtitle="All Time"
          />
        </View>
      </SectionCard>

      {/* Performance Stats */}
      <SectionCard title="Performance">
        <View style={styles.statRow}>
          <StatCard
            title="Fairways in Regulation"
            value={`${stats.fairwaysInRegulation}%`}
          />
          <StatCard
            title="Greens in Regulation"
            value={`${stats.greensInRegulation}%`}
          />
        </View>
        <View style={styles.statRow}>
          <StatCard
            title="Average Putts"
            value={
              stats.averagePutts != null &&
              typeof stats.averagePutts === "number"
                ? stats.averagePutts.toFixed(1)
                : "--"
            }
          />
          <StatCard title="Scrambling" value={`${stats.scrambling}%`} />
        </View>
      </SectionCard>

      {/* Strokes Gained */}
      <SectionCard title="Strokes Gained">
        <View style={styles.statRow}>
          <StatCard
            title="Driving"
            value={
              stats.strokesGained.driving > 0
                ? `+${stats.strokesGained.driving}`
                : stats.strokesGained.driving
            }
          />
          <StatCard
            title="Approach"
            value={
              stats.strokesGained.approach > 0
                ? `+${stats.strokesGained.approach}`
                : stats.strokesGained.approach
            }
          />
        </View>
        <View style={styles.statRow}>
          <StatCard
            title="Short Game"
            value={
              stats.strokesGained.shortGame > 0
                ? `+${stats.strokesGained.shortGame}`
                : stats.strokesGained.shortGame
            }
          />
          <StatCard
            title="Putting"
            value={
              stats.strokesGained.putting > 0
                ? `+${stats.strokesGained.putting}`
                : stats.strokesGained.putting
            }
          />
        </View>
      </SectionCard>

      {/* Trends */}
      <SectionCard title="Recent Trends">
        <View style={styles.trendContainer}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Overall Trend</Text>
            <Text style={styles.trendValue}>
              {statistics?.recent_trend
                ? statistics.recent_trend.charAt(0).toUpperCase() +
                  statistics.recent_trend.slice(1)
                : "Stable"}
            </Text>
            <Text
              style={[
                styles.trendChange,
                { color: getTrendColor(statistics?.recent_trend) },
              ]}
            >
              {getTrendIcon(statistics?.recent_trend)}
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Average Score</Text>
            <Text style={styles.trendValue}>
              {stats.averageScore
                ? `${Math.round(stats.averageScore)} avg`
                : "--"}
            </Text>
            <Text style={[styles.trendChange, { color: theme.colors.text.secondary }]}>
              {stats.totalRounds > 1 ? "Over all rounds" : "Need more data"}
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Best Round</Text>
            <Text style={styles.trendValue}>{stats.lowestScore || "--"}</Text>
            <Text style={[styles.trendChange, { color: theme.colors.status.success }]}>
              Personal best
            </Text>
          </View>
        </View>
      </SectionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...containers.screenContainer,
  },
  content: {
    padding: theme.padding.screen,
    paddingBottom: 100, // Extra space for tab bar
  },
  sectionCard: {
    ...cards.sectionCard,
    ...theme.shadows.lg,
  },
  sectionTitle: {
    ...theme.textStyles.h3,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  statRow: {
    ...layout.rowSpaceBetween,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    ...cards.statCard,
    marginHorizontal: theme.spacing.xs,
  },
  statTitle: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  statValue: {
    ...textStyles.statValue,
    marginBottom: 2,
  },
  statSubtitle: {
    ...theme.textStyles.tiny,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  trendContainer: {
    ...layout.row,
    justifyContent: "space-between",
  },
  trendItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  trendLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  trendValue: {
    ...theme.textStyles.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  trendChange: {
    ...theme.textStyles.captionBold,
  },
});

export default StatsScreen;
