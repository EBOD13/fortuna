// src/navigation/types.ts

export type RootStackParamList = {
  // Auth screens
  LoginScreen: undefined;
  RegisterScreen: undefined;
  
  // Main tabs
  MainTabs: undefined;
  ProfileScreen: undefined;
  AddDependentScreen: undefined;
  EditDependentScreen: { dependentId: string };
  DependentDetailScreen: { dependentId: string };
  // Add more stack screens as needed
  EditProfileScreen: undefined;
  NotificationsScreen: undefined;
  NotificationDetailScreen: { notificationId: string };
  AddGoalScreen: undefined;
  UpdateGoalScreen: undefined;
  GoalDetailScreen: { goalId: string };
  EditGoalScreen: { goalId: string };
  AddIncomeScreen: undefined;
  LogIncomeScreen: undefined;
  IncomeDetailScreen: { incomeId: string };
  EditIncomeScreen: { incomeId: string };
  AddExpenseScreen: { dependentId?: string; expenseId?: string } | undefined;
  ExpenseDetailScreen: { expenseId: string };
  AddBillScreen: undefined;
  BillDetailScreen: { billId: string };
  EditBillScreen: { billId?: string };
  AddCategoryScreen: undefined;
  AddBudgetScreen: undefined;
  EditBudgetScreen: { budgetId?: string };
  BudgetDetailScreen: { budgetId?: string };
  DailyCheckinScreen: undefined;
  SpendingPatternsScreen: undefined;
  EmotionalReportScreen: undefined;
  MonthlyAnalysisScreen: undefined;
  ReflectionScreen: undefined;
};

export type TabParamList = {
  Home: undefined;
  Plans: undefined;
  Add: undefined;
  Manage: undefined;
  Insight: undefined;
};