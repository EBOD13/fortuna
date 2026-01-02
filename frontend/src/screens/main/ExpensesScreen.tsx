// mobile/src/screens/main/ExpensesScreen.tsx
/**
 * Expenses List Screen
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../../services/api';
import { TransactionItem, TransactionHeader, EmptyTransactions } from '../../components/TransactionItem';
import { AmountDisplay } from '../../components/AmountDisplay';
import { colors, spacing, typography } from '../../theme';
import type { Expense, RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GroupedExpenses {
  date: string;
  total: number;
  expenses: Expense[];
}

export const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  const fetchExpenses = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      
      const today = new Date();
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.start_date = weekAgo.toISOString().split('T')[0];
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.start_date = monthAgo.toISOString().split('T')[0];
      }

      const data = await api.getExpenses(params);
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  // Group expenses by date
  const groupedExpenses: GroupedExpenses[] = React.useMemo(() => {
    const groups: Record<string, GroupedExpenses> = {};

    expenses.forEach((expense) => {
      const date = expense.expense_date;
      if (!groups[date]) {
        groups[date] = { date, total: 0, expenses: [] };
      }
      groups[date].expenses.push(expense);
      groups[date].total += expense.amount;
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses]);

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const emotionCount = expenses.filter((e) => e.emotion).length;

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All' },
  ] as const;

  const renderItem = ({ item, index }: { item: GroupedExpenses; index: number }) => (
    <View>
      <TransactionHeader
        date={item.date}
        total={item.total}
        count={item.expenses.length}
      />
      {item.expenses.map((expense) => (
        <TransactionItem
          key={expense.expense_id}
          transaction={expense}
          showDate={false}
          onPress={() =>
            navigation.navigate('ExpenseDetail', { expenseId: expense.expense_id })
          }
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense', {})}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period.key && styles.periodTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <AmountDisplay amount={totalSpent} size="medium" />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{expenses.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>With Emotions</Text>
          <Text style={styles.summaryValue}>
            {emotionCount} ({expenses.length > 0 ? Math.round((emotionCount / expenses.length) * 100) : 0}%)
          </Text>
        </View>
      </View>

      {/* Expense List */}
      <FlatList
        data={groupedExpenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.date}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          isLoading ? null : <EmptyTransactions />
        }
        contentContainerStyle={groupedExpenses.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.headline.small,
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  addButtonText: {
    ...typography.label.medium,
    color: colors.text.inverse,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  periodButtonActive: {
    backgroundColor: colors.primary[500],
  },
  periodText: {
    ...typography.label.medium,
    color: colors.text.secondary,
  },
  periodTextActive: {
    color: colors.text.inverse,
  },

  // Summary
  summary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray[50],
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.body.small,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.title.small,
    color: colors.text.primary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },

  emptyList: {
    flex: 1,
  },
});