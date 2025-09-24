import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import { Round, HoleScore, ApiError } from '../types/api';

type RoundDetailRouteProp = RouteProp<{ RoundDetail: { roundId: string } }, 'RoundDetail'>;

interface RoundDetailData {
  round: Round;
  hole_scores: HoleScore[];
}

export const RoundDetailScreen: React.FC = () => {
  const route = useRoute<RoundDetailRouteProp>();
  const navigation = useNavigation();
  const { roundId } = route.params;
  
  const [roundDetail, setRoundDetail] = useState<RoundDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading round details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRoundDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!roundDetail) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Round not found</Text>
      </View>
    );
  }

  const { round, hole_scores } = roundDetail;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Round Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Course & Date Info */}
      <View style={styles.courseSection}>
        <Text style={styles.courseName}>{round.course_name}</Text>
        <Text style={styles.roundDate}>{formatDate(round.started_at)}</Text>
        <Text style={styles.roundTime}>Started at {formatTime(round.started_at)}</Text>
        {round.completed_at && (
          <Text style={styles.roundTime}>Finished at {formatTime(round.completed_at)}</Text>
        )}
      </View>

      {/* Round Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Round Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{round.total_strokes || '--'}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{round.total_putts || '--'}</Text>
            <Text style={styles.statLabel}>Total Putts</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{round.fairways_hit || 0}</Text>
            <Text style={styles.statLabel}>Fairways Hit</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{round.greens_in_regulation || 0}</Text>
            <Text style={styles.statLabel}>Greens in Reg</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, round.is_verified ? styles.verifiedBadge : styles.provisionalBadge]}>
            <Ionicons 
              name={round.is_verified ? "checkmark-circle" : "time"} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.statusText}>
              {round.is_verified ? 'Verified' : 'Provisional'}
            </Text>
          </View>
        </View>
      </View>

      {/* Scorecard */}
      <View style={styles.scorecardSection}>
        <Text style={styles.sectionTitle}>Scorecard</Text>
        
        {hole_scores.length > 0 ? (
          <View style={styles.scorecardContainer}>
            {/* Front 9 */}
            <View style={styles.nineHeader}>
              <Text style={styles.nineTitle}>Front 9</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scorecardScroll}>
              <View style={styles.scorecardTable}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                  <View style={styles.holeHeaderCell}>
                    <Text style={styles.headerText}>Hole</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number <= 9).map((score: any) => (
                    <View key={`hole-${score.hole_number}`} style={styles.holeHeaderCell}>
                      <Text style={styles.headerText}>{score.hole_number}</Text>
                    </View>
                  ))}
                  <View style={styles.totalHeaderCell}>
                    <Text style={styles.headerText}>Out</Text>
                  </View>
                </View>

                {/* Par Row */}
                <View style={styles.dataRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Par</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number <= 9).map((score: any) => (
                    <View key={`par-${score.hole_number}`} style={styles.dataCell}>
                      <Text style={styles.parText}>{score.par}</Text>
                    </View>
                  ))}
                  <View style={styles.totalCell}>
                    <Text style={styles.totalText}>
                      {hole_scores.filter(s => s.hole_number <= 9).reduce((sum, s) => sum + s.par, 0)}
                    </Text>
                  </View>
                </View>

                {/* Score Row */}
                <View style={styles.dataRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Score</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number <= 9).map((score: any) => (
                    <View key={`score-${score.hole_number}`} style={[styles.dataCell, { backgroundColor: getScoreColor(score.strokes, score.par) + '20' }]}>
                      <Text style={[styles.scoreText, { color: getScoreColor(score.strokes, score.par) }]}>
                        {score.strokes}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.totalCell}>
                    <Text style={styles.totalText}>
                      {hole_scores.filter(s => s.hole_number <= 9).reduce((sum, s) => sum + s.strokes, 0)}
                    </Text>
                  </View>
                </View>

                {/* Putts Row */}
                <View style={styles.dataRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Putts</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number <= 9).map((score: any) => (
                    <View key={`putts-${score.hole_number}`} style={styles.dataCell}>
                      <Text style={styles.detailDataText}>{score.putts || '-'}</Text>
                    </View>
                  ))}
                  <View style={styles.totalCell}>
                    <Text style={styles.totalText}>
                      {hole_scores.filter(s => s.hole_number <= 9).reduce((sum, s) => sum + (s.putts || 0), 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Back 9 */}
            <View style={styles.nineHeader}>
              <Text style={styles.nineTitle}>Back 9</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scorecardScroll}>
              <View style={styles.scorecardTable}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                  <View style={styles.holeHeaderCell}>
                    <Text style={styles.headerText}>Hole</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number > 9).map((score: any) => (
                    <View key={`hole-${score.hole_number}`} style={styles.holeHeaderCell}>
                      <Text style={styles.headerText}>{score.hole_number}</Text>
                    </View>
                  ))}
                  <View style={styles.totalHeaderCell}>
                    <Text style={styles.headerText}>In</Text>
                  </View>
                </View>

                {/* Par Row */}
                <View style={styles.dataRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Par</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number > 9).map((score: any) => (
                    <View key={`par-${score.hole_number}`} style={styles.dataCell}>
                      <Text style={styles.parText}>{score.par}</Text>
                    </View>
                  ))}
                  <View style={styles.totalCell}>
                    <Text style={styles.totalText}>
                      {hole_scores.filter(s => s.hole_number > 9).reduce((sum, s) => sum + s.par, 0)}
                    </Text>
                  </View>
                </View>

                {/* Score Row */}
                <View style={styles.dataRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Score</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number > 9).map((score: any) => (
                    <View key={`score-${score.hole_number}`} style={[styles.dataCell, { backgroundColor: getScoreColor(score.strokes, score.par) + '20' }]}>
                      <Text style={[styles.scoreText, { color: getScoreColor(score.strokes, score.par) }]}>
                        {score.strokes}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.totalCell}>
                    <Text style={styles.totalText}>
                      {hole_scores.filter(s => s.hole_number > 9).reduce((sum, s) => sum + s.strokes, 0)}
                    </Text>
                  </View>
                </View>

                {/* Putts Row */}
                <View style={styles.dataRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Putts</Text>
                  </View>
                  {hole_scores.filter(score => score.hole_number > 9).map((score: any) => (
                    <View key={`putts-${score.hole_number}`} style={styles.dataCell}>
                      <Text style={styles.detailDataText}>{score.putts || '-'}</Text>
                    </View>
                  ))}
                  <View style={styles.totalCell}>
                    <Text style={styles.totalText}>
                      {hole_scores.filter(s => s.hole_number > 9).reduce((sum, s) => sum + (s.putts || 0), 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Course Totals */}
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
    marginTop: 16,
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
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  courseSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  roundDate: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  roundTime: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 2,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
  statusRow: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  provisionalBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  nineHeader: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginVertical: 8,
  },
  nineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  scorecardScroll: {
    marginBottom: 8,
  },
  scorecardTable: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  holeHeaderCell: {
    width: 40,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  totalHeaderCell: {
    width: 50,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  labelCell: {
    width: 60,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  dataCell: {
    width: 40,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  totalCell: {
    width: 50,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 2,
    borderLeftColor: '#2E7D32',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  parText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailDataText: {
    fontSize: 12,
    color: '#666666',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
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