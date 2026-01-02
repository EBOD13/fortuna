// src/screens/PlansScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoalCard, { Goal } from '../components/cards/GoalCard';
import TabSelector from '../components/navigation/TabSelector';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

// Import API hooks
import { useGoals } from '../hooks/useGoal';
import { useActiveBudget } from '../hooks/useBudget';

// ============ TYPES ============
type MainTabType = 'goals' | 'budget';
type GoalFilterType = 'all' | 'active' | 'completed' | 'paused';

type GoalsSummary = {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallProgress: number;
  monthlyAllocation: number;
};

type BudgetAllocation = {
  allocation_id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
};

type Budget = {
  budget_id: string;
  budget_name: string;
  budget_period: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  total_income: number;
  total_allocated: number;
  total_spent: number;
  emergency_buffer: number;
  is_ai_generated: boolean;
  status: 'active' | 'draft' | 'completed';
  allocations: BudgetAllocation[];
};

// ============ HEADER COMPONENT ============
const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={styles.headerButton}>
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

// ============ MAIN TABS CONFIG ============
const mainTabs = [
  { id: 'goals', label: 'Goals', icon: 'target' },
  { id: 'budget', label: 'Budget', icon: 'chart.pie.fill' },
];

// ============ GOAL FILTER TABS ============
const goalFilterTabs = [
  { id: 'all', label: 'All', icon: 'square.grid.2x2.fill' },
  { id: 'active', label: 'Active', icon: 'flame.fill' },
  { id: 'completed', label: 'Done', icon: 'checkmark.circle.fill' },
  { id: 'paused', label: 'Paused', icon: 'pause.circle.fill' },
];

// ============ GOALS SUMMARY CARD ============
const GoalsSummaryCard = ({ summary }: { summary: GoalsSummary }) => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryMain}>
        <View style={styles.progressCircleContainer}>
          <View style={styles.progressCircleOuter}>
            <View style={styles.progressCircleInner}>
              <Text style={styles.progressCirclePercent}>
                {Math.round(summary.overallProgress)}%
              </Text>
              <Text style={styles.progressCircleLabel}>Overall</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              ${summary.totalCurrentAmount.toLocaleString()}
            </Text>
            <Text style={styles.summaryStatLabel}>Saved</Text>
          </View>
          <View style={styles.summaryStatDivider} />
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>
              ${summary.totalTargetAmount.toLocaleString()}
            </Text>
            <Text style={styles.summaryStatLabel}>Target</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryBottomRow}>
        <View style={styles.summaryBottomItem}>
          <View style={[styles.summaryBottomIcon, { backgroundColor: '#046C4E15' }]}>
            <SFSymbol name="flame.fill" size={18} color="#046C4E" />
          </View>
          <View>
            <Text style={styles.summaryBottomValue}>{summary.activeGoals}</Text>
            <Text style={styles.summaryBottomLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.summaryBottomItem}>
          <View style={[styles.summaryBottomIcon, { backgroundColor: '#2563EB15' }]}>
            <SFSymbol name="checkmark.circle.fill" size={18} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.summaryBottomValue}>{summary.completedGoals}</Text>
            <Text style={styles.summaryBottomLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.summaryBottomItem}>
          <View style={[styles.summaryBottomIcon, { backgroundColor: '#7C3AED15' }]}>
            <SFSymbol name="dollarsign.arrow.circlepath" size={18} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.summaryBottomValue}>
              ${summary.monthlyAllocation.toLocaleString()}
            </Text>
            <Text style={styles.summaryBottomLabel}>Monthly</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============ BUDGET SUMMARY CARD ============
const BudgetSummaryCard = ({ budget, onPress }: { budget: Budget; onPress: () => void }) => {
  const totalSpent = budget.allocations.reduce((sum, a) => sum + a.spent_amount, 0);
  const spentPercent = (totalSpent / budget.total_allocated) * 100;
  const remaining = budget.total_allocated - totalSpent;
  
  // Calculate days remaining in budget period
  const endDate = new Date(budget.end_date);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <TouchableOpacity style={styles.budgetSummaryCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.budgetSummaryHeader}>
        <View>
          <Text style={styles.budgetSummaryTitle}>{budget.budget_name}</Text>
          <Text style={styles.budgetSummaryPeriod}>
            {daysRemaining} days remaining
          </Text>
        </View>
        <View style={styles.budgetSummaryHeaderRight}>
          {budget.is_ai_generated && (
            <View style={styles.aiBadge}>
              <SFSymbol name="sparkles" size={12} color="#7C3AED" />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
          <SFSymbol name="chevron.right" size={16} color="#C7C7CC" />
        </View>
      </View>

      {/* Main Budget Bar */}
      <View style={styles.budgetMainBar}>
        <View style={styles.budgetBarLabels}>
          <Text style={styles.budgetBarSpent}>${totalSpent.toLocaleString()} spent</Text>
          <Text style={styles.budgetBarTotal}>of ${budget.total_allocated.toLocaleString()}</Text>
        </View>
        <View style={styles.budgetBarContainer}>
          <View 
            style={[
              styles.budgetBarFill, 
              { 
                width: `${Math.min(spentPercent, 100)}%`,
                backgroundColor: spentPercent > 90 ? '#DC2626' : spentPercent > 75 ? '#F59E0B' : '#046C4E'
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.budgetBarPercent,
          { color: spentPercent > 90 ? '#DC2626' : spentPercent > 75 ? '#F59E0B' : '#046C4E' }
        ]}>
          {spentPercent.toFixed(0)}% used
        </Text>
      </View>

      {/* Bottom Stats */}
      <View style={styles.budgetStatsRow}>
        <View style={styles.budgetStatItem}>
          <View style={[styles.budgetStatIcon, { backgroundColor: '#046C4E15' }]}>
            <SFSymbol name="arrow.down.circle.fill" size={18} color="#046C4E" />
          </View>
          <View>
            <Text style={styles.budgetStatValue}>${budget.total_income.toLocaleString()}</Text>
            <Text style={styles.budgetStatLabel}>Income</Text>
          </View>
        </View>

        <View style={styles.budgetStatItem}>
          <View style={[styles.budgetStatIcon, { backgroundColor: '#2563EB15' }]}>
            <SFSymbol name="banknote.fill" size={18} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.budgetStatValue}>${remaining.toLocaleString()}</Text>
            <Text style={styles.budgetStatLabel}>Remaining</Text>
          </View>
        </View>

        <View style={styles.budgetStatItem}>
          <View style={[styles.budgetStatIcon, { backgroundColor: '#F59E0B15' }]}>
            <SFSymbol name="shield.fill" size={18} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.budgetStatValue}>${budget.emergency_buffer.toLocaleString()}</Text>
            <Text style={styles.budgetStatLabel}>Buffer</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============ BUDGET CATEGORY CARD ============
const BudgetCategoryCard = ({ allocation, onPress }: { allocation: BudgetAllocation; onPress: () => void }) => {
  const isOverBudget = allocation.spent_amount > allocation.allocated_amount;
  const utilizationColor = allocation.utilization_percentage > 90 
    ? '#DC2626' 
    : allocation.utilization_percentage > 75 
      ? '#F59E0B' 
      : '#046C4E';

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.categoryCardLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: allocation.category_color + '15' }]}>
          <SFSymbol name={allocation.category_icon} size={22} color={allocation.category_color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{allocation.category_name}</Text>
          <View style={styles.categoryBarContainer}>
            <View 
              style={[
                styles.categoryBarFill, 
                { 
                  width: `${Math.min(allocation.utilization_percentage, 100)}%`,
                  backgroundColor: utilizationColor
                }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <View style={styles.categoryCardRight}>
        <Text style={[styles.categorySpent, isOverBudget && styles.categoryOverBudget]}>
          ${allocation.spent_amount.toLocaleString()}
        </Text>
        <Text style={styles.categoryAllocated}>
          of ${allocation.allocated_amount.toLocaleString()}
        </Text>
        <Text style={[styles.categoryPercent, { color: utilizationColor }]}>
          {allocation.utilization_percentage.toFixed(0)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============ QUICK ACTIONS ============
const GoalQuickActions = ({ onAddGoal, onUpdateGoal }: { onAddGoal: () => void; onUpdateGoal: () => void }) => (
  <View style={styles.quickActionsContainer}>
    <TouchableOpacity style={styles.quickActionButton} onPress={onAddGoal}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="plus.circle.fill" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>New Goal</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.quickActionButton} onPress={onUpdateGoal}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="dollarsign.circle.fill" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>Add Funds</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.quickActionButton}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="arrow.left.arrow.right" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>Transfer</Text>
    </TouchableOpacity>
  </View>
);

const BudgetQuickActions = ({ onCreateBudget, onEditBudget, onCreateCategory }: { onCreateBudget: () => void; onEditBudget: () => void; onCreateCategory: () => void }) => (
  <View style={styles.quickActionsContainer}>
    <TouchableOpacity style={styles.quickActionButton} onPress={onCreateBudget}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="plus.circle.fill" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>New Budget</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.quickActionButton} onPress={onEditBudget}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="pencil.circle.fill" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>Edit Budget</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.quickActionButton} onPress={onCreateCategory}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="folder.badge.plus" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>Add Category</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.quickActionButton}>
      <View style={styles.quickActionIcon}>
        <SFSymbol name="sparkles" size={20} color="#046C4E" />
      </View>
      <Text style={styles.quickActionText}>AI Suggest</Text>
    </TouchableOpacity>
  </View>
);

// ============ MAIN COMPONENT ============
export default function PlansScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('goals');
  const [goalFilter, setGoalFilter] = useState<GoalFilterType>('all');
  
  // Fetch data using hooks
  const { goals: apiGoals, isLoading: goalsLoading } = useGoals({});
  const { budget: apiBudget, stats: budgetStats, isLoading: budgetLoading } = useActiveBudget();
  
  // Determine loading based on active tab
  const loading = activeMainTab === 'goals' ? goalsLoading : budgetLoading;

  // Transform API goals to card format
  const goals: Goal[] = useMemo(() => apiGoals.map(g => ({
    goal_id: g.goal_id,
    goal_name: g.goal_name,
    goal_type: g.goal_type as any,
    target_amount: g.target_amount,
    current_amount: g.current_amount,
    deadline_date: g.target_date,
    priority_level: g.priority === 'critical' ? 10 : g.priority === 'high' ? 7 : g.priority === 'medium' ? 5 : 3,
    is_mandatory: g.priority === 'critical',
    monthly_allocation: g.monthly_contribution,
    treat_as_bill: false,
    confidence_score: g.progress_percentage / 100,
    status: g.status as 'active' | 'paused' | 'completed',
    created_at: g.created_at,
  })), [apiGoals]);

  // Compute goals summary
  const goalsSummary: GoalsSummary | null = useMemo(() => {
    if (goals.length === 0) return null;
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const monthlyAlloc = activeGoals.reduce((sum, g) => sum + (g.monthly_allocation || 0), 0);
    
    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount: totalTarget,
      totalCurrentAmount: totalCurrent,
      overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      monthlyAllocation: monthlyAlloc,
    };
  }, [goals]);

  // Transform API budget to local format
  const activeBudget: Budget | null = useMemo(() => {
    if (!apiBudget) return null;
    return {
      budget_id: apiBudget.budget_id,
      budget_name: apiBudget.budget_name,
      budget_period: apiBudget.budget_period as any,
      start_date: apiBudget.start_date,
      end_date: apiBudget.end_date,
      total_income: apiBudget.total_income,
      total_allocated: apiBudget.total_allocated,
      total_spent: apiBudget.total_spent,
      emergency_buffer: apiBudget.emergency_buffer || 0,
      is_ai_generated: apiBudget.is_ai_generated || false,
      status: apiBudget.status as 'active' | 'draft' | 'completed',
      allocations: apiBudget.allocations?.map(a => ({
        allocation_id: a.allocation_id,
        category_id: a.category_name.toLowerCase().replace(/\s+/g, '_'),
        category_name: a.category_name,
        category_icon: getCategoryIcon(a.category_name),
        category_color: getCategoryColor(a.category_name),
        allocated_amount: a.allocated_amount,
        spent_amount: a.spent_amount,
        remaining_amount: a.allocated_amount - a.spent_amount,
        utilization_percentage: a.utilization_percentage,
      })) || [],
    };
  }, [apiBudget]);

  // Helper functions for category icons/colors
  function getCategoryIcon(categoryName: string): string {
    const icons: Record<string, string> = {
      'Housing & Rent': 'house.fill',
      'Groceries': 'cart.fill',
      'Transportation': 'car.fill',
      'Utilities': 'bolt.fill',
      'Entertainment': 'film.fill',
      'Dining Out': 'fork.knife',
      'Subscriptions': 'repeat',
    };
    return icons[categoryName] || 'folder.fill';
  }

  function getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Housing & Rent': '#2563EB',
      'Groceries': '#046C4E',
      'Transportation': '#F59E0B',
      'Utilities': '#7C3AED',
      'Entertainment': '#EC4899',
      'Dining Out': '#DC2626',
      'Subscriptions': '#0891B2',
    };
    return colors[categoryName] || '#6B7280';
  }

  const filteredGoals = goals.filter(goal => {
    if (goalFilter === 'all') return true;
    return goal.status === goalFilter;
  });

  const handleGoalPress = (goal: Goal) => {
    navigation.navigate('GoalDetailScreen', { goalId: goal.goal_id });
  };

  const handleAddGoal = () => {
    navigation.navigate('AddGoalScreen');
  };

  const handleUpdateGoal = () => {
    navigation.navigate('UpdateGoalScreen');
  };

  const handleCreateBudget = () => {
    navigation.navigate('AddBudgetScreen');
  };

  const handleEditBudget = () => {
    navigation.navigate('EditBudgetScreen', { budgetId: activeBudget?.budget_id });
  };

  const handleCreateCategory = () => {
    navigation.navigate('AddCategoryScreen');
  };

  const handleCategoryPress = (allocation: BudgetAllocation) => {
    // Navigate to budget detail with focus on this category
    navigation.navigate('BudgetDetailScreen', { budgetId: activeBudget?.budget_id });
  };

  const handleBudgetDetailPress = () => {
    navigation.navigate('BudgetDetailScreen', { budgetId: activeBudget?.budget_id });
  };

  // ============ RENDER GOALS TAB ============
  const renderGoalsTab = () => (
    <FlatList
      data={filteredGoals}
      keyExtractor={item => item.goal_id}
      renderItem={({ item }) => <GoalCard item={item} onPress={handleGoalPress} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle}>Your Goals</Text>
            <Text style={styles.pageSubtitle}>Track your financial journey</Text>
          </View>

          {goalsSummary && <GoalsSummaryCard summary={goalsSummary} />}

          <GoalQuickActions onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} />

          <View style={styles.filterTabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsContainer}
            >
              {goalFilterTabs.map((tab, index) => {
                const isActive = goalFilter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.filterTab,
                      isActive && styles.filterTabActive,
                      index < goalFilterTabs.length - 1 && styles.filterTabMargin,
                    ]}
                    onPress={() => setGoalFilter(tab.id as GoalFilterType)}
                    activeOpacity={0.7}
                  >
                    <SFSymbol
                      name={tab.icon}
                      size={16}
                      color={isActive ? '#FFFFFF' : '#046C4E'}
                    />
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {goalFilter === 'all' ? 'All Goals' : 
               goalFilter === 'active' ? 'Active Goals' : 
               goalFilter === 'completed' ? 'Completed Goals' : 'Paused Goals'}
            </Text>
            <Text style={styles.sectionCount}>{filteredGoals.length}</Text>
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <SFSymbol name="target" size={48} color="#C7C7CC" />
          </View>
          <Text style={styles.emptyTitle}>No goals found</Text>
          <Text style={styles.emptySubtitle}>
            {goalFilter === 'all'
              ? "Start by creating your first financial goal"
              : `You don't have any ${goalFilter} goals`}
          </Text>
          {goalFilter === 'all' && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddGoal}>
              <SFSymbol name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      }
      ListFooterComponent={<View style={styles.bottomSpacer} />}
    />
  );

  // ============ RENDER BUDGET TAB ============
  const renderBudgetTab = () => {
    if (!activeBudget) {
      return (
        <View style={styles.noBudgetContainer}>
          <View style={styles.emptyIcon}>
            <SFSymbol name="chart.pie.fill" size={48} color="#C7C7CC" />
          </View>
          <Text style={styles.emptyTitle}>No Active Budget</Text>
          <Text style={styles.emptySubtitle}>
            Create a budget to start tracking your spending
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleCreateBudget}>
            <SFSymbol name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={activeBudget.allocations}
        keyExtractor={item => item.allocation_id}
        renderItem={({ item }) => (
          <BudgetCategoryCard 
            allocation={item} 
            onPress={() => handleCategoryPress(item)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Your Budget</Text>
              <Text style={styles.pageSubtitle}>Manage your spending</Text>
            </View>

            <BudgetSummaryCard budget={activeBudget} onPress={handleBudgetDetailPress} />

            <BudgetQuickActions onCreateBudget={handleCreateBudget} onEditBudget={handleEditBudget} onCreateCategory={handleCreateCategory} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.sectionCount}>{activeBudget.allocations.length}</Text>
            </View>
          </>
        }
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <TabSelector
          tabs={mainTabs}
          activeTab={activeMainTab}
          onTabChange={(tabId) => setActiveMainTab(tabId as MainTabType)}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      
      {/* Main Tab Selector */}
      <TabSelector
        tabs={mainTabs}
        activeTab={activeMainTab}
        onTabChange={(tabId) => setActiveMainTab(tabId as MainTabType)}
      />

      {/* Tab Content */}
      {activeMainTab === 'goals' ? renderGoalsTab() : renderBudgetTab()}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F2F2F7' 
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
    padding: 8 
  },
  appName: { 
    fontSize: 20, 
    fontStyle: 'italic', 
    fontWeight: '600', 
    color: '#000' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  listContent: { 
    paddingHorizontal: 16 
  },

  // Page Title
  pageTitleContainer: { 
    paddingTop: 20, 
    paddingBottom: 16 
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#000' 
  },
  pageSubtitle: { 
    fontSize: 15, 
    color: '#8E8E93', 
    marginTop: 4 
  },

  // Goals Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryMain: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  progressCircleContainer: { 
    width: 70, 
    height: 70, 
    marginRight: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  progressCircleOuter: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    borderWidth: 6, 
    borderColor: '#046C4E', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  progressCircleInner: { 
    width: 54, 
    height: 54, 
    borderRadius: 27, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  progressCirclePercent: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#046C4E' 
  },
  progressCircleLabel: { 
    fontSize: 11, 
    color: '#8E8E93' 
  },
  summaryStats: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  summaryStatItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  summaryStatValue: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000' 
  },
  summaryStatLabel: { 
    fontSize: 12, 
    color: '#8E8E93', 
    marginTop: 4 
  },
  summaryStatDivider: { 
    width: 1, 
    height: 36, 
    backgroundColor: '#E5E5EA' 
  },
  summaryBottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingTop: 16, 
    borderTopWidth: 0.5, 
    borderTopColor: '#E5E5EA' 
  },
  summaryBottomItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  summaryBottomIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  summaryBottomValue: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#000' 
  },
  summaryBottomLabel: { 
    fontSize: 11, 
    color: '#8E8E93' 
  },

  // Budget Summary Card
  budgetSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  budgetSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetSummaryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  budgetSummaryPeriod: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  budgetMainBar: {
    marginBottom: 20,
  },
  budgetBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetBarSpent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  budgetBarTotal: {
    fontSize: 14,
    color: '#8E8E93',
  },
  budgetBarContainer: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetBarPercent: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  budgetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  budgetStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  budgetStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Budget Category Card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCardRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categorySpent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  categoryOverBudget: {
    color: '#DC2626',
  },
  categoryAllocated: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  quickActionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#046C4E',
  },

  // Filter Tabs
  filterTabsWrapper: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  filterTabsContainer: {
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterTabMargin: {
    marginRight: 10,
  },
  filterTabActive: {
    backgroundColor: '#046C4E',
    borderColor: '#046C4E',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#046C4E',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // Section Header
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 8, 
    paddingBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#000' 
  },
  sectionCount: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#8E8E93', 
    backgroundColor: '#E5E5EA', 
    paddingHorizontal: 10, 
    paddingVertical: 2, 
    borderRadius: 12 
  },

  // Empty State
  emptyContainer: { 
    alignItems: 'center', 
    paddingVertical: 60 
  },
  noBudgetContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#000', 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#8E8E93', 
    textAlign: 'center', 
    marginBottom: 24, 
    paddingHorizontal: 40 
  },
  emptyButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#046C4E', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 14, 
    gap: 8 
  },
  emptyButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },

  bottomSpacer: { 
    height: 100 
  },
});