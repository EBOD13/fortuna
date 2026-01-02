// src/hooks/index.ts
/**
 * Hooks Module Index
 * Re-exports all hooks for easy imports
 */
// src/hooks/index.ts
export * from './useIncome';
// Expense hooks
export {
  useExpenses,
  useExpense,
  useExpenseStats,
  useRecentExpenses,
  useTodayExpenses,
  useCreateExpense,
  useEmotionalAnalysis,
  useMonthlyExpenses,
  useRecurringExpenses,
} from './useExpense';

// Budget hooks
export {
  useBudgets,
  useBudget,
  useActiveBudget,
  useBudgetStats,
  useCreateBudget,
  useBudgetAnalysis,
  useBudgetAlerts,
  useBudgetTemplates,
  useBudgetTransactions,
} from './useBudget';

// Bill hooks
export {
  useBills,
  useBill,
  useBillStats,
  useUpcomingBills,
  useOverdueBills,
  useCreateBill,
  useBillProjections,
  useYearlyBillSummary,
} from './useBill';

// Goal hooks
export {
  useGoals,
  useGoal,
  useGoalStats,
  useCreateGoal,
  useGoalProjection,
  useGoalRecommendations,
  useGoalProgressHistory,
} from './useGoal';

// Dependent hooks
export {
  useDependents,
  useDependent,
  useDependentStats,
  useCreateDependent,
//   useDependentSpending,
} from './useDependent';
