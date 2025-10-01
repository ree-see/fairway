import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ApiService from '../services/ApiService';
import { Round, HoleScore, ApiError } from '../types/api';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorState } from '../components/common/ErrorState';
import { TabNavigation } from '../components/common/TabNavigation';
import { RoundDetailHeader } from '../components/rounds/RoundDetailHeader';
import { CourseInfo } from '../components/rounds/CourseInfo';
import { RoundStatistics } from '../components/rounds/RoundStatistics';
import { ScorecardOptions } from '../components/rounds/ScorecardOptions';
import { ScorecardNine } from '../components/rounds/ScorecardNine';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

type RoundDetailRouteProp = RouteProp<{ RoundDetail: { roundId: string } }, 'RoundDetail'>;

interface RoundDetailData {
  round: Round;
  hole_scores: HoleScore[];
}

interface ScorecardDisplayOptions {
  showPutts: boolean;
  showFIR: boolean;
  showGIR: boolean;
}

interface ScorecardNineProps {
  title: string;
  holeScores: any[];
  totalLabel: string;
  getScoreColor: (strokes: number, par: number) => string | null;
  displayOptions: ScorecardDisplayOptions;
}


export const RoundDetailScreen: React.FC = () => {
  const route = useRoute<RoundDetailRouteProp>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { user } = useAuth();
  const { roundId } = route.params;
  
  const [roundDetail, setRoundDetail] = useState<RoundDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayOptions, setDisplayOptions] = useState<ScorecardDisplayOptions>({
    showPutts: true,
    showFIR: true,
    showGIR: true,
  });
  const [activeTab, setActiveTab] = useState<'statistics' | 'scorecard'>('statistics');

  useEffect(() => {
    // Reset state when roundId changes to prevent stale data
    setRoundDetail(null);
    setError(null);
    setIsLoading(true);
    loadRoundDetail();
  }, [roundId]);

  const loadRoundDetail = async () => {
    try {
      setError(null);
      const response = await ApiService.getRoundDetails(roundId);
      
      if (response.success && response.data) {
        setRoundDetail({
          round: response.data.round,
          hole_scores: response.data.hole_scores,
        });
      } else {
        setError('Failed to load round details');
      }
    } catch (error) {
      console.error('Error loading round details:', error);
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to load round details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAbbreviatedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (value == null || typeof value !== 'number' || isNaN(value)) {
      return '--';
    }
    return Number(value).toFixed(decimals);
  };

  const getScoreName = (strokes: number, par: number): string => {
    const diff = strokes - par;
    if (diff <= -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    return `+${diff}`;
  };

  const getScoreColor = (strokes: number, par: number): string | null => {
    const diff = strokes - par;
    if (diff <= -1) return '#4CAF50'; // Green for under par (birdie, eagle)
    if (diff === 0) return null; // No color for par (traditional scorecard)
    if (diff === 1) return '#000000'; // Black for bogey
    return '#F44336'; // Red for double bogey or worse
  };

  if (isLoading) {
    return <LoadingScreen message="Loading round details..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadRoundDetail} />;
  }

  if (!roundDetail) {
    return <ErrorState error="Round not found" />;
  }

  const { round, hole_scores } = roundDetail;

  const handleToggleOption = (option: keyof ScorecardDisplayOptions) => {
    setDisplayOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const coursePar = hole_scores.reduce((sum, s) => sum + s.par, 0);
  const scoreToPar = (round.total_strokes || 0) - coursePar;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Combined Header Card: Course + Date + Score */}
      <View style={styles.headerCard}>
        {/* Course name + Date */}
        <View style={styles.headerTop}>
          <Text style={styles.courseName}>{round.course_name}</Text>
          <Text style={styles.dateText}>{formatAbbreviatedDate(round.started_at)}</Text>
        </View>

        {/* Score Box */}
        <View style={styles.scoreBoxRow}>
          <View style={styles.scoreBoxItem}>
            <Text style={styles.scoreBoxLabel}>Score</Text>
            <Text style={styles.scoreBoxValue}>{round.total_strokes || '--'}</Text>
          </View>
          <View style={styles.scoreBoxDivider} />
          <View style={styles.scoreBoxItem}>
            <Text style={styles.scoreBoxLabel}>Par</Text>
            <Text style={styles.scoreBoxValue}>{coursePar}</Text>
          </View>
          <View style={styles.scoreBoxDivider} />
          <View style={styles.scoreBoxItem}>
            <Text style={[styles.scoreBoxValue, {
              color: scoreToPar > 0 ? theme.colors.status.error : scoreToPar < 0 ? theme.colors.status.success : theme.colors.status.info
            }]}>
              {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
            </Text>
          </View>
        </View>
      </View>

      {/* Toggle Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { key: 'scorecard', label: 'Scorecard' },
          { key: 'statistics', label: 'Statistics' }
        ]}
      />

      {/* Scorecard View */}
      {activeTab === 'scorecard' && (
        <>
          <ScorecardOptions
            displayOptions={displayOptions}
            onToggleOption={handleToggleOption}
          />

          <View style={styles.scorecardSection}>
            {hole_scores.length > 0 ? (
              <View style={styles.scorecardContainer}>
                <ScorecardNine
                  title="Front 9"
                  holeScores={hole_scores.filter(score => score.hole_number <= 9)}
                  totalLabel="Out"
                  getScoreColor={getScoreColor}
                  displayOptions={displayOptions}
                />

                <ScorecardNine
                  title="Back 9"
                  holeScores={hole_scores.filter(score => score.hole_number > 9)}
                  totalLabel="In"
                  getScoreColor={getScoreColor}
                  displayOptions={displayOptions}
                />
              </View>
            ) : (
              <View style={styles.emptyScorecard}>
                <Text style={styles.emptyText}>No hole scores recorded</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Statistics View */}
      {activeTab === 'statistics' && (
        <>
          <RoundStatistics round={round} />

          {/* Request Verification Button - only show for unverified rounds */}
          {!round.is_verified && (
            <View style={styles.verificationButtonContainer}>
              <TouchableOpacity
                style={styles.verificationButton}
                onPress={() => navigation.navigate('VerificationRequest', {
                  roundId: round.id,
                  playerName: user?.full_name || 'Player',
                  courseName: round.course_name,
                  score: round.total_strokes,
                })}
              >
                <Text style={styles.verificationButtonText}>Request Verification</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space to scroll past the bottom navbar
  },
  headerCard: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.xl,
    marginTop: theme.spacing.massive,
    borderRadius: theme.radius.card,
    padding: theme.padding.card,
    ...theme.shadows.md,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  courseName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  scoreBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreBoxItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreBoxDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.ui.border,
  },
  scoreBoxLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: theme.fontWeight.semibold,
  },
  scoreBoxValue: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scorecardSection: {
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.xl,
    marginTop: 0,
    padding: theme.padding.card,
    borderRadius: theme.radius.card,
    ...theme.shadows.md,
  },
  scorecardContainer: {
    gap: theme.spacing.lg,
  },
  emptyScorecard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.tertiary,
  },
  verificationButtonContainer: {
    margin: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  verificationButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  verificationButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
});