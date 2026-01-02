// components/ListItems.tsx
/**
 * List Item Components for Fortuna
 * - TransactionItem: Expense/transaction row
 * - BillItem: Upcoming bill row
 * - GoalItem: Goal card with progress
 * - EmptyState: Empty list placeholder
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

// ============================================
// TYPES
// ============================================

interface Transaction {
  expense_id: string;
  date?: string;
  expense_date?: string;
  amount: number;
  merchant?: string;
  merchant_name?: string;
  category?: string | { category_name?: string };
  has_emotion?: boolean;
  emotion?: string | { primary_emotion?: string };
}

interface Bill {
  bill_id: string;
  name: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  category?: string;
  is_paid?: boolean;
}

interface Goal {
  goal_id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  completion_percentage: number;
  is_on_track: boolean;
  days_remaining?: number;
  deadline?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    'Food & Groceries': '🍎',
    'Eating Out': '🍔',
    'Transportation': '🚗',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Utilities': '💡',
    'Healthcare': '🏥',
    'Education': '📚',
    'Housing': '🏠',
  };
  return icons[category || ''] || '💰';
};

const getEmotionEmoji = (emotion?: string): string => {
  const emojis: Record<string, string> = {
    happy: '😊', excited: '🤩', celebratory: '🎉', planned: '📋',
    neutral: '😐', bored: '😑', tired: '😴', stressed: '😰',
    anxious: '😟', frustrated: '😤', sad: '😢', guilty: '😔', impulsive: '⚡',
  };
  return emojis[emotion || ''] || '';
};

const getGoalEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    savings: '💰', emergency_fund: '🆘', vacation: '✈️', house: '🏠',
    car: '🚗', education: '📚', retirement: '👴', wedding: '💒',
    debt_payoff: '💳', investment: '📈',
  };
  return emojis[type] || '🎯';
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatAmount = (amount: number): string => {
  return `$${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ============================================
// TRANSACTION ITEM
// ============================================

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showDate?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  showDate = true,
}) => {
  const date = transaction.expense_date || transaction.date || '';
  const merchant = transaction.merchant_name || transaction.merchant;
  const category = typeof transaction.category === 'object' 
    ? transaction.category?.category_name 
    : transaction.category;
  const hasEmotion = transaction.has_emotion || !!transaction.emotion;
  const emotionType = typeof transaction.emotion === 'object'
    ? transaction.emotion?.primary_emotion
    : transaction.emotion;

  return (
    <TouchableOpacity
      style={styles.transactionContainer}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getCategoryIcon(category)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.merchant} numberOfLines={1}>
            {merchant || category || 'Expense'}
          </Text>
          <Text style={styles.amount}>-{formatAmount(transaction.amount)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.meta}>
            {showDate && <Text style={styles.date}>{formatDate(date)}</Text>}
            {category && showDate && <Text style={styles.dot}>•</Text>}
            {category && <Text style={styles.category}>{category}</Text>}
          </View>
          {hasEmotion && (
            <View style={styles.emotionBadge}>
              <Text style={styles.emotionEmoji}>{getEmotionEmoji(emotionType)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// BILL ITEM
// ============================================

interface BillItemProps {
  bill: Bill;
  onPress?: () => void;
}

export const BillItem: React.FC<BillItemProps> = ({ bill, onPress }) => {
  const isOverdue = bill.days_until_due < 0;
  const isDueSoon = bill.days_until_due <= 3 && bill.days_until_due >= 0;

  const getDueText = (): string => {
    if (isOverdue) return `Overdue by ${Math.abs(bill.days_until_due)} days`;
    if (bill.days_until_due === 0) return 'Due today';
    return `Due in ${bill.days_until_due} days`;
  };

  return (
    <TouchableOpacity
      style={styles.billContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.billLeft}>
        <Text style={styles.billName}>{bill.name}</Text>
        <Text style={[
          styles.billDue,
          isOverdue && styles.billOverdue,
          isDueSoon && styles.billDueSoon,
        ]}>
          {getDueText()}
        </Text>
      </View>
      <Text style={styles.billAmount}>{formatAmount(bill.amount)}</Text>
    </TouchableOpacity>
  );
};

// ============================================
// GOAL ITEM
// ============================================

interface GoalItemProps {
  goal: Goal;
  onPress?: () => void;
  compact?: boolean;
}

export const GoalItem: React.FC<GoalItemProps> = ({ goal, onPress, compact = false }) => {
  if (compact) {
    return (
      <TouchableOpacity style={styles.goalCompact} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.goalCompactLeft}>
          <Text style={styles.goalEmoji}>{getGoalEmoji(goal.goal_type)}</Text>
          <View style={styles.goalCompactInfo}>
            <Text style={styles.goalName} numberOfLines={1}>{goal.goal_name}</Text>
            <Text style={styles.goalProgress}>{goal.completion_percentage.toFixed(0)}%</Text>
          </View>
        </View>
        <View style={styles.goalCompactProgressContainer}>
          <View style={styles.goalCompactProgressBg}>
            <View 
              style={[
                styles.goalCompactProgressFill,
                { 
                  width: `${Math.min(100, goal.completion_percentage)}%`,
                  backgroundColor: goal.is_on_track ? colors.emerald[500] : colors.gold[500],
                },
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.goalContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.goalHeader}>
        <View style={styles.goalIconContainer}>
          <Text style={styles.goalEmojiLarge}>{getGoalEmoji(goal.goal_type)}</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalName}>{goal.goal_name}</Text>
          <Text style={styles.goalType}>{goal.goal_type.replace('_', ' ')}</Text>
        </View>
        {goal.is_on_track ? (
          <View style={styles.onTrackBadge}>
            <Text style={styles.onTrackText}>On Track</Text>
          </View>
        ) : (
          <View style={styles.behindBadge}>
            <Text style={styles.behindText}>Behind</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.goalProgressContainer}>
        <View style={styles.goalAmountRow}>
          <Text style={styles.goalCurrent}>{formatAmount(goal.current_amount)}</Text>
          <Text style={styles.goalOf}>of</Text>
          <Text style={styles.goalTarget}>{formatAmount(goal.target_amount)}</Text>
        </View>
        <View style={styles.goalProgressBg}>
          <View 
            style={[
              styles.goalProgressFill,
              { 
                width: `${Math.min(100, goal.completion_percentage)}%`,
                backgroundColor: goal.is_on_track ? colors.emerald[500] : colors.gold[500],
              },
            ]} 
          />
        </View>
      </View>

      <View style={styles.goalFooter}>
        <Text style={styles.goalPercentage}>
          {goal.completion_percentage.toFixed(0)}% complete
        </Text>
        {goal.days_remaining !== undefined && (
          <Text style={styles.goalDeadline}>
            {goal.days_remaining > 0 ? `${goal.days_remaining} days left` : 'Due today'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  action,
  onAction,
}) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && onAction && (
      <TouchableOpacity style={styles.emptyButton} onPress={onAction}>
        <Text style={styles.emptyButtonText}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Transaction
  transactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  merchant: {
    ...typography.body.medium,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.body.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...typography.body.small,
    color: colors.text.muted,
  },
  dot: {
    ...typography.body.small,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  category: {
    ...typography.body.small,
    color: colors.text.muted,
  },
  emotionBadge: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  emotionEmoji: {
    fontSize: 12,
  },

  // Bill
  billContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  billLeft: {},
  billName: {
    ...typography.body.medium,
    fontWeight: '500',
    color: colors.text.primary,
  },
  billDue: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  billOverdue: {
    color: colors.burgundy[400],
  },
  billDueSoon: {
    color: colors.gold[500],
  },
  billAmount: {
    ...typography.title.medium,
    color: colors.text.accent,
  },

  // Goal - Full
  goalContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalEmojiLarge: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    ...typography.title.small,
    color: colors.text.primary,
  },
  goalType: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'capitalize',
  },
  onTrackBadge: {
    backgroundColor: colors.emerald[500] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  onTrackText: {
    ...typography.label.small,
    color: colors.emerald[500],
  },
  behindBadge: {
    backgroundColor: colors.gold[500] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  behindText: {
    ...typography.label.small,
    color: colors.gold[500],
  },
  goalProgressContainer: {
    marginBottom: spacing.sm,
  },
  goalAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  goalCurrent: {
    ...typography.body.medium,
    fontWeight: '600',
    color: colors.gold[500],
  },
  goalOf: {
    ...typography.body.small,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  goalTarget: {
    ...typography.body.medium,
    color: colors.text.tertiary,
  },
  goalProgressBg: {
    height: 10,
    backgroundColor: colors.charcoal[300],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: 10,
    borderRadius: borderRadius.full,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalPercentage: {
    ...typography.label.medium,
    color: colors.text.secondary,
  },
  goalDeadline: {
    ...typography.caption,
    color: colors.text.muted,
  },

  // Goal - Compact
  goalCompact: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  goalCompactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  goalEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  goalCompactInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalProgress: {
    ...typography.label.medium,
    color: colors.gold[500],
  },
  goalCompactProgressContainer: {
    marginTop: spacing.xs,
  },
  goalCompactProgressBg: {
    height: 6,
    backgroundColor: colors.charcoal[300],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  goalCompactProgressFill: {
    height: 6,
    borderRadius: borderRadius.full,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.title.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body.medium,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.emerald[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    ...typography.label.large,
    color: colors.text.primary,
  },
});