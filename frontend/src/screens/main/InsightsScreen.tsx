// mobile/src/screens/main/InsightsScreen.tsx
/**
 * Insights Screen
 * AI-powered analytics, trends, emotional patterns
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';

import { api } from '../../services/api';
import { Card, SectionHeader } from '../../components/Card';
import { AmountDisplay, ProgressBar } from '../../components/ProgressBar';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { EmotionalAnalysis, SpendingPrediction } from '../../types';

export const InsightsScreen: React.FC = () => {
  const [emotionalData, setEmotionalData] = useState<EmotionalAnalysis | null>(null);
  const [predictions, setPredictions] = useState<SpendingPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [emotional, predict] = await Promise.all([
        api.getEmotionalAnalysis(30).catch(() => null),
        api.getSpendingPrediction(7).catch(() => null),
      ]);
      setEmotionalData(emotional);
      setPredictions(predict);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getRiskColor = (score: number): string => {
    if (score < 30) return colors.emerald[500];
    if (score < 60) return colors.gold[500];
    return colors.burgundy[500];
  };

  const getRiskLabel = (score: number): string => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Moderate';
    return 'High Risk';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingEmoji}>🧠</Text>
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold[500]}
          />
        }
      >
        {/* Spending Persona */}
        {emotionalData?.spending_persona && (
          <Card variant="elevated" style={styles.personaCard}>
            <Text style={styles.personaLabel}>Your Spending Persona</Text>
            <Text style={styles.personaTitle}>
              {emotionalData.spending_persona.persona}
            </Text>
            <Text style={styles.personaDescription}>
              {emotionalData.spending_persona.description}
            </Text>
          </Card>
        )}

        {/* Emotional Risk Score */}
        {emotionalData?.risk_score !== undefined && (
          <View style={styles.section}>
            <SectionHeader title="Emotional Spending Risk" />
            <Card variant="outlined">
              <View style={styles.riskHeader}>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskColor(emotionalData.risk_score) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.riskBadgeText,
                      { color: getRiskColor(emotionalData.risk_score) },
                    ]}
                  >
                    {getRiskLabel(emotionalData.risk_score)}
                  </Text>
                </View>
                <Text style={styles.riskScore}>{emotionalData.risk_score}/100</Text>
              </View>
              <ProgressBar
                progress={emotionalData.risk_score}
                height={12}
                color={getRiskColor(emotionalData.risk_score)}
                variant="glow"
              />
              <Text style={styles.riskHint}>
                Based on your emotional spending patterns over the last 30 days
              </Text>
            </Card>
          </View>
        )}

        {/* Emotional Breakdown */}
        {emotionalData?.summary && (
          <View style={styles.section}>
            <SectionHeader title="Spending Breakdown" />
            <Card variant="outlined">
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Total Spending</Text>
                  <AmountDisplay
                    amount={emotionalData.summary.total_spending}
                    size="medium"
                  />
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Emotional</Text>
                  <AmountDisplay
                    amount={emotionalData.summary.total_emotional_spending}
                    size="medium"
                    color={colors.gold[500]}
                  />
                </View>
              </View>
              
              <View style={styles.emotionalBar}>
                <View
                  style={[
                    styles.emotionalFill,
                    { width: `${emotionalData.summary.emotional_percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.emotionalText}>
                {emotionalData.summary.emotional_percentage.toFixed(0)}% of spending was emotional
              </Text>

              {/* Unnecessary & Impulsive */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>⚠️</Text>
                  <AmountDisplay
                    amount={emotionalData.summary.unnecessary_spending}
                    size="small"
                    color={colors.burgundy[400]}
                  />
                  <Text style={styles.statLabel}>Unnecessary</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>⚡</Text>
                  <AmountDisplay
                    amount={emotionalData.summary.impulsive_spending}
                    size="small"
                    color={colors.gold[500]}
                  />
                  <Text style={styles.statLabel}>Impulsive</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Spending by Emotion */}
        {emotionalData?.by_emotion && Object.keys(emotionalData.by_emotion).length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="By Emotion" />
            <Card variant="outlined">
              {Object.entries(emotionalData.by_emotion)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([emotion, stats]) => (
                  <View key={emotion} style={styles.emotionRow}>
                    <Text style={styles.emotionEmoji}>
                      {getEmotionEmoji(emotion)}
                    </Text>
                    <View style={styles.emotionInfo}>
                      <Text style={styles.emotionName}>{emotion}</Text>
                      <Text style={styles.emotionCount}>{stats.count} transactions</Text>
                    </View>
                    <AmountDisplay
                      amount={stats.total}
                      size="small"
                      color={colors.text.accent}
                    />
                  </View>
                ))}
            </Card>
          </View>
        )}

        {/* Spending Prediction */}
        {predictions && (
          <View style={styles.section}>
            <SectionHeader title="7-Day Prediction" />
            <Card variant="elevated" style={styles.predictionCard}>
              <Text style={styles.predictionLabel}>Predicted spending</Text>
              <AmountDisplay
                amount={predictions.total_predicted}
                size="large"
                color={colors.gold[500]}
              />
              <Text style={styles.predictionSubtext}>
                ~${predictions.average_daily.toFixed(0)}/day average
              </Text>
            </Card>
          </View>
        )}

        {/* Recommendations */}
        {emotionalData?.recommendations && emotionalData.recommendations.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recommendations" />
            {emotionalData.recommendations.map((rec, index) => (
              <Card key={index} variant="outlined" style={styles.recommendationCard}>
                <Text style={styles.recommendationIcon}>💡</Text>
                <Text style={styles.recommendationText}>{rec}</Text>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getEmotionEmoji = (emotion: string): string => {
  const emojis: Record<string, string> = {
    happy: '😊', excited: '🤩', celebratory: '🎉', planned: '📋',
    neutral: '😐', bored: '😑', tired: '😴', stressed: '😰',
    anxious: '😟', frustrated: '😤', sad: '😢', guilty: '😔', impulsive: '⚡',
  };
  return emojis[emotion] || '💭';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body.medium,
    color: colors.text.tertiary,
  },

  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  // Persona
  personaCard: {
    margin: spacing.lg,
    backgroundColor: colors.emerald[500] + '10',
    borderWidth: 1,
    borderColor: colors.emerald[500] + '30',
  },
  personaLabel: {
    ...typography.label.small,
    color: colors.emerald[500],
    marginBottom: spacing.xs,
  },
  personaTitle: {
    ...typography.headline.small,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  personaDescription: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },

  // Risk
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  riskBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  riskBadgeText: {
    ...typography.label.medium,
    fontWeight: '600',
  },
  riskScore: {
    ...typography.title.medium,
    color: colors.text.primary,
  },
  riskHint: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },

  // Breakdown
  breakdownRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    ...typography.label.small,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.md,
  },
  emotionalBar: {
    height: 8,
    backgroundColor: colors.charcoal[300],
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  emotionalFill: {
    height: 8,
    backgroundColor: colors.gold[500],
    borderRadius: borderRadius.full,
  },
  emotionalText: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },

  // Emotion Row
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  emotionEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  emotionInfo: {
    flex: 1,
  },
  emotionName: {
    ...typography.body.medium,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  emotionCount: {
    ...typography.caption,
    color: colors.text.muted,
  },

  // Prediction
  predictionCard: {
    alignItems: 'center',
    backgroundColor: colors.slate[500],
  },
  predictionLabel: {
    ...typography.label.small,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  predictionSubtext: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },

  // Recommendations
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  recommendationText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flex: 1,
  },
});