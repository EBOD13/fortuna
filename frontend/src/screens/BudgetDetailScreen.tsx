// src/screens/BudgetDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { ProgressBar, BarChart, SpendingBreakdown, ComparisonBar } from '../components/charts/ChartComponents';
import ExpenseCard, { Expense, ExpenseCategory, EmotionType } from '../components/cards/ExpenseCard';
import FilterSheet, { FilterButton, ActiveFiltersBar, FilterState } from '../components/modals/FilterSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TYPES ============
type BudgetStatus = 'active' | 'paused' | 'closed';
type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

type CategoryAllocation = {
  allocation_id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  is_essential: boolean;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  transaction_count: number;
  daily_average: number;
  projected_total: number;
  status: 'on_track' | 'warning' | 'over_budget' | 'under_budget';
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
};

type DailySpending = {
  date: string;
  day_label: string;
  amount: number;
  is_today: boolean;
};

type Transaction = {
  transaction_id: string;
  description: string;
  amount: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  date: string;
  time: string;
  emotion?: string;
  is_recurring: boolean;
};

type BudgetInsight = {
  insight_id: string;
  type: 'tip' | 'warning' | 'achievement' | 'prediction';
  title: string;
  description: string;
  icon: string;
  color: string;
};

type Budget = {
  budget_id: string;
  budget_name: string;
  budget_period: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_income: number;
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  savings_target: number;
  savings_actual: number;
  emergency_buffer: number;
  status: BudgetStatus;
  days_elapsed: number;
  days_remaining: number;
  total_days: number;
  is_rollover_enabled: boolean;
  rollover_amount: number;
  categories: CategoryAllocation[];
  daily_spending: DailySpending[];
  recent_transactions: Transaction[];
  insights: BudgetInsight[];
  created_at: string;
  updated_at: string;
};

// ============ HEADER ============
type HeaderProps = {
  budget: Budget | null;
  onEdit: () => void;
};

const Header = ({ budget, onEdit }: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Budget Details</Text>
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={() => setShowMenu(!showMenu)}
      >
        <SFSymbol name="ellipsis" size={20} color="#000" />
      </TouchableOpacity>

      {showMenu && (
        <View style={[styles.menuDropdown, { top: insets.top + 56 }]}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); onEdit(); }}
          >
            <SFSymbol name="pencil" size={18} color="#000" />
            <Text style={styles.menuItemText}>Edit Budget</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); }}
          >
            <SFSymbol name="doc.text" size={18} color="#000" />
            <Text style={styles.menuItemText}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { setShowMenu(false); }}
          >
            <SFSymbol name="arrow.triangle.2.circlepath" size={18} color="#000" />
            <Text style={styles.menuItemText}>Duplicate Budget</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============ BUDGET OVERVIEW CARD ============
type BudgetOverviewProps = {
  budget: Budget;
};

const BudgetOverview = ({ budget }: BudgetOverviewProps) => {
  const utilizationPercent = (budget.total_spent / budget.total_allocated) * 100;
  const timePercent = (budget.days_elapsed / budget.total_days) * 100;
  const isOnTrack = utilizationPercent <= timePercent + 5;

  const getStatusColor = () => {
    if (budget.status === 'paused') return '#F59E0B';
    if (budget.status === 'closed') return '#6B7280';
    if (utilizationPercent > 100) return '#DC2626';
    if (utilizationPercent > 90) return '#F59E0B';
    return '#046C4E';
  };

  const getStatusLabel = () => {
    if (budget.status === 'paused') return 'Paused';
    if (budget.status === 'closed') return 'Closed';
    if (utilizationPercent > 100) return 'Over Budget';
    if (utilizationPercent > 90) return 'Almost There';
    if (isOnTrack) return 'On Track';
    return 'Ahead of Pace';
  };

  return (
    <View style={styles.overviewCard}>
      {/* Header */}
      <View style={styles.overviewHeader}>
        <View>
          <Text style={styles.overviewTitle}>{budget.budget_name}</Text>
          <Text style={styles.overviewPeriod}>
            {budget.start_date} - {budget.end_date}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {/* Main Progress */}
      <View style={styles.overviewProgress}>
        <View style={styles.overviewAmounts}>
          <View style={styles.overviewAmountItem}>
            <Text style={styles.overviewAmountLabel}>Spent</Text>
            <Text style={[styles.overviewAmountValue, { color: getStatusColor() }]}>
              ${budget.total_spent.toLocaleString()}
            </Text>
          </View>
          <View style={styles.overviewAmountDivider}>
            <Text style={styles.overviewAmountDividerText}>of</Text>
          </View>
          <View style={styles.overviewAmountItem}>
            <Text style={styles.overviewAmountLabel}>Budget</Text>
            <Text style={styles.overviewAmountValueSecondary}>
              ${budget.total_allocated.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(utilizationPercent, 100)}%`,
                  backgroundColor: getStatusColor()
                }
              ]} 
            />
            {/* Time marker */}
            <View style={[styles.progressBarMarker, { left: `${timePercent}%` }]} />
          </View>
          <View style={styles.progressBarLabels}>
            <Text style={styles.progressBarPercent}>
              {utilizationPercent.toFixed(0)}% spent
            </Text>
            <Text style={styles.progressBarDays}>
              {budget.days_remaining} days left
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.overviewStats}>
        <View style={styles.overviewStatItem}>
          <SFSymbol name="dollarsign.circle" size={18} color="#046C4E" />
          <Text style={styles.overviewStatValue}>
            ${budget.total_remaining.toLocaleString()}
          </Text>
          <Text style={styles.overviewStatLabel}>Remaining</Text>
        </View>
        <View style={styles.overviewStatDivider} />
        <View style={styles.overviewStatItem}>
          <SFSymbol name="chart.line.downtrend.xyaxis" size={18} color="#2563EB" />
          <Text style={styles.overviewStatValue}>
            ${Math.round(budget.total_remaining / Math.max(budget.days_remaining, 1)).toLocaleString()}
          </Text>
          <Text style={styles.overviewStatLabel}>Daily Budget</Text>
        </View>
        <View style={styles.overviewStatDivider} />
        <View style={styles.overviewStatItem}>
          <SFSymbol name="banknote" size={18} color="#7C3AED" />
          <Text style={styles.overviewStatValue}>
            ${budget.savings_actual.toLocaleString()}
          </Text>
          <Text style={styles.overviewStatLabel}>Saved</Text>
        </View>
      </View>
    </View>
  );
};

// ============ DAILY SPENDING CHART ============
type DailyChartProps = {
  data: DailySpending[];
  dailyBudget: number;
};

const DailySpendingChart = ({ data, dailyBudget }: DailyChartProps) => {
  // Transform data for BarChart component
  const chartData = data.map(day => ({
    label: day.day_label,
    value: day.amount,
    color: day.is_today 
      ? '#2563EB' 
      : day.amount > dailyBudget 
        ? '#DC2626' 
        : '#046C4E',
  }));

  return (
    <View style={styles.dailyChartCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#2563EB15' }]}>
            <SFSymbol name="chart.bar.fill" size={16} color="#2563EB" />
          </View>
          <Text style={styles.sectionTitle}>Daily Spending</Text>
        </View>
        <Text style={styles.dailyBudgetLabel}>
          Daily budget: ${dailyBudget.toLocaleString()}
        </Text>
      </View>

      <View style={styles.dailyChartContainer}>
        <BarChart
          data={chartData}
          height={100}
          barWidth={28}
          spacing={8}
          showValues={true}
          showLabels={true}
          maxValue={Math.max(...data.map(d => d.amount), dailyBudget) * 1.1}
        />
      </View>

      <View style={styles.dailyChartLegend}>
        <View style={styles.dailyChartLegendItem}>
          <View style={[styles.dailyChartLegendDot, { backgroundColor: '#046C4E' }]} />
          <Text style={styles.dailyChartLegendText}>Under budget</Text>
        </View>
        <View style={styles.dailyChartLegendItem}>
          <View style={[styles.dailyChartLegendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.dailyChartLegendText}>Over budget</Text>
        </View>
        <View style={styles.dailyChartLegendItem}>
          <View style={[styles.dailyChartLegendDot, { backgroundColor: '#2563EB' }]} />
          <Text style={styles.dailyChartLegendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

// ============ CATEGORY CARD ============
type CategoryCardProps = {
  category: CategoryAllocation;
  onPress: () => void;
};

const CategoryCard = ({ category, onPress }: CategoryCardProps) => {
  const getStatusColor = () => {
    switch (category.status) {
      case 'over_budget': return '#DC2626';
      case 'warning': return '#F59E0B';
      case 'under_budget': return '#046C4E';
      default: return '#2563EB';
    }
  };

  const getStatusIcon = () => {
    switch (category.status) {
      case 'over_budget': return 'exclamationmark.triangle.fill';
      case 'warning': return 'exclamationmark.circle.fill';
      case 'under_budget': return 'checkmark.circle.fill';
      default: return 'circle.fill';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.categoryCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.categoryCardHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.category_color + '15' }]}>
          <SFSymbol name={category.category_icon} size={20} color={category.category_color} />
        </View>
        <View style={styles.categoryInfo}>
          <View style={styles.categoryNameRow}>
            <Text style={styles.categoryName}>{category.category_name}</Text>
            {category.is_essential && (
              <View style={styles.essentialBadge}>
                <Text style={styles.essentialBadgeText}>Essential</Text>
              </View>
            )}
          </View>
          <Text style={styles.categoryTransactions}>
            {category.transaction_count} transactions
          </Text>
        </View>
        <View style={styles.categoryAmounts}>
          <Text style={[styles.categorySpent, { color: getStatusColor() }]}>
            ${category.spent_amount.toLocaleString()}
          </Text>
          <Text style={styles.categoryAllocated}>
            of ${category.allocated_amount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.categoryProgressContainer}>
        <View style={styles.categoryProgressBar}>
          <View 
            style={[
              styles.categoryProgressFill,
              { 
                width: `${Math.min(category.utilization_percentage, 100)}%`,
                backgroundColor: getStatusColor()
              }
            ]} 
          />
        </View>
        <View style={styles.categoryProgressMeta}>
          <View style={styles.categoryStatusBadge}>
            <SFSymbol name={getStatusIcon()} size={12} color={getStatusColor()} />
            <Text style={[styles.categoryStatusText, { color: getStatusColor() }]}>
              {category.utilization_percentage.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.categoryTrendBadge}>
            <SFSymbol 
              name={category.trend === 'up' ? 'arrow.up.right' : category.trend === 'down' ? 'arrow.down.right' : 'minus'} 
              size={10} 
              color={category.trend === 'up' ? '#DC2626' : category.trend === 'down' ? '#046C4E' : '#6B7280'} 
            />
            <Text style={[
              styles.categoryTrendText,
              { color: category.trend === 'up' ? '#DC2626' : category.trend === 'down' ? '#046C4E' : '#6B7280' }
            ]}>
              {category.trend_percentage > 0 ? '+' : ''}{category.trend_percentage}%
            </Text>
          </View>
        </View>
      </View>

      {/* Projected Total */}
      {category.status !== 'over_budget' && category.projected_total > category.allocated_amount && (
        <View style={styles.categoryProjection}>
          <SFSymbol name="chart.line.uptrend.xyaxis" size={12} color="#F59E0B" />
          <Text style={styles.categoryProjectionText}>
            Projected: ${category.projected_total.toLocaleString()} by month end
          </Text>
        </View>
      )}

      <View style={styles.categoryCardFooter}>
        <Text style={styles.categoryRemaining}>
          ${category.remaining_amount.toLocaleString()} remaining
        </Text>
        <Text style={styles.categoryDailyAvg}>
          ~${category.daily_average.toLocaleString()}/day avg
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============ BUDGET INSIGHT CARD ============
type InsightCardProps = {
  insight: BudgetInsight;
};

const InsightCard = ({ insight }: InsightCardProps) => {
  const getBgColor = () => {
    switch (insight.type) {
      case 'warning': return '#FEF3C7';
      case 'achievement': return '#D1FAE5';
      case 'tip': return '#DBEAFE';
      case 'prediction': return '#EDE9FE';
      default: return '#F3F4F6';
    }
  };

  return (
    <View style={[styles.insightCard, { backgroundColor: getBgColor() }]}>
      <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
        <SFSymbol name={insight.icon} size={18} color={insight.color} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </View>
  );
};

// ============ TRANSACTION ITEM (using ExpenseCard) ============
// Helper to convert Transaction to Expense format for ExpenseCard
const convertTransactionToExpense = (transaction: Transaction): Expense => ({
  expense_id: transaction.transaction_id,
  amount: transaction.amount,
  description: transaction.description,
  category: (transaction.category_name.toLowerCase().replace(/\s+/g, '_') as ExpenseCategory) || 'other',
  date: transaction.date,
  time: transaction.time,
  merchant: transaction.description,
  emotion: transaction.emotion as EmotionType | undefined,
  is_recurring: transaction.is_recurring,
});

// ============ SECTION HEADER ============
type SectionHeaderProps = {
  title: string;
  icon: string;
  color: string;
  action?: { label: string; onPress: () => void };
};

const SectionHeader = ({ title, icon, color, action }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={[styles.sectionHeaderIcon, { backgroundColor: color + '15' }]}>
        <SFSymbol name={icon} size={16} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={[styles.sectionAction, { color }]}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============ 50/30/20 BREAKDOWN ============
type RuleBreakdownProps = {
  budget: Budget;
};

const RuleBreakdown = ({ budget }: RuleBreakdownProps) => {
  // Calculate needs (essential), wants (non-essential), savings
  const needsCategories = budget.categories.filter(c => c.is_essential);
  const wantsCategories = budget.categories.filter(c => !c.is_essential);
  
  const needsSpent = needsCategories.reduce((sum, c) => sum + c.spent_amount, 0);
  const wantsSpent = wantsCategories.reduce((sum, c) => sum + c.spent_amount, 0);
  const savingsActual = budget.savings_actual;
  
  const totalSpentAndSaved = needsSpent + wantsSpent + savingsActual;
  
  const needsPercent = totalSpentAndSaved > 0 ? (needsSpent / totalSpentAndSaved) * 100 : 0;
  const wantsPercent = totalSpentAndSaved > 0 ? (wantsSpent / totalSpentAndSaved) * 100 : 0;
  const savingsPercent = totalSpentAndSaved > 0 ? (savingsActual / totalSpentAndSaved) * 100 : 0;

  return (
    <View style={styles.ruleCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: '#7C3AED15' }]}>
            <SFSymbol name="chart.pie.fill" size={16} color="#7C3AED" />
          </View>
          <Text style={styles.sectionTitle}>50/30/20 Analysis</Text>
        </View>
      </View>

      {/* Visual Bar */}
      <View style={styles.ruleBarContainer}>
        <View style={[styles.ruleBarSegment, { flex: needsPercent, backgroundColor: '#2563EB' }]} />
        <View style={[styles.ruleBarSegment, { flex: wantsPercent, backgroundColor: '#EC4899' }]} />
        <View style={[styles.ruleBarSegment, { flex: savingsPercent, backgroundColor: '#046C4E' }]} />
      </View>

      {/* Legend */}
      <View style={styles.ruleLegend}>
        <View style={styles.ruleLegendItem}>
          <View style={[styles.ruleLegendDot, { backgroundColor: '#2563EB' }]} />
          <View style={styles.ruleLegendText}>
            <Text style={styles.ruleLegendLabel}>Needs</Text>
            <Text style={styles.ruleLegendValue}>{needsPercent.toFixed(0)}%</Text>
          </View>
          <Text style={[
            styles.ruleLegendTarget,
            { color: needsPercent <= 55 ? '#046C4E' : '#DC2626' }
          ]}>
            Target: 50%
          </Text>
        </View>

        <View style={styles.ruleLegendItem}>
          <View style={[styles.ruleLegendDot, { backgroundColor: '#EC4899' }]} />
          <View style={styles.ruleLegendText}>
            <Text style={styles.ruleLegendLabel}>Wants</Text>
            <Text style={styles.ruleLegendValue}>{wantsPercent.toFixed(0)}%</Text>
          </View>
          <Text style={[
            styles.ruleLegendTarget,
            { color: wantsPercent <= 35 ? '#046C4E' : '#DC2626' }
          ]}>
            Target: 30%
          </Text>
        </View>

        <View style={styles.ruleLegendItem}>
          <View style={[styles.ruleLegendDot, { backgroundColor: '#046C4E' }]} />
          <View style={styles.ruleLegendText}>
            <Text style={styles.ruleLegendLabel}>Savings</Text>
            <Text style={styles.ruleLegendValue}>{savingsPercent.toFixed(0)}%</Text>
          </View>
          <Text style={[
            styles.ruleLegendTarget,
            { color: savingsPercent >= 18 ? '#046C4E' : '#DC2626' }
          ]}>
            Target: 20%
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function BudgetDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BudgetDetailScreen'>>();
  
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [selectedTab, setSelectedTab] = useState<'categories' | 'transactions'>('categories');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState<FilterState>({
    dateRange: 'this_month',
    categories: ['all'],
    emotions: ['all'],
    expenseTypes: ['all'],
    sortBy: 'date_desc',
  });

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      
      // Mock budget data
      const mockBudget: Budget = {
        budget_id: route.params?.budgetId || '1',
        budget_name: 'January 2025 Budget',
        budget_period: 'monthly',
        start_date: '01/01/2025',
        end_date: '01/31/2025',
        total_income: 6500,
        total_allocated: 5200,
        total_spent: 3847,
        total_remaining: 1353,
        savings_target: 1300,
        savings_actual: 850,
        emergency_buffer: 500,
        status: 'active',
        days_elapsed: 18,
        days_remaining: 13,
        total_days: 31,
        is_rollover_enabled: true,
        rollover_amount: 125,
        categories: [
          {
            allocation_id: '1',
            category_id: '1',
            category_name: 'Housing & Rent',
            category_icon: 'house.fill',
            category_color: '#2563EB',
            is_essential: true,
            allocated_amount: 1500,
            spent_amount: 1500,
            remaining_amount: 0,
            utilization_percentage: 100,
            transaction_count: 1,
            daily_average: 83,
            projected_total: 1500,
            status: 'on_track',
            trend: 'stable',
            trend_percentage: 0,
          },
          {
            allocation_id: '2',
            category_id: '2',
            category_name: 'Groceries',
            category_icon: 'cart.fill',
            category_color: '#046C4E',
            is_essential: true,
            allocated_amount: 600,
            spent_amount: 423,
            remaining_amount: 177,
            utilization_percentage: 70.5,
            transaction_count: 12,
            daily_average: 24,
            projected_total: 720,
            status: 'warning',
            trend: 'up',
            trend_percentage: 15,
          },
          {
            allocation_id: '3',
            category_id: '3',
            category_name: 'Transportation',
            category_icon: 'car.fill',
            category_color: '#F59E0B',
            is_essential: true,
            allocated_amount: 400,
            spent_amount: 285,
            remaining_amount: 115,
            utilization_percentage: 71.25,
            transaction_count: 8,
            daily_average: 16,
            projected_total: 380,
            status: 'on_track',
            trend: 'down',
            trend_percentage: -8,
          },
          {
            allocation_id: '4',
            category_id: '4',
            category_name: 'Dining Out',
            category_icon: 'fork.knife',
            category_color: '#EC4899',
            is_essential: false,
            allocated_amount: 300,
            spent_amount: 345,
            remaining_amount: -45,
            utilization_percentage: 115,
            transaction_count: 15,
            daily_average: 19,
            projected_total: 580,
            status: 'over_budget',
            trend: 'up',
            trend_percentage: 28,
          },
          {
            allocation_id: '5',
            category_id: '5',
            category_name: 'Entertainment',
            category_icon: 'film.fill',
            category_color: '#7C3AED',
            is_essential: false,
            allocated_amount: 200,
            spent_amount: 175,
            remaining_amount: 25,
            utilization_percentage: 87.5,
            transaction_count: 6,
            daily_average: 10,
            projected_total: 290,
            status: 'warning',
            trend: 'up',
            trend_percentage: 12,
          },
          {
            allocation_id: '6',
            category_id: '6',
            category_name: 'Utilities',
            category_icon: 'bolt.fill',
            category_color: '#0891B2',
            is_essential: true,
            allocated_amount: 250,
            spent_amount: 189,
            remaining_amount: 61,
            utilization_percentage: 75.6,
            transaction_count: 3,
            daily_average: 11,
            projected_total: 240,
            status: 'on_track',
            trend: 'stable',
            trend_percentage: 2,
          },
          {
            allocation_id: '7',
            category_id: '7',
            category_name: 'Subscriptions',
            category_icon: 'repeat.circle.fill',
            category_color: '#DC2626',
            is_essential: false,
            allocated_amount: 100,
            spent_amount: 65,
            remaining_amount: 35,
            utilization_percentage: 65,
            transaction_count: 4,
            daily_average: 4,
            projected_total: 85,
            status: 'under_budget',
            trend: 'down',
            trend_percentage: -10,
          },
          {
            allocation_id: '8',
            category_id: '8',
            category_name: 'Personal Care',
            category_icon: 'heart.fill',
            category_color: '#F472B6',
            is_essential: false,
            allocated_amount: 150,
            spent_amount: 95,
            remaining_amount: 55,
            utilization_percentage: 63.3,
            transaction_count: 5,
            daily_average: 5,
            projected_total: 145,
            status: 'on_track',
            trend: 'stable',
            trend_percentage: 0,
          },
        ],
        daily_spending: [
          { date: '01/12', day_label: 'Sun', amount: 45, is_today: false },
          { date: '01/13', day_label: 'Mon', amount: 120, is_today: false },
          { date: '01/14', day_label: 'Tue', amount: 35, is_today: false },
          { date: '01/15', day_label: 'Wed', amount: 210, is_today: false },
          { date: '01/16', day_label: 'Thu', amount: 65, is_today: false },
          { date: '01/17', day_label: 'Fri', amount: 180, is_today: false },
          { date: '01/18', day_label: 'Sat', amount: 95, is_today: true },
        ],
        recent_transactions: [
          {
            transaction_id: '1',
            description: 'Chipotle',
            amount: 15.50,
            category_name: 'Dining Out',
            category_icon: 'fork.knife',
            category_color: '#EC4899',
            date: '01/18/2025',
            time: '12:34 PM',
            emotion: 'Stressed',
            is_recurring: false,
          },
          {
            transaction_id: '2',
            description: 'Netflix Subscription',
            amount: 15.99,
            category_name: 'Subscriptions',
            category_icon: 'repeat.circle.fill',
            category_color: '#DC2626',
            date: '01/18/2025',
            time: '8:00 AM',
            is_recurring: true,
          },
          {
            transaction_id: '3',
            description: 'Whole Foods Market',
            amount: 87.32,
            category_name: 'Groceries',
            category_icon: 'cart.fill',
            category_color: '#046C4E',
            date: '01/17/2025',
            time: '6:15 PM',
            is_recurring: false,
          },
          {
            transaction_id: '4',
            description: 'Uber Ride',
            amount: 24.50,
            category_name: 'Transportation',
            category_icon: 'car.fill',
            category_color: '#F59E0B',
            date: '01/17/2025',
            time: '10:30 PM',
            emotion: 'Tired',
            is_recurring: false,
          },
          {
            transaction_id: '5',
            description: 'Movie Tickets',
            amount: 32.00,
            category_name: 'Entertainment',
            category_icon: 'film.fill',
            category_color: '#7C3AED',
            date: '01/17/2025',
            time: '7:00 PM',
            emotion: 'Happy',
            is_recurring: false,
          },
        ],
        insights: [
          {
            insight_id: '1',
            type: 'warning',
            title: 'Dining budget exceeded',
            description: 'You\'ve spent $45 over your dining budget. Consider cooking at home for the rest of the month.',
            icon: 'exclamationmark.triangle.fill',
            color: '#DC2626',
          },
          {
            insight_id: '2',
            type: 'prediction',
            title: 'Groceries trending high',
            description: 'At current pace, you\'ll spend ~$720 on groceries. That\'s $120 over budget.',
            icon: 'chart.line.uptrend.xyaxis',
            color: '#F59E0B',
          },
          {
            insight_id: '3',
            type: 'achievement',
            title: 'Transportation savings!',
            description: 'You\'re on track to save $20 in transportation this month. Great job!',
            icon: 'star.fill',
            color: '#046C4E',
          },
        ],
        created_at: '12/28/2024',
        updated_at: '01/18/2025',
      };

      setBudget(mockBudget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      Alert.alert('Error', 'Failed to load budget details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditBudgetScreen', { budgetId: budget?.budget_id });
  };

  const handleCategoryPress = (category: CategoryAllocation) => {
    // TODO: Navigate to category detail
    Alert.alert(
      category.category_name,
      `Spent: $${category.spent_amount}\nAllocated: $${category.allocated_amount}\nRemaining: $${category.remaining_amount}`
    );
  };

  const handleTransactionPress = (transaction: Transaction) => {
    Alert.alert(
      transaction.description,
      `Amount: $${transaction.amount}\nCategory: ${transaction.category_name}\nDate: ${transaction.date} at ${transaction.time}${transaction.emotion ? `\nMood: ${transaction.emotion}` : ''}`
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header budget={null} onEdit={handleEdit} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading budget details...</Text>
        </View>
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={styles.container}>
        <Header budget={null} onEdit={handleEdit} />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.triangle.fill" size={48} color="#DC2626" />
          <Text style={styles.errorText}>Budget not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const dailyBudget = Math.round(budget.total_remaining / Math.max(budget.days_remaining, 1));
  const sortedCategories = [...budget.categories].sort((a, b) => 
    b.utilization_percentage - a.utilization_percentage
  );

  return (
    <View style={styles.container}>
      <Header budget={budget} onEdit={handleEdit} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Overview */}
        <BudgetOverview budget={budget} />

        {/* Insights */}
        {budget.insights.length > 0 && (
          <View style={styles.insightsSection}>
            {budget.insights.map((insight) => (
              <InsightCard key={insight.insight_id} insight={insight} />
            ))}
          </View>
        )}

        {/* Daily Spending Chart */}
        <DailySpendingChart data={budget.daily_spending} dailyBudget={dailyBudget} />

        {/* 50/30/20 Breakdown */}
        <RuleBreakdown budget={budget} />

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'categories' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('categories')}
          >
            <Text style={[styles.tabButtonText, selectedTab === 'categories' && styles.tabButtonTextActive]}>
              Categories ({budget.categories.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'transactions' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('transactions')}
          >
            <Text style={[styles.tabButtonText, selectedTab === 'transactions' && styles.tabButtonTextActive]}>
              Transactions ({budget.recent_transactions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        {selectedTab === 'categories' && (
          <View style={styles.categoriesSection}>
            {sortedCategories.map((category) => (
              <CategoryCard
                key={category.allocation_id}
                category={category}
                onPress={() => handleCategoryPress(category)}
              />
            ))}
          </View>
        )}

        {/* Transactions List */}
        {selectedTab === 'transactions' && (
          <View style={styles.transactionsSection}>
            <SectionHeader
              title="Recent Transactions"
              icon="clock.fill"
              color="#6B7280"
              action={{ 
                label: 'Filter', 
                onPress: () => setShowFilterSheet(true),
              }}
            />
            
            {/* Active Filters Bar */}
            {(() => {
              const getActiveCount = () => {
                let count = 0;
                if (transactionFilters.dateRange !== 'this_month') count++;
                if (!transactionFilters.categories.includes('all')) count += transactionFilters.categories.length;
                if (!transactionFilters.emotions.includes('all')) count += transactionFilters.emotions.length;
                return count;
              };
              return getActiveCount() > 0 ? (
                <ActiveFiltersBar
                  filters={transactionFilters}
                  onRemoveFilter={(type, value) => {
                    setTransactionFilters(prev => {
                      switch (type) {
                        case 'dateRange':
                          return { ...prev, dateRange: 'this_month' };
                        case 'category':
                          const cats = prev.categories.filter(c => c !== value);
                          return { ...prev, categories: cats.length === 0 ? ['all'] : cats };
                        case 'emotion':
                          const emos = prev.emotions.filter(e => e !== value);
                          return { ...prev, emotions: emos.length === 0 ? ['all'] : emos };
                        default:
                          return prev;
                      }
                    });
                  }}
                  onClearAll={() => setTransactionFilters({
                    dateRange: 'this_month',
                    categories: ['all'],
                    emotions: ['all'],
                    expenseTypes: ['all'],
                    sortBy: 'date_desc',
                  })}
                />
              ) : null;
            })()}
            
            {budget.recent_transactions.map((transaction) => (
              <ExpenseCard
                key={transaction.transaction_id}
                expense={convertTransactionToExpense(transaction)}
                variant="compact"
                showEmotions={true}
                onPress={() => handleTransactionPress(transaction)}
              />
            ))}
          </View>
        )}

        {/* Filter Sheet */}
        <FilterSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          onApply={(newFilters) => setTransactionFilters(newFilters)}
          initialFilters={transactionFilters}
          showEmotions={true}
          showExpenseTypes={true}
          showAmountRange={true}
          showSearch={true}
          title="Filter Transactions"
        />

        {/* Rollover Info */}
        {budget.is_rollover_enabled && budget.rollover_amount > 0 && (
          <View style={styles.rolloverCard}>
            <SFSymbol name="arrow.triangle.2.circlepath" size={20} color="#7C3AED" />
            <View style={styles.rolloverContent}>
              <Text style={styles.rolloverTitle}>Rollover Enabled</Text>
              <Text style={styles.rolloverText}>
                ${budget.rollover_amount} carried over from last month
              </Text>
            </View>
          </View>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>Created: {budget.created_at}</Text>
          <Text style={styles.metaText}>Last updated: {budget.updated_at}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    zIndex: 100,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  menuDropdown: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorButton: {
    backgroundColor: '#046C4E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  overviewPeriod: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  overviewProgress: {
    marginBottom: 20,
  },
  overviewAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overviewAmountItem: {
    alignItems: 'center',
  },
  overviewAmountLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  overviewAmountValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  overviewAmountValueSecondary: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  overviewAmountDivider: {
    paddingHorizontal: 20,
  },
  overviewAmountDividerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressBarPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  progressBarDays: {
    fontSize: 13,
    color: '#8E8E93',
  },
  overviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  overviewStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  overviewStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  overviewStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  overviewStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Daily Chart
  dailyChartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  dailyBudgetLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dailyChartContainer: {
    position: 'relative',
    paddingTop: 8,
  },
  budgetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  budgetLineDash: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#DC262650',
  },
  dailyChartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  dailyChartBarWrapper: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 7,
  },
  dailyChartAmount: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dailyChartBarBg: {
    width: 24,
    height: 80,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dailyChartBar: {
    width: '100%',
    borderRadius: 12,
  },
  dailyChartLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 8,
  },
  dailyChartLabelToday: {
    color: '#2563EB',
    fontWeight: '600',
  },
  dailyChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  dailyChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyChartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailyChartLegendText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Insights
  insightsSection: {
    gap: 10,
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // 50/30/20 Rule
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  ruleBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ruleBarSegment: {
    height: '100%',
  },
  ruleLegend: {
    gap: 12,
  },
  ruleLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  ruleLegendText: {
    flex: 1,
  },
  ruleLegendLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  ruleLegendValue: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ruleLegendTarget: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: '#000',
  },

  // Categories
  categoriesSection: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  essentialBadge: {
    backgroundColor: '#2563EB15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  essentialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  categoryTransactions: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  categoryAmounts: {
    alignItems: 'flex-end',
  },
  categorySpent: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryAllocated: {
    fontSize: 12,
    color: '#8E8E93',
  },
  categoryProgressContainer: {
    marginBottom: 12,
  },
  categoryProgressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryProgressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTrendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryProjection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  categoryProjectionText: {
    fontSize: 12,
    color: '#92400E',
  },
  categoryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  categoryRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: '#046C4E',
  },
  categoryDailyAvg: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Transactions
  transactionsSection: {
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionEmotionBadge: {
    backgroundColor: '#EC489915',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transactionEmotionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EC4899',
  },
  recurringBadge: {
    backgroundColor: '#7C3AED15',
    padding: 4,
    borderRadius: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  transactionTime: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Rollover Card
  rolloverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  rolloverContent: {
    flex: 1,
  },
  rolloverTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  rolloverText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Meta Info
  metaInfo: {
    paddingTop: 24,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Bottom
  bottomSpacer: {
    height: 100,
  },
});