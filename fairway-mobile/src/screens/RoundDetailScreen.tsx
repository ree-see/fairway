import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
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
  getScoreColor: (strokes: number, par: number) => string;
  displayOptions: ScorecardDisplayOptions;
}


export const RoundDetailScreen: React.FC = () => {
  const route = useRoute<RoundDetailRouteProp>();
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

  const getScoreColor = (strokes: number, par: number): string => {
    const diff = strokes - par;
    if (diff <= -1) return '#4CAF50'; // Green for under par
    if (diff === 0) return '#2196F3'; // Blue for par
    if (diff === 1) return '#FF9800'; // Orange for bogey
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
    <ScrollView style={styles.container}>
      {/* Header: Course name + Date */}
      <View style={styles.header}>
        <Text style={styles.courseName}>{round.course_name}</Text>
        <Text style={styles.dateText}>{formatAbbreviatedDate(round.started_at)}</Text>
      </View>

      {/* Score Box */}
      <View style={styles.scoreBox}>
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
            <Text style={styles.scoreBoxLabel}>To Par</Text>
            <Text style={[styles.scoreBoxValue, { color: scoreToPar > 0 ? '#F44336' : scoreToPar < 0 ? '#4CAF50' : '#2196F3' }]}>
              {scoreToPar > 0 ? '+' : ''}{scoreToPar}
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
        <RoundStatistics round={round} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  scoreBox: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: '#333',
  },
  scoreBoxLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreBoxValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EEEEEE',
  },
  scorecardSection: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scorecardContainer: {
    gap: 16,
  },
  emptyScorecard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
  },
});