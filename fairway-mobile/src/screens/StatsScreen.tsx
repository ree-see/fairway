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
        return "#4CAF50";
      case "declining":
        return "#F44336";
      default:
        return "#AAAAAA";
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
            <Text style={[styles.trendChange, { color: "#AAAAAA" }]}>
              {stats.totalRounds > 1 ? "Over all rounds" : "Need more data"}
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Best Round</Text>
            <Text style={styles.trendValue}>{stats.lowestScore || "--"}</Text>
            <Text style={[styles.trendChange, { color: "#4CAF50" }]}>
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
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Extra space for tab bar
  },
  sectionCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 16,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statTitle: {
    fontSize: 12,
    color: "#AAAAAA",
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: "#888888",
    textAlign: "center",
  },
  trendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trendItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  trendLabel: {
    fontSize: 12,
    color: "#AAAAAA",
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EEEEEE",
    marginBottom: 2,
  },
  trendChange: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default StatsScreen;
