// mobile/src/types/index.ts
/**
 * TypeScript types for Fortuna mobile app
 */

// ============================================
// USER & AUTH
// ============================================

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  date_of_birth: string;
  phone_number?: string;
  created_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  date_of_birth: string;
  phone_number?: string;
}

// ============================================
// INCOME
// ============================================

export interface IncomeSource {
  source_id: string;
  source_name: string;
  income_type: 'salary' | 'hourly' | 'freelance' | 'investment' | 'rental' | 'other';
  gross_amount: number;
  net_amount: number;
  pay_frequency: 'weekly' | 'biweekly' | 'monthly' | 'annual';
  is_active: boolean;
}

export interface IncomeLog {
  income_id: string;
  source_id: string;
  source?: IncomeSource;
  gross_amount: number;
  net_amount: number;
  payment_date: string;
  hours_worked?: number;
  notes?: string;
}

// ============================================
// EXPENSES
// ============================================

export interface Expense {
  expense_id: string;
  user_id: string;
  expense_date: string;
  amount: number;
  category_id?: string;
  category?: ExpenseCategory;
  merchant_name?: string;
  description?: string;
  payment_method?: string;
  is_recurring: boolean;
  is_planned: boolean;
  emotion?: ExpenseEmotion;
  created_at: string;
}

export interface ExpenseCategory {
  category_id: string;
  category_name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
}

export interface ExpenseEmotion {
  emotion_id: string;
  primary_emotion: EmotionType;
  emotion_intensity: number;
  stress_level: number;
  was_urgent: boolean;
  was_necessary: boolean;
  is_asset: boolean;
  regret_level?: number;
  brought_joy?: boolean;
  would_buy_again?: boolean;
  time_of_day?: string;
  day_type?: string;
  trigger_event?: string;
  notes?: string;
}

export type EmotionType =
  | 'happy'
  | 'excited'
  | 'celebratory'
  | 'neutral'
  | 'planned'
  | 'bored'
  | 'tired'
  | 'stressed'
  | 'anxious'
  | 'frustrated'
  | 'sad'
  | 'guilty'
  | 'impulsive';

export interface ExpenseCreate {
  expense_date: string;
  amount: number;
  category_id?: string;
  merchant_name?: string;
  description?: string;
  payment_method?: string;
  is_recurring?: boolean;
  is_planned?: boolean;
  emotion?: Partial<ExpenseEmotion>;
}

// ============================================
// RECURRING EXPENSES / BILLS
// ============================================

export interface RecurringExpense {
  recurring_id: string;
  expense_name: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  next_due_date: string;
  is_autopay: boolean;
  is_active: boolean;
  notes?: string;
}

export interface UpcomingBill {
  bill_id: string;
  name: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  category?: string;
  is_paid: boolean;
}

// ============================================
// DEPENDENTS
// ============================================

export interface Dependent {
  dependent_id: string;
  name: string;
  relationship: 'child' | 'spouse' | 'parent' | 'pet' | 'other';
  date_of_birth?: string;
  monthly_cost_estimate?: number;
  notes?: string;
}

// ============================================
// GOALS
// ============================================

export interface Goal {
  goal_id: string;
  user_id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  deadline_date?: string;
  priority_level: number;
  is_mandatory: boolean;
  monthly_allocation?: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  completion_percentage: number;
  days_remaining?: number;
  is_on_track: boolean;
  created_at: string;
}

export interface GoalCreate {
  goal_name: string;
  goal_type: string;
  target_amount: number;
  deadline_date?: string;
  priority_level?: number;
  is_mandatory?: boolean;
  monthly_allocation?: number;
}

export interface GoalContribution {
  goal_id: string;
  amount: number;
  notes?: string;
}

// ============================================
// BUDGET
// ============================================

export interface Budget {
  budget_id: string;
  budget_name: string;
  budget_type: 'monthly' | 'weekly' | 'custom';
  start_date: string;
  end_date: string;
  total_amount: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  spent_percentage: number;
  is_over_budget: boolean;
  days_remaining: number;
  daily_allowance: number;
  category_budgets?: CategoryBudget[];
}

export interface CategoryBudget {
  category_budget_id: string;
  category_id: string;
  category_name?: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  spent_percentage: number;
  is_over_budget: boolean;
}

// ============================================
// DASHBOARD
// ============================================

export interface Dashboard {
  generated_at: string;
  greeting: string;
  quick_stats: QuickStats;
  budget_summary: BudgetSummary;
  spending_today: SpendingToday;
  goals_overview: GoalsOverview;
  upcoming_bills: UpcomingBill[];
  recent_transactions: RecentTransaction[];
  streaks: Streaks;
  notifications: NotificationSummary;
  insights: QuickInsights;
  checkin_status: CheckinStatus;
}

export interface QuickStats {
  monthly_income: number;
  monthly_spending: number;
  obligations_owed: number; // Remaining recurring + dependent costs
  weekly_spending: number;
  net_this_month: number;
  spending_change_vs_last_month: number;
  spending_trend: 'up' | 'down' | 'stable';
}

export interface BudgetSummary {
  has_active_budget: boolean;
  budget_id?: string;
  total_budgeted?: number;
  total_spent?: number;
  total_remaining?: number;
  overall_spent_percentage?: number;
  days_remaining?: number;
  daily_allowance?: number;
  on_track?: boolean;
}

export interface SpendingToday {
  total: number;
  transaction_count: number;
  daily_allowance?: number;
  remaining_allowance?: number;
  is_over_allowance: boolean;
  transactions: RecentTransaction[];
}

export interface GoalsOverview {
  active_goals: number;
  total_target: number;
  total_saved: number;
  overall_progress: number;
  top_goals: GoalSummary[];
}

export interface GoalSummary {
  goal_id: string;
  name: string;
  target: number;
  current: number;
  percentage: number;
  deadline?: string;
  days_remaining?: number;
  is_on_track: boolean;
}

export interface RecentTransaction {
  expense_id: string;
  date: string;
  amount: number;
  merchant?: string;
  category?: string;
  has_emotion: boolean;
  emotion?: string;
}

export interface Streaks {
  logging_streak: number;
  all_streaks: Record<string, StreakInfo>;
  has_streak: boolean;
}

export interface StreakInfo {
  current: number;
  longest: number;
  target?: number;
}

export interface NotificationSummary {
  unread_count: number;
  recent: NotificationItem[];
}

export interface NotificationItem {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface QuickInsights {
  emotional_spending_pct: number;
  top_category: {
    name?: string;
    amount: number;
  };
  tip: string;
}

export interface CheckinStatus {
  completed: boolean;
  expenses_logged: boolean;
  emotions_captured: boolean;
  total_spent?: number;
  expense_count?: number;
  mood?: string;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  notification_id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  category?: string;
  action_type?: string;
  action_data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// ============================================
// AI INSIGHTS
// ============================================

export interface EmotionalAnalysis {
  status: string;
  summary: {
    total_spending: number;
    total_emotional_spending: number;
    emotional_percentage: number;
    unnecessary_spending: number;
    impulsive_spending: number;
  };
  by_emotion: Record<string, EmotionStats>;
  risk_score: number;
  spending_persona?: SpendingPersona;
  recommendations: string[];
}

export interface EmotionStats {
  count: number;
  total: number;
  average: number;
  category: string;
}

export interface SpendingPersona {
  persona: string;
  description: string;
  traits: Record<string, number>;
}

export interface SpendingPrediction {
  status: string;
  dates: string[];
  predictions: number[];
  total_predicted: number;
  average_daily: number;
}

// ============================================
// ACHIEVEMENTS
// ============================================

export interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned_at?: string;
  progress?: number;
  target?: number;
}

// ============================================
// NAVIGATION
// ============================================

export type RootStackParamList = {
  // Auth
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  
  // Main
  Main: undefined;
  
  // Modals
  AddExpense: { expense?: Expense };
  AddIncome: undefined;
  AddGoal: undefined;
  UpdateGoal: { goalId: string };
  MakePayment: { billId?: string };
  
  // Detail screens
  ExpenseDetail: { expenseId: string };
  GoalDetail: { goalId: string };
  
  // Other
  Notifications: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Plan: undefined;
  Add: undefined;
  Manage: undefined;
  Insights: undefined;
};

// ============================================
// ADD MENU ACTIONS
// ============================================

export type AddMenuAction = 
  | 'log_income'
  | 'log_expense'
  | 'update_goal'
  | 'make_payment';

export interface AddMenuItem {
  id: AddMenuAction;
  title: string;
  subtitle: string;
  icon: string;
}
