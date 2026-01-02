// src/screens/HomeScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { ProgressBar } from '../components/charts/ChartComponents';
import ExpenseCard, { Expense, ExpenseCategory } from '../components/cards/ExpenseCard';
import FilterSheet, { FilterButton, ActiveFiltersBar, FilterState } from '../components/modals/FilterSheet';
import { SearchModal, SearchResult, SearchCategory, RecentSearch, SearchSuggestion } from '../components/search/SearchBar';

// Import API hooks
import { useIncomes } from '../hooks/useIncome';
import { useRecentExpenses, useExpenseStats } from '../hooks/useExpense';
import { useUpcomingBills } from '../hooks/useBill';
import { useGoals } from '../hooks/useGoal';
import { useActiveBudget } from '../hooks/useBudget';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type FinancialSummary = {
  totalIncome: number;
  totalSpent: number;
  totalOwed: number;
  incomeChange: number;
  spentChange: number;
};

type UpcomingExpense = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  category: 'bill' | 'subscription' | 'loan' | 'dependent' | 'other';
  is_autopay: boolean;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  color: string;
  icon: string;
};

type RecentTransaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  merchant?: string;
  emotion?: 'happy' | 'excited' | 'content' | 'neutral' | 'stressed' | 'anxious' | 'sad' | 'frustrated' | 'guilty' | 'impulsive';
  was_planned?: boolean;
};

type Insight = {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'neutral';
  icon: string;
};

// ============ HEADER COMPONENT ============
const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.navigate('NotificationsScreen')}
      >
        <SFSymbol name="bell" size={22} color="#000" />
      </TouchableOpacity>
      <Text style={styles.appName}>Fortuna</Text>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.navigate('ProfileScreen')}
      >
        <SFSymbol name="person.circle" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

// ============ TOP BOX - FINANCIAL SUMMARY ============
type FinancialSummaryCardProps = {
  summary: FinancialSummary;
};

const FinancialSummaryCard = ({ summary }: FinancialSummaryCardProps) => {
  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.mainBalanceCard}>
        <Text style={styles.mainBalanceLabel}>This Month</Text>
        <Text style={styles.mainBalanceDate}>December 2024</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#046C4E15' }]}>
              <SFSymbol name="arrow.down.circle.fill" size={18} color="#046C4E" />
            </View>
          </View>
          <Text style={styles.statAmount}>{formatCurrency(summary.totalIncome)}</Text>
          <Text style={styles.statLabel}>Income</Text>
          <View style={styles.changeContainer}>
            <SFSymbol
              name={summary.incomeChange >= 0 ? 'arrow.up.right' : 'arrow.down.right'}
              size={10}
              color={summary.incomeChange >= 0 ? '#046C4E' : '#DC2626'}
            />
            <Text
              style={[
                styles.changeText,
                { color: summary.incomeChange >= 0 ? '#046C4E' : '#DC2626' },
              ]}
            >
              {formatChange(summary.incomeChange)}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#DC262615' }]}>
              <SFSymbol name="arrow.up.circle.fill" size={18} color="#DC2626" />
            </View>
          </View>
          <Text style={styles.statAmount}>{formatCurrency(summary.totalSpent)}</Text>
          <Text style={styles.statLabel}>Spent</Text>
          <View style={styles.changeContainer}>
            <SFSymbol
              name={summary.spentChange <= 0 ? 'arrow.down.right' : 'arrow.up.right'}
              size={10}
              color={summary.spentChange <= 0 ? '#046C4E' : '#DC2626'}
            />
            <Text
              style={[
                styles.changeText,
                { color: summary.spentChange <= 0 ? '#046C4E' : '#DC2626' },
              ]}
            >
              {formatChange(Math.abs(summary.spentChange))}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
              <SFSymbol name="clock.fill" size={18} color="#F59E0B" />
            </View>
          </View>
          <Text style={styles.statAmount}>{formatCurrency(summary.totalOwed)}</Text>
          <Text style={styles.statLabel}>Owed</Text>
          <Text style={styles.owedSubtext}>remaining</Text>
        </View>
      </View>
    </View>
  );
};

// ============ MIDDLE BOX - UPCOMING EXPENSES ============
type UpcomingExpenseItemProps = {
  expense: UpcomingExpense;
};

const UpcomingExpenseItem = ({ expense }: UpcomingExpenseItemProps) => {
  const getCategoryIcon = () => {
    switch (expense.category) {
      case 'bill':
        return 'doc.text.fill';
      case 'subscription':
        return 'play.rectangle.fill';
      case 'loan':
        return 'building.columns.fill';
      case 'dependent':
        return 'person.fill';
      default:
        return 'dollarsign.circle.fill';
    }
  };

  const getCategoryColor = () => {
    switch (expense.category) {
      case 'bill':
        return '#2563EB';
      case 'subscription':
        return '#7C3AED';
      case 'loan':
        return '#DC2626';
      case 'dependent':
        return '#F59E0B';
      default:
        return '#8E8E93';
    }
  };

  const getDaysUntil = () => {
    const today = new Date();
    const dueDate = new Date(expense.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntil();

  return (
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIcon, { backgroundColor: getCategoryColor() + '15' }]}>
        <SFSymbol name={getCategoryIcon()} size={18} color={getCategoryColor()} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseName}>{expense.name}</Text>
        <Text style={styles.expenseDue}>
          {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
        </Text>
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>${expense.amount.toLocaleString()}</Text>
        {expense.is_autopay && (
          <View style={styles.autoPayBadge}>
            <SFSymbol name="arrow.triangle.2.circlepath" size={8} color="#046C4E" />
          </View>
        )}
      </View>
    </View>
  );
};

type UpcomingExpensesCardProps = {
  expenses: UpcomingExpense[];
};

const UpcomingExpensesCard = ({ expenses }: UpcomingExpensesCardProps) => {
  const totalUpcoming = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleContainer}>
          <SFSymbol name="calendar.badge.clock" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>Upcoming Expenses</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.upcomingTotal}>
        <Text style={styles.upcomingTotalLabel}>Next 7 days</Text>
        <Text style={styles.upcomingTotalAmount}>${totalUpcoming.toLocaleString()}</Text>
      </View>

      <View style={styles.expensesList}>
        {expenses.slice(0, 4).map((expense) => (
          <UpcomingExpenseItem key={expense.id} expense={expense} />
        ))}
      </View>
    </View>
  );
};

// ============ MIDDLE BOX - GOALS PROGRESS ============
type GoalProgressItemProps = {
  goal: Goal;
};

const GoalProgressItem = ({ goal }: GoalProgressItemProps) => {
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <TouchableOpacity style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: goal.color + '15' }]}>
          <SFSymbol name={goal.icon} size={18} color={goal.color} />
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalRemaining}>
            ${remaining.toLocaleString()} to go
          </Text>
        </View>
        <Text style={styles.goalPercentage}>{Math.round(progress)}%</Text>
      </View>
      <ProgressBar
        progress={progress}
        height={6}
        color={goal.color}
        backgroundColor="#F2F2F7"
      />
      <View style={styles.goalAmounts}>
        <Text style={styles.goalCurrentAmount}>
          ${goal.current_amount.toLocaleString()}
        </Text>
        <Text style={styles.goalTargetAmount}>
          ${goal.target_amount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

type GoalsProgressCardProps = {
  goals: Goal[];
};

const GoalsProgressCard = ({ goals }: GoalsProgressCardProps) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleContainer}>
          <SFSymbol name="target" size={20} color="#046C4E" />
          <Text style={styles.sectionTitle}>Goals Progress</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalsList}>
        {goals.slice(0, 3).map((goal) => (
          <GoalProgressItem key={goal.id} goal={goal} />
        ))}
      </View>
    </View>
  );
};

// ============ LOWER BOX - RECENT TRANSACTIONS ============
const convertToExpense = (transaction: RecentTransaction): Expense => ({
  expense_id: transaction.id,
  amount: Math.abs(transaction.amount),
  description: transaction.description,
  category: (transaction.category.toLowerCase().replace(/\s+/g, '_') as ExpenseCategory) || 'other',
  date: new Date().toISOString().split('T')[0],
  merchant: transaction.merchant,
  emotion: transaction.emotion,
  was_planned: transaction.was_planned,
});

type RecentTransactionsCardProps = {
  transactions: RecentTransaction[];
};

const RecentTransactionsCard = ({ transactions }: RecentTransactionsCardProps) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'this_month',
    categories: ['all'],
    emotions: ['all'],
    expenseTypes: ['all'],
    sortBy: 'date_desc',
  });
  
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const filteredTransactions = expenseTransactions.filter(t => {
    if (!filters.categories.includes('all')) {
      const category = t.category.toLowerCase().replace(/\s+/g, '_');
      if (!filters.categories.includes(category as any)) return false;
    }
    if (!filters.emotions.includes('all') && t.emotion) {
      if (!filters.emotions.includes(t.emotion as any)) return false;
    }
    if (!filters.expenseTypes.includes('all')) {
      if (filters.expenseTypes.includes('planned') && !t.was_planned) return false;
      if (filters.expenseTypes.includes('impulse') && t.was_planned !== false) return false;
    }
    return true;
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== 'this_month') count++;
    if (!filters.categories.includes('all')) count += filters.categories.length;
    if (!filters.emotions.includes('all')) count += filters.emotions.length;
    if (!filters.expenseTypes.includes('all')) count += filters.expenseTypes.length;
    return count;
  };

  const handleRemoveFilter = (filterType: string, value?: string) => {
    setFilters(prev => {
      switch (filterType) {
        case 'dateRange':
          return { ...prev, dateRange: 'this_month' };
        case 'category':
          const newCategories = prev.categories.filter(c => c !== value);
          return { ...prev, categories: newCategories.length === 0 ? ['all'] : newCategories };
        case 'emotion':
          const newEmotions = prev.emotions.filter(e => e !== value);
          return { ...prev, emotions: newEmotions.length === 0 ? ['all'] : newEmotions };
        case 'expenseType':
          const newTypes = prev.expenseTypes.filter(t => t !== value);
          return { ...prev, expenseTypes: newTypes.length === 0 ? ['all'] : newTypes };
        default:
          return prev;
      }
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      dateRange: 'this_month',
      categories: ['all'],
      emotions: ['all'],
      expenseTypes: ['all'],
      sortBy: 'date_desc',
    });
  };
  
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleContainer}>
          <SFSymbol name="clock.arrow.circlepath" size={20} color="#7C3AED" />
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
        </View>
        <View style={styles.sectionHeaderActions}>
          <FilterButton 
            onPress={() => setShowFilterSheet(true)}
            activeCount={getActiveFilterCount()}
            size="small"
            label="Filter"
          />
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
      </View>

      {getActiveFilterCount() > 0 && (
        <ActiveFiltersBar
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
      )}

      <View style={styles.transactionsList}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <SFSymbol name="tray" size={32} color="#C7C7CC" />
            <Text style={styles.emptyTransactionsText}>No expenses match your filters</Text>
          </View>
        ) : (
          filteredTransactions.slice(0, 5).map((transaction) => (
            <ExpenseCard
              key={transaction.id}
              expense={convertToExpense(transaction)}
              variant="compact"
              showEmotions={true}
              onPress={() => {
                navigation.navigate('ExpenseDetailScreen', { expenseId: transaction.id });
              }}
            />
          ))
        )}
      </View>

      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        initialFilters={filters}
        showEmotions={true}
        showExpenseTypes={true}
        showAmountRange={true}
        showSearch={false}
        title="Filter Expenses"
      />
    </View>
  );
};

// ============ LOWER BOX - INSIGHTS ============
type InsightItemProps = {
  insight: Insight;
};

const InsightItem = ({ insight }: InsightItemProps) => {
  const getTypeColor = () => {
    switch (insight.type) {
      case 'positive':
        return '#046C4E';
      case 'warning':
        return '#F59E0B';
      default:
        return '#2563EB';
    }
  };

  return (
    <TouchableOpacity style={styles.insightItem}>
      <View style={[styles.insightIcon, { backgroundColor: getTypeColor() + '15' }]}>
        <SFSymbol name={insight.icon} size={18} color={getTypeColor()} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
      <SFSymbol name="chevron.right" size={14} color="#C7C7CC" />
    </TouchableOpacity>
  );
};

type InsightsCardProps = {
  insights: Insight[];
};

const InsightsCard = ({ insights }: InsightsCardProps) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleContainer}>
          <SFSymbol name="lightbulb.fill" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Insights</Text>
        </View>
      </View>

      <View style={styles.insightsList}>
        {insights.map((insight) => (
          <InsightItem key={insight.id} insight={insight} />
        ))}
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Fetch data using hooks
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes();
  const { expenses: recentExpensesAPI = [], isLoading: expensesLoading } = useRecentExpenses(10);
  const { bills: upcomingBillsAPI = [], isLoading: billsLoading } = useUpcomingBills(14);
  const { goals: goalsAPI = [], isLoading: goalsLoading } = useGoals({});
  const { budget: activeBudget, isLoading: budgetLoading } = useActiveBudget();
  const { stats: expenseStats } = useExpenseStats({});

  // Compute loading state
  const loading = incomesLoading || expensesLoading || billsLoading || goalsLoading || budgetLoading;

  // Calculate total income from incomes data
  const totalIncome = useMemo(() => {
    if (!incomes || incomes.length === 0) return 0;
    
    return incomes.reduce((sum, income) => {
      let monthlyIncome = 0;
      if (income.rate_value && income.rate_unit && income.pay_frequency) {
        monthlyIncome = income.rate_value;
        
        const unitMultiplier: Record<string, number> = {
          'hour': 160,
          'day': 20,
          'week': 4.33,
          'month': 1,
          'term': 0.33,
          'payout': 1,
          'unit': income.max_units_per_period || 1,
        };
        
        const frequencyMultiplier: Record<string, number> = {
          'weekly': 4.33,
          'biweekly': 2.17,
          'monthly': 1,
          'per_term': 0.33,
          'irregular': 0.5,
        };
        
        monthlyIncome *= (unitMultiplier[income.rate_unit] || 1);
        monthlyIncome *= (frequencyMultiplier[income.pay_frequency] || 1);
      }
      
      return sum + monthlyIncome;
    }, 0);
  }, [incomes]);

  // Compute summary from API data
  const summary: FinancialSummary | null = useMemo(() => {
    return {
      totalIncome: totalIncome || 0,
      totalSpent: expenseStats?.total_spent || 0,
      totalOwed: upcomingBillsAPI?.reduce((sum, b) => sum + b.amount, 0) || 0,
      incomeChange: 0,
      spentChange: 0,
    };
  }, [totalIncome, expenseStats, upcomingBillsAPI]);

  // Transform upcoming bills to local format
  const upcomingExpenses: UpcomingExpense[] = useMemo(() => {
    if (!upcomingBillsAPI) return [];
    return upcomingBillsAPI.map(b => ({
      id: b.bill_id,
      name: b.bill_name,
      amount: b.amount,
      due_date: b.due_date,
      category: b.category as 'bill' | 'subscription' | 'loan' | 'dependent' | 'other',
      is_autopay: b.is_auto_pay,
    }));
  }, [upcomingBillsAPI]);

  // Transform goals to local format
  const goals: Goal[] = useMemo(() => {
    if (!goalsAPI) return [];
    return goalsAPI.map(g => ({
      id: g.goal_id,
      name: g.goal_name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      deadline: g.target_date,
      color: g.color || '#046C4E',
      icon: g.icon || 'target',
    }));
  }, [goalsAPI]);

  // Map API emotion type to local emotion type
  const mapEmotion = (emotion?: string): RecentTransaction['emotion'] => {
    const validEmotions = ['happy', 'excited', 'content', 'neutral', 'stressed', 'anxious', 'sad', 'frustrated', 'guilty', 'impulsive'];
    if (emotion && validEmotions.includes(emotion)) {
      return emotion as RecentTransaction['emotion'];
    }
    return undefined;
  };

  // Transform recent expenses to transactions
  const recentTransactions: RecentTransaction[] = useMemo(() => {
    if (!recentExpensesAPI) return [];
    return recentExpensesAPI.map(e => ({
      id: e.expense_id,
      description: e.description,
      amount: e.amount,
      type: 'expense' as const,
      category: e.category,
      date: e.expense_date,
      merchant: e.merchant,
      emotion: mapEmotion(e.emotion),
      was_planned: e.was_planned,
    }));
  }, [recentExpensesAPI]);

  // Compute insights based on data
  const insights: Insight[] = useMemo(() => {
    const computedInsights: Insight[] = [];
    
    if (summary && summary.spentChange < 0) {
      computedInsights.push({
        id: '1',
        title: 'You\'re on track! 🎉',
        description: `Spending is ${Math.abs(summary.spentChange).toFixed(0)}% lower than last month`,
        type: 'positive',
        icon: 'chart.line.downtrend.xyaxis',
      });
    }
    
    if (upcomingExpenses.length > 0) {
      const upcomingTotal = upcomingExpenses.slice(0, 3).reduce((sum, e) => sum + e.amount, 0);
      computedInsights.push({
        id: '2',
        title: 'Bill reminder',
        description: `${Math.min(upcomingExpenses.length, 3)} bills due in the next 7 days totaling $${upcomingTotal.toLocaleString()}`,
        type: 'warning',
        icon: 'bell.badge.fill',
      });
    }
    
    if (goals.length > 0) {
      const topGoal = goals[0];
      const progress = (topGoal.current_amount / topGoal.target_amount * 100).toFixed(0);
      computedInsights.push({
        id: '3',
        title: 'Goal milestone',
        description: `${topGoal.name} is ${progress}% complete!`,
        type: 'positive',
        icon: 'star.fill',
      });
    }
    
    return computedInsights;
  }, [summary?.spentChange, upcomingExpenses, goals]);
  
  // Search state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const recentSearches: RecentSearch[] = [
    { id: '1', query: 'groceries', category: 'expenses', timestamp: '2024-12-29' },
    { id: '2', query: 'vacation fund', category: 'goals', timestamp: '2024-12-28' },
    { id: '3', query: 'netflix', category: 'bills', timestamp: '2024-12-27' },
  ];
  
  const searchSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'This month\'s spending', icon: 'calendar' },
    { id: '2', text: 'Impulse purchases', icon: 'bolt.fill' },
    { id: '3', text: 'Recurring bills', icon: 'repeat' },
    { id: '4', text: 'Goals progress', icon: 'target' },
    { id: '5', text: 'Emotional spending', icon: 'heart.fill' },
  ];

  const handleSearch = async (query: string, category: SearchCategory) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    
    const mockResults: SearchResult[] = [];
    
    if (category === 'all' || category === 'expenses') {
      if (query.toLowerCase().includes('grocer') || query.toLowerCase().includes('food')) {
        mockResults.push({
          id: 'exp1',
          type: 'expense',
          title: 'Whole Foods',
          subtitle: 'Groceries • Yesterday',
          icon: 'cart.fill',
          iconColor: '#84CC16',
          amount: 127.45,
        });
        mockResults.push({
          id: 'exp2',
          type: 'expense',
          title: 'Trader Joe\'s',
          subtitle: 'Groceries • Dec 25',
          icon: 'cart.fill',
          iconColor: '#84CC16',
          amount: 89.32,
        });
      }
      if (query.toLowerCase().includes('uber') || query.toLowerCase().includes('transport')) {
        mockResults.push({
          id: 'exp3',
          type: 'expense',
          title: 'Uber',
          subtitle: 'Transport • Yesterday',
          icon: 'car.fill',
          iconColor: '#3B82F6',
          amount: 24.50,
        });
      }
    }
    
    if (category === 'all' || category === 'goals') {
      if (query.toLowerCase().includes('vacation') || query.toLowerCase().includes('fund')) {
        mockResults.push({
          id: 'goal1',
          type: 'goal',
          title: 'Vacation Fund',
          subtitle: '45% complete • $2,250 of $5,000',
          icon: 'airplane',
          iconColor: '#0EA5E9',
          amount: 2250,
        });
      }
      if (query.toLowerCase().includes('emergency') || query.toLowerCase().includes('fund')) {
        mockResults.push({
          id: 'goal2',
          type: 'goal',
          title: 'Emergency Fund',
          subtitle: '65% complete • $6,500 of $10,000',
          icon: 'shield.fill',
          iconColor: '#046C4E',
          amount: 6500,
        });
      }
    }
    
    if (category === 'all' || category === 'bills') {
      if (query.toLowerCase().includes('netflix') || query.toLowerCase().includes('subscription')) {
        mockResults.push({
          id: 'bill1',
          type: 'bill',
          title: 'Netflix',
          subtitle: 'Subscription • Due Jan 7',
          icon: 'play.tv.fill',
          iconColor: '#DC2626',
          amount: 15.99,
        });
      }
      if (query.toLowerCase().includes('electric') || query.toLowerCase().includes('bill')) {
        mockResults.push({
          id: 'bill2',
          type: 'bill',
          title: 'Electric Bill',
          subtitle: 'Utility • Due Jan 5',
          icon: 'bolt.fill',
          iconColor: '#F59E0B',
          amount: 120,
        });
      }
    }
    
    if (category === 'all' || category === 'budgets') {
      if (query.toLowerCase().includes('budget') || query.toLowerCase().includes('january')) {
        mockResults.push({
          id: 'budget1',
          type: 'budget',
          title: 'January 2025 Budget',
          subtitle: '58% used • $3,847 of $5,200',
          icon: 'chart.pie.fill',
          iconColor: '#7C3AED',
          amount: 5200,
        });
      }
    }
    
    setSearchResults(mockResults);
    setSearchLoading(false);
  };

  const handleSearchResultPress = (result: SearchResult) => {
    setShowSearchModal(false);
    
    switch (result.type) {
      case 'expense':
        navigation.navigate('ExpenseDetailScreen', { expenseId: result.id });
        break;
      case 'goal':
        navigation.navigate('GoalDetailScreen', { goalId: result.id });
        break;
      case 'budget':
        navigation.navigate('BudgetDetailScreen', { budgetId: result.id });
        break;
      case 'bill':
        navigation.navigate('BillDetailScreen', { billId: result.id });
        break;
      case 'income':
        navigation.navigate('IncomeDetailScreen', { incomeId: result.id });
        break;
      case 'dependent':
        navigation.navigate('DependentDetailScreen', { dependentId: result.id });
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.greetingSubtext}>Here's your financial overview</Text>
          <TouchableOpacity 
            style={styles.greetingSearchButton}
            onPress={() => setShowSearchModal(true)}
          >
            <SFSymbol name="magnifyingglass" size={20} color="#8E8E93" />
            <Text style={styles.greetingSearchText}>Search</Text>
          </TouchableOpacity>
        </View>

        {summary && <FinancialSummaryCard summary={summary} />}
        <UpcomingExpensesCard expenses={upcomingExpenses} />
        <GoalsProgressCard goals={goals} />
        <RecentTransactionsCard transactions={recentTransactions} />
        <InsightsCard insights={insights} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleSearch}
        onResultPress={handleSearchResultPress}
        results={searchResults}
        recentSearches={recentSearches}
        suggestions={searchSuggestions}
        loading={searchLoading}
        title="Search"
      />
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8,
  },
  appName: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  greetingSubtext: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  greetingSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  greetingSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryContainer: {
    marginBottom: 16,
  },
  mainBalanceCard: {
    backgroundColor: '#046C4E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mainBalanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  mainBalanceDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    marginBottom: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  owedSubtext: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#046C4E',
    fontWeight: '500',
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  upcomingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  upcomingTotalLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  upcomingTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  expenseDue: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  expenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  autoPayBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#046C4E15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsList: {
    gap: 16,
  },
  goalItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  goalRemaining: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalCurrentAmount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  goalTargetAmount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  insightDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 100,
  },
});