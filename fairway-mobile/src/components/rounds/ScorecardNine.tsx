import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../theme';

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

export const ScorecardNine: React.FC<ScorecardNineProps> = ({ 
  title, 
  holeScores, 
  totalLabel, 
  getScoreColor, 
  displayOptions 
}) => (
  <>
    <View style={styles.nineHeader}>
      <Text style={styles.nineTitle}>{title}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scorecardScroll}>
      <View style={styles.scorecardTable}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.holeHeaderCell}>
            <Text style={styles.headerText}>Hole</Text>
          </View>
          {holeScores.map((score: any) => (
            <View key={`hole-${score.id}`} style={styles.holeHeaderCell}>
              <Text style={styles.headerText}>{score.hole_number}</Text>
            </View>
          ))}
          <View style={styles.totalHeaderCell}>
            <Text style={styles.headerText}>{totalLabel}</Text>
          </View>
        </View>

        {/* Par Row */}
        <View style={styles.dataRow}>
          <View style={styles.labelCell}>
            <Text style={styles.labelText}>Par</Text>
          </View>
          {holeScores.map((score: any) => (
            <View key={`par-${score.id}`} style={styles.dataCell}>
              <Text style={styles.parText}>{score.par}</Text>
            </View>
          ))}
          <View style={styles.totalCell}>
            <Text style={styles.totalText}>
              {holeScores.reduce((sum, s) => sum + s.par, 0)}
            </Text>
          </View>
        </View>

        {/* Score Row */}
        <View style={styles.dataRow}>
          <View style={styles.labelCell}>
            <Text style={styles.labelText}>Score</Text>
          </View>
          {holeScores.map((score: any) => {
            const scoreColor = getScoreColor(score.strokes, score.par);
            return (
              <View
                key={`score-${score.id}`}
                style={[
                  styles.dataCell,
                  scoreColor && { backgroundColor: scoreColor + '20' }
                ]}
              >
                <Text style={[
                  styles.scoreText,
                  scoreColor ? { color: scoreColor } : styles.parScoreText
                ]}>
                  {score.strokes}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalCell}>
            <Text style={styles.totalText}>
              {holeScores.reduce((sum, s) => sum + s.strokes, 0)}
            </Text>
          </View>
        </View>

        {/* Putts Row */}
        {displayOptions.showPutts && (
          <View style={styles.dataRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Putts</Text>
            </View>
            {holeScores.map((score: any) => (
              <View key={`putts-${score.id}`} style={styles.dataCell}>
                <Text style={styles.detailDataText}>{score.putts || '-'}</Text>
              </View>
            ))}
            <View style={styles.totalCell}>
              <Text style={styles.totalText}>
                {holeScores.reduce((sum, s) => sum + (s.putts || 0), 0)}
              </Text>
            </View>
          </View>
        )}

        {/* FIR Row - Only for Par 4 and 5 holes */}
        {displayOptions.showFIR && (
          <View style={styles.dataRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>FIR</Text>
            </View>
            {holeScores.map((score: any) => (
              <View key={`fir-${score.id}`} style={styles.dataCell}>
                <Text style={[styles.detailDataText, score.fairway_hit && styles.positiveText]}>
                  {score.par >= 4 ? (score.fairway_hit ? '✓' : 'X') : '-'}
                </Text>
              </View>
            ))}
            <View style={styles.totalCell}>
              <Text style={styles.totalText}>
                {holeScores.filter(s => s.par >= 4 && s.fairway_hit).length}/
                {holeScores.filter(s => s.par >= 4).length}
              </Text>
            </View>
          </View>
        )}

        {/* GIR Row */}
        {displayOptions.showGIR && (
          <View style={styles.dataRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>GIR</Text>
            </View>
            {holeScores.map((score: any) => (
              <View key={`gir-${score.id}`} style={styles.dataCell}>
                <Text style={[styles.detailDataText, score.green_in_regulation && styles.positiveText]}>
                  {score.green_in_regulation ? '✓' : 'X'}
                </Text>
              </View>
            ))}
            <View style={styles.totalCell}>
              <Text style={styles.totalText}>
                {holeScores.filter(s => s.green_in_regulation).length}/{holeScores.length}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  </>
);

const styles = StyleSheet.create({
  nineHeader: {
    backgroundColor: theme.colors.background.tertiary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.input,
    marginVertical: theme.spacing.sm,
  },
  nineTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary.main,
    textAlign: 'center',
  },
  scorecardScroll: {
    marginBottom: theme.spacing.sm,
  },
  scorecardTable: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary.dark,
    borderTopLeftRadius: theme.radius.input,
    borderTopRightRadius: theme.radius.input,
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  holeHeaderCell: {
    width: 40,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  totalHeaderCell: {
    width: 50,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  labelCell: {
    width: 60,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.ui.border,
  },
  dataCell: {
    width: 40,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.ui.border,
  },
  totalCell: {
    width: 50,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary.dark,
  },
  headerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  labelText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  parText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  scoreText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
  parScoreText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  detailDataText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  positiveText: {
    color: theme.colors.status.success,
    fontWeight: theme.fontWeight.bold,
  },
  totalText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary.dark,
  },
});