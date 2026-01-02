// mobile/src/screens/main/DashboardScreen.tsx
/**
 * Dashboard Screen - Main home screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/Input';
import { AmountDisplay, ProgressBar } from '../../components/AmountDisplay';
import { TransactionItem } from '../../components/TransactionItem';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { Dashboard, RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {dashboard?.greeting || 'Hello'}, {firstName}! 👋
            </Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBadge}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {(dashboard?.notifications?.unread_count ?? 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {dashboard?.notifications?.unread_count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats Card */}
        <Card variant="elevated" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>This Month</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>
                {dashboard?.quick_stats?.spending_trend === 'up'
                  ? '📈 Up'
                  : dashboard?.quick_stats?.spending_trend === 'down'
                  ? '📉 Down'
                  : '➡️ Stable'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Spent</Text>
              <AmountDisplay
                amount={dashboard?.quick_stats?.monthly_spending || 0}
                size="large"
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Income</Text>
              <AmountDisplay
                amount={dashboard?.quick_stats?.monthly_income || 0}
                size="large"
                color={colors.success}
              />
            </View>
          </View>

          <View style={styles.netRow}>
            <Text style={styles.netLabel}>Net this month</Text>
            <AmountDisplay
              amount={dashboard?.quick_stats?.net_this_month || 0}
              size="medium"
              showSign
              positive={(dashboard?.quick_stats?.net_this_month || 0) >= 0}
            />
          </View>
        </Card>

        {/* Budget Progress */}
        {dashboard?.budget_summary?.has_active_budget && (
          <Card variant="outlined" style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.sectionTitle}>Budget</Text>
              <Text style={styles.budgetRemaining}>
                ${dashboard.budget_summary.total_remaining?.toFixed(0)} left
              </Text>
            </View>

            <ProgressBar
              progress={dashboard.budget_summary.overall_spent_percentage || 0}
              height={12}
              style={styles.budgetProgress}
            />

            <View style={styles.budgetFooter}>
              <Text style={styles.budgetText}>
                ${dashboard.budget_summary.total_spent?.toFixed(0)} of $
                {dashboard.budget_summary.total_budgeted?.toFixed(0)}
              </Text>
              <Text style={styles.budgetDays}>
                {dashboard.budget_summary.days_remaining} days left
              </Text>
            </View>

            {dashboard.budget_summary.daily_allowance && (
              <View style={styles.allowanceRow}>
                <Text style={styles.allowanceLabel}>Daily allowance:</Text>
                <AmountDisplay
                  amount={dashboard.budget_summary.daily_allowance}
                  size="small"
                  color={colors.primary[600]}
                />
              </View>
            )}
          </Card>
        )}

        {/* Today's Spending */}
        <Card variant="outlined" style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.sectionTitle}>Today</Text>
            <AmountDisplay
              amount={dashboard?.spending_today?.total || 0}
              size="medium"
            />
          </View>

          {dashboard?.spending_today?.daily_allowance && (
            <View style={styles.todayAllowance}>
              <ProgressBar
                progress={
                  ((dashboard.spending_today.total || 0) /
                    dashboard.spending_today.daily_allowance) *
                  100
                }
                height={6}
              />
              <Text style={styles.allowanceText}>
                ${dashboard.spending_today.remaining_allowance?.toFixed(2)}{' '}
                remaining of ${dashboard.spending_today.daily_allowance} daily
                allowance
              </Text>
            </View>
          )}

          {dashboard?.spending_today?.transactions?.map((t) => (
            <TransactionItem
              key={t.expense_id}
              transaction={t}
              showDate={false}
            />
          ))}

          {!dashboard?.spending_today?.transactions?.length && (
            <Text style={styles.noTransactions}>
              No spending yet today 🎉
            </Text>
          )}
        </Card>

        {/* Goals Overview */}
        {(dashboard?.goals_overview?.active_goals ?? 0) > 0 && (
          <Card variant="outlined" style={styles.goalsCard}>
            <View style={styles.goalsHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <Text style={styles.goalsCount}>
                {dashboard?.goals_overview?.active_goals} active
              </Text>
            </View>

            <View style={styles.goalsProgress}>
              <ProgressBar
                progress={dashboard?.goals_overview?.overall_progress || 0}
                height={8}
                color={colors.secondary[500]}
              />
              <Text style={styles.goalsProgressText}>
                ${dashboard?.goals_overview?.total_saved?.toFixed(0)} saved of $
                {dashboard?.goals_overview?.total_target?.toFixed(0)}
              </Text>
            </View>

            {dashboard?.goals_overview?.top_goals?.slice(0, 2).map((goal) => (
              <View key={goal.goal_id} style={styles.goalItem}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalDeadline}>
                    {goal.days_remaining
                      ? `${goal.days_remaining} days left`
                      : 'No deadline'}
                  </Text>
                </View>
                <View style={styles.goalProgress}>
                  <Text style={styles.goalPercentage}>{goal.percentage}%</Text>
                  {goal.is_on_track ? (
                    <Text style={styles.onTrack}>✓ On track</Text>
                  ) : (
                    <Text style={styles.offTrack}>⚠ Behind</Text>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Goals')}
            >
              <Text style={styles.viewAllText}>View all goals →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Daily Insight */}
        {dashboard?.insights?.tip && (
          <Card variant="elevated" style={styles.insightCard}>
            <Text style={styles.insightText}>{dashboard.insights.tip}</Text>
          </Card>
        )}

        {/* Streak */}
        {dashboard?.streaks?.has_streak && (
          <Card variant="outlined" style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>
              {dashboard.streaks.logging_streak} day streak!
            </Text>
            <Text style={styles.streakSubtext}>Keep logging daily</Text>
          </Card>
        )}

        {/* Spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.headline.small,
    color: colors.text.primary,
  },
  date: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  notificationBadge: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...typography.label.small,
    color: colors.text.inverse,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primary[500],
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.title.small,
    color: colors.text.inverse,
  },
  trendBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  trendText: {
    ...typography.label.small,
    color: colors.text.inverse,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...typography.body.small,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.md,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  netLabel: {
    ...typography.body.medium,
    color: 'rgba(255,255,255,0.7)',
  },

  // Budget Card
  budgetCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title.small,
    color: colors.text.primary,
  },
  budgetRemaining: {
    ...typography.label.large,
    color: colors.primary[600],
  },
  budgetProgress: {
    marginBottom: spacing.sm,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  budgetDays: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  allowanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  allowanceLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },

  // Today Card
  todayCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  todayAllowance: {
    marginBottom: spacing.md,
  },
  allowanceText: {
    ...typography.body.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  noTransactions: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Goals Card
  goalsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalsCount: {
    ...typography.label.medium,
    color: colors.text.tertiary,
  },
  goalsProgress: {
    marginBottom: spacing.md,
  },
  goalsProgressText: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    ...typography.body.medium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  goalDeadline: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  goalProgress: {
    alignItems: 'flex-end',
  },
  goalPercentage: {
    ...typography.title.small,
    color: colors.text.primary,
  },
  onTrack: {
    ...typography.label.small,
    color: colors.success,
  },
  offTrack: {
    ...typography.label.small,
    color: colors.warning,
  },
  viewAllButton: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  viewAllText: {
    ...typography.label.medium,
    color: colors.primary[500],
    textAlign: 'center',
  },

  // Insight Card
  insightCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.secondary[50],
  },
  insightText: {
    ...typography.body.medium,
    color: colors.secondary[900],
    textAlign: 'center',
  },

  // Streak Card
  streakCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  streakText: {
    ...typography.title.medium,
    color: colors.text.primary,
  },
  streakSubtext: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});