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

  return (
    <ScrollView style={styles.container}>
      <RoundDetailHeader title="Round Details" />
      
      <CourseInfo 
        courseName={round.course_name}
        startedAt={round.started_at}
        completedAt={round.completed_at}
      />

      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { key: 'statistics', label: 'Statistics' },
          { key: 'scorecard', label: 'Scorecard' }
        ]}
      />

      {activeTab === 'statistics' && (
        <RoundStatistics round={round} />
      )}

      {activeTab === 'scorecard' && (
        <>
          <ScorecardOptions 
            displayOptions={displayOptions}
            onToggleOption={handleToggleOption}
          />

          <View style={styles.scorecardSection}>
            <Text style={styles.sectionTitle}>Scorecard</Text>
            
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

                <View style={styles.totalsSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowLabel}>Course Total</Text>
                    <Text style={styles.totalRowValue}>
                      Par: {hole_scores.reduce((sum, s) => sum + s.par, 0)} | Score: {round.total_strokes || '--'}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowLabel}>To Par</Text>
                    <Text style={[styles.totalRowValue, { 
                      color: (round.total_strokes || 0) - hole_scores.reduce((sum, s) => sum + s.par, 0) > 0 ? '#F44336' : '#4CAF50' 
                    }]}>
                      {(round.total_strokes || 0) - hole_scores.reduce((sum, s) => sum + s.par, 0) > 0 ? '+' : ''}
                      {(round.total_strokes || 0) - hole_scores.reduce((sum, s) => sum + s.par, 0)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyScorecard}>
                <Text style={styles.emptyText}>No hole scores recorded</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  scorecardSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scorecardContainer: {
    gap: 16,
  },
  totalsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  totalRowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  emptyScorecard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});