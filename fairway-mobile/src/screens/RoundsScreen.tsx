import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/ApiService";
import { Round, ApiError } from "../types/api";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { ErrorState } from "../components/common/ErrorState";
import { FloatingActionButton } from "../components/common/FloatingActionButton";
import { theme } from "../theme";
import { useTheme } from "../contexts/ThemeContext";

type FilterStatus = "all" | "completed" | "in_progress" | "verified";

// Memoized Round Item Component for performance optimization
interface RoundItemProps {
  item: Round;
  onPress: (roundId: string) => void;
  colors: any;
  styles: any;
}

const RoundItem = memo<RoundItemProps>(({ item, onPress, colors, styles }) => {
  const coursePar = item.course_par || 72;
  const scoreToPar = (item.total_strokes || 0) - coursePar;

  const getStatusBadge = () => {
    if (item.is_verified) {
      return (
        <View style={[styles.badge, styles.verifiedBadge]}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={colors.text.inverse}
          />
        </View>
      );
    } else if (item.status === "in_progress") {
      return (
        <View style={[styles.badge, styles.inProgressBadge]}>
          <Ionicons name="hourglass" size={14} color={colors.text.inverse} />
        </View>
      );
    } else {
      return (
        <View style={[styles.badge, styles.provisionalBadge]}>
          <Ionicons name="time" size={14} color={colors.text.inverse} />
        </View>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAccessibilityLabel = () => {
    const statusText = item.is_verified
      ? "verified"
      : item.status === "in_progress"
        ? "in progress"
        : "provisional";
    const scoreText =
      item.total_strokes
        ? `Score ${item.total_strokes}, ${scoreToPar === 0 ? "even par" : scoreToPar > 0 ? `${scoreToPar} over par` : `${Math.abs(scoreToPar)} under par`}`
        : "no score";
    return `${item.course_name}, ${statusText} round, ${scoreText}. Tap to view details.`;
  };

  return (
    <TouchableOpacity
      style={styles.roundCard}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint="Opens round details"
    >
      <View style={styles.roundHeader}>
        <Text style={styles.courseName} numberOfLines={1}>
          {item.course_name}
        </Text>
        {getStatusBadge()}
      </View>

      <View style={styles.roundDetails}>
        <View style={styles.detailItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.detailText}>{formatDate(item.started_at)}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {item.total_strokes || "--"}
            </Text>
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
                      ? colors.error
                      : scoreToPar < 0
                        ? colors.success
                        : colors.primary,
                },
              ]}
            >
              {scoreToPar === 0
                ? "E"
                : scoreToPar > 0
                  ? `+${scoreToPar}`
                  : scoreToPar}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if item data actually changed
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.total_strokes === nextProps.item.total_strokes &&
    prevProps.item.is_verified === nextProps.item.is_verified &&
    prevProps.item.status === nextProps.item.status
  );
});

export const RoundsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
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
      const status = filterStatus === "all" ? undefined : filterStatus;

      const response = await ApiService.getRounds(status, LIMIT, currentOffset);

      if (response.success && response.data) {
        const newRounds = response.data.rounds;

        if (reset) {
          setRounds(newRounds);
        } else {
          setRounds((prev) => [...prev, ...newRounds]);
        }

        setHasMore(response.data.pagination?.has_more || false);
        setOffset(currentOffset + LIMIT);
      } else {
        setError("Failed to load rounds");
      }
    } catch (error) {
      console.error("Error loading rounds:", error);
      const apiError = error as ApiError;
      setError(apiError.message || "Failed to load rounds");
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

  const navigateToNewRound = () => {
    navigation.navigate("Home", { screen: "CourseSelect" });
  };

  const handleRoundPress = useCallback((roundId: string) => {
    navigation.navigate("RoundDetail", { roundId });
  }, [navigation]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="golf-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No rounds found</Text>
        <Text style={styles.emptySubtext}>
          {filterStatus === "all"
            ? "Start a new round to see it here"
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
          style={[
            styles.filterButton,
            filterStatus === "all" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("all")}
          accessibilityRole="button"
          accessibilityLabel="Show all rounds"
          accessibilityState={{ selected: filterStatus === "all" }}
        >
          <Text
            style={[
              styles.filterText,
              filterStatus === "all" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "completed" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("completed")}
          accessibilityRole="button"
          accessibilityLabel="Show completed rounds"
          accessibilityState={{ selected: filterStatus === "completed" }}
        >
          <Text
            style={[
              styles.filterText,
              filterStatus === "completed" && styles.filterTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "in_progress" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("in_progress")}
          accessibilityRole="button"
          accessibilityLabel="Show in progress rounds"
          accessibilityState={{ selected: filterStatus === "in_progress" }}
        >
          <Text
            style={[
              styles.filterText,
              filterStatus === "in_progress" && styles.filterTextActive,
            ]}
          >
            In Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "verified" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("verified")}
          accessibilityRole="button"
          accessibilityLabel="Show verified rounds"
          accessibilityState={{ selected: filterStatus === "verified" }}
        >
          <Text
            style={[
              styles.filterText,
              filterStatus === "verified" && styles.filterTextActive,
            ]}
          >
            Verified
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rounds List */}
      <FlatList
        data={rounds}
        renderItem={({ item }) => (
          <RoundItem
            item={item}
            onPress={handleRoundPress}
            colors={colors}
            styles={styles}
          />
        )}
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
            tintColor={colors.primary}
          />
        }
      />

      <FloatingActionButton
        onPress={navigateToNewRound}
        accessibilityLabel="Start new round"
        accessibilityHint="Navigate to course selection to start a new round"
      />
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    filterContainer: {
      flexDirection: "row",
      backgroundColor: colors.background.secondary,
      margin: theme.spacing.lg,
      marginTop: theme.spacing.massive,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.card,
      padding: theme.spacing.xs,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    filterButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.radius.input,
      alignItems: "center",
      backgroundColor: "transparent",
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semiBold,
      color: colors.text.secondary,
    },
    filterTextActive: {
      color: colors.text.inverse,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 100,
    },
    roundCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: theme.radius.card,
      padding: theme.padding.card,
      marginBottom: theme.spacing.md,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    roundHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    courseName: {
      flex: 1,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: colors.text.primary,
      marginRight: theme.spacing.sm,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.badge,
      gap: theme.spacing.xs,
    },
    verifiedBadge: {
      backgroundColor: colors.success,
    },
    provisionalBadge: {
      backgroundColor: colors.warning,
    },
    inProgressBadge: {
      backgroundColor: colors.primary,
    },
    roundDetails: {
      gap: theme.spacing.md,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    detailText: {
      fontSize: theme.fontSize.sm,
      color: colors.text.secondary,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background.tertiary,
      borderRadius: theme.radius.input,
      padding: theme.spacing.md,
      justifyContent: "space-around",
    },
    scoreItem: {
      flex: 1,
      alignItems: "center",
    },
    scoreDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.ui.divider,
    },
    scoreLabel: {
      fontSize: theme.fontSize.xs,
      color: colors.text.secondary,
      marginBottom: theme.spacing.xs,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    scoreValue: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: colors.text.primary,
    },
    footerLoader: {
      paddingVertical: theme.spacing.lg,
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semiBold,
      color: colors.text.secondary,
      marginTop: theme.spacing.lg,
    },
    emptySubtext: {
      fontSize: theme.fontSize.sm,
      color: colors.text.tertiary,
      marginTop: theme.spacing.sm,
    },
  });
