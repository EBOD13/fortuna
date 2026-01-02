// mobile/src/components/TransactionItem.tsx
/**
 * Transaction/Expense list item
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { AmountDisplay } from './AmountDisplay';
import type { Expense, RecentTransaction } from '../types';

interface TransactionItemProps {
  transaction: Expense | RecentTransaction;
  onPress?: () => void;
  showDate?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  showDate = true,
}) => {
  const isExpense = 'expense_id' in transaction;
  
  const date = isExpense ? transaction.expense_date : transaction.date;
  const amount = transaction.amount;
  const merchant = isExpense ? transaction.merchant_name : transaction.merchant;
  const category = isExpense
    ? transaction.category?.category_name
    : transaction.category;
  const hasEmotion = isExpense ? !!transaction.emotion : transaction.has_emotion;
  const emotionType = isExpense
    ? transaction.emotion?.primary_emotion
    : transaction.emotion;

  const getCategoryIcon = (cat?: string): string => {
    const icons: Record<string, string> = {
      'Food & Groceries': '🍎',
      'Eating Out': '🍔',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Utilities': '💡',
      'Healthcare': '🏥',
      'Education': '📚',
    };
    return icons[cat || ''] || '💰';
  };

  const getEmotionEmoji = (emotion?: string): string => {
    const emojis: Record<string, string> = {
      happy: '😊',
      excited: '🤩',
      celebratory: '🎉',
      planned: '📋',
      neutral: '😐',
      bored: '😑',
      tired: '😴',
      stressed: '😰',
      anxious: '😟',
      frustrated: '😤',
      sad: '😢',
      guilty: '😔',
      impulsive: '⚡',
    };
    return emojis[emotion || ''] || '';
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={styles.container}
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
          <AmountDisplay amount={-amount} size="small" color={colors.text.primary} />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.meta}>
            {showDate && <Text style={styles.date}>{formatDate(date)}</Text>}
            {category && showDate && <Text style={styles.dot}>•</Text>}
            {category && <Text style={styles.category}>{category}</Text>}
          </View>

          {hasEmotion && (
            <View style={styles.emotionBadge}>
              <Text style={styles.emotionEmoji}>
                {getEmotionEmoji(emotionType)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Transaction List Header (for grouping by date)
interface TransactionHeaderProps {
  date: string;
  total: number;
  count: number;
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  date,
  total,
  count,
}) => {
  const formatHeaderDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerDate}>{formatHeaderDate(date)}</Text>
      <View style={styles.headerRight}>
        <Text style={styles.headerCount}>{count} transactions</Text>
        <AmountDisplay amount={-total} size="small" color={colors.text.secondary} />
      </View>
    </View>
  );
};

// Empty State
interface EmptyTransactionsProps {
  message?: string;
}

export const EmptyTransactions: React.FC<EmptyTransactionsProps> = ({
  message = 'No transactions yet',
}) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>
        Tap the + button to add your first expense
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
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
    color: colors.text.tertiary,
  },
  dot: {
    ...typography.body.small,
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  category: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  emotionBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
  },
  emotionEmoji: {
    fontSize: 14,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[50],
  },
  headerDate: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCount: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.title.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});