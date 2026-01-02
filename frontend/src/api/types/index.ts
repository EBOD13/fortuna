// src/api/types/index.ts
/**
 * API Types Index
 * Re-exports all API types
 */

// Re-export dependent types
export * from './dependent';

// Re-export income types (aligned with backend)
export * from './income';

// ============ COMMON TYPES ============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// ============ AUTH TYPES ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  date_of_birth: string; // YYYY-MM-DD
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ============ USER TYPES ============

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  date_of_birth?: string;
  avatar_url?: string;
  phone?: string;
  
  // Preferences
  currency: Currency;
  timezone: string;
  locale: string;
  
  // Profile
  occupation?: string;
  household_size?: number;
  risk_tolerance?: RiskTolerance;
  spending_personality?: string;
  
  // Status
  is_active: boolean;
  is_verified: boolean;
  subscription_type: SubscriptionType;
  subscription_expires?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'MXN';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type SubscriptionType = 'free' | 'premium' | 'pro';

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  currency?: Currency;
  timezone?: string;
  locale?: string;
  occupation?: string;
  household_size?: number;
  risk_tolerance?: RiskTolerance;
}

// ============ EXPENSE TYPES ============

export type ExpenseCategory = 
  | 'food' | 'dining' | 'groceries' | 'transport' | 'entertainment' 
  | 'shopping' | 'utilities' | 'healthcare' | 'education' | 'personal' 
  | 'gifts' | 'travel' | 'subscriptions' | 'housing' | 'insurance' 
  | 'childcare' | 'pets' | 'fitness' | 'beauty' | 'other';

export type EmotionType = 
  | 'happy' | 'excited' | 'content' | 'neutral' | 'stressed' 
  | 'anxious' | 'sad' | 'frustrated' | 'guilty' | 'impulsive' 
  | 'bored' | 'celebratory';

export type PaymentMethod = 
  | 'cash' | 'credit' | 'debit' | 'venmo' | 'apple_pay' 
  | 'google_pay' | 'bank_transfer' | 'other';

export type ExpenseStatus = 'pending' | 'confirmed' | 'disputed' | 'refunded';

export interface Expense {
  expense_id: string;
  user_id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  subcategory?: string;
  merchant?: string;
  location?: string;
  
  // Date/Time
  expense_date: string;
  expense_time?: string;
  
  // Payment
  payment_method?: PaymentMethod;
  status: ExpenseStatus;
  
  // Emotional tracking
  emotion?: EmotionType;
  emotion_intensity?: number;
  stress_level?: number;
  was_planned: boolean;
  was_necessary: boolean;
  satisfaction_rating?: number;
  
  // Relationships
  dependent_id?: string;
  dependent_name?: string;
  budget_id?: string;
  budget_name?: string;
  goal_impact?: string;
  
  // Recurring
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  next_occurrence?: string;
  
  // Additional
  notes?: string;
  tags?: string[];
  receipt_url?: string;
  
  // Reflection
  reflection?: {
    prompt: string;
    response: string;
    created_at: string;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category: ExpenseCategory;
  subcategory?: string;
  merchant?: string;
  location?: string;
  expense_date: string;
  expense_time?: string;
  payment_method?: PaymentMethod;
  emotion?: EmotionType;
  emotion_intensity?: number;
  stress_level?: number;
  was_planned?: boolean;
  was_necessary?: boolean;
  satisfaction_rating?: number;
  dependent_id?: string;
  budget_id?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  notes?: string;
  tags?: string[];
}

export interface ExpenseFilters {
  start_date?: string;
  end_date?: string;
  category?: ExpenseCategory;
  emotion?: EmotionType;
  min_amount?: number;
  max_amount?: number;
  is_recurring?: boolean;
  was_planned?: boolean;
  merchant?: string;
  search?: string;
}

// ============ BUDGET TYPES ============

export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type BudgetStatus = 'active' | 'completed' | 'archived';
export type CategoryType = 'needs' | 'wants' | 'savings';

export interface Budget {
  budget_id: string;
  user_id: string;
  budget_name: string;
  budget_period: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_income: number;
  total_allocated: number;
  total_spent: number;
  remaining: number;
  emergency_buffer?: number;
  rollover_enabled: boolean;
  rollover_amount?: number;
  is_ai_generated: boolean;
  status: BudgetStatus;
  notes?: string;
  allocations: BudgetAllocation[];
  created_at: string;
  updated_at: string;
}

export interface BudgetAllocation {
  allocation_id: string;
  budget_id: string;
  category_name: string;
  category_type: CategoryType;
  allocated_amount: number;
  spent_amount: number;
  remaining: number;
  utilization_percentage: number;
  icon?: string;
  color?: string;
}

export interface CreateBudgetRequest {
  budget_name: string;
  budget_period: BudgetPeriod;
  start_date: string;
  total_income: number;
  savings_target?: number;
  emergency_buffer?: number;
  is_rollover_enabled?: boolean;
  allocations?: {
    category_name: string;
    category_type: CategoryType;
    allocated_amount: number;
  }[];
  notes?: string;
}

export interface BudgetStats {
  active_budget_id?: string;
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  utilization_percentage: number;
  days_remaining: number;
  daily_budget: number;
  on_track: boolean;
  projected_end_amount: number;
}

// ============ BILL TYPES ============

export type BillCategory = 
  | 'utilities' | 'housing' | 'insurance' | 'subscription' | 'subscriptions' | 'phone'
  | 'internet' | 'streaming' | 'loan' | 'credit_card' | 'healthcare'
  | 'education' | 'transportation' | 'membership' | 'other';

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually';
export type BillStatus = 'active' | 'paused' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'scheduled' | 'failed';

export interface Bill {
  bill_id: string;
  user_id: string;
  bill_name: string;
  payee: string;
  category: BillCategory;
  amount: number;
  is_variable_amount: boolean;
  frequency: BillFrequency;
  due_day: number;
  next_due_date: string;
  is_auto_pay: boolean;
  payment_method?: PaymentMethod;
  account_number?: string;
  reminder_days: number;
  website?: string;
  status: BillStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  payment_id: string;
  bill_id: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  payment_method?: string;
  confirmation_number?: string;
  was_late: boolean;
  late_fee?: number;
  notes?: string;
  created_at: string;
}

export interface CreateBillRequest {
  bill_name: string;
  payee: string;
  category: BillCategory;
  amount: number;
  is_variable_amount?: boolean;
  frequency: BillFrequency;
  next_due_date: string;
  due_day?: number;
  is_auto_pay?: boolean;
  reminders_enabled?: boolean;
  reminder_days?: number;
  payment_method?: PaymentMethod;
  account_number?: string;
  website?: string;
  notes?: string;
}

// ============ GOAL TYPES ============

export type GoalType = 
  | 'savings' | 'emergency' | 'emergency_fund' | 'investment' | 'debt_payoff' 
  | 'purchase' | 'vacation' | 'travel' | 'car' | 'home' | 'education'
  | 'wedding' | 'retirement' | 'custom' | 'other';

export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Goal {
  goal_id: string;
  user_id: string;
  goal_name: string;
  goal_type: GoalType;
  description?: string;
  target_amount: number;
  current_amount: number;
  progress_percentage: number;
  target_date?: string;
  monthly_contribution?: number;
  priority: GoalPriority;
  status: GoalStatus;
  icon?: string;
  color?: string;
  milestones?: GoalMilestone[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  milestone_id: string;
  goal_id: string;
  title: string;
  target_amount: number;
  target_date?: string;
  is_completed: boolean;
  completed_at?: string;
  celebration_message?: string;
}

export interface CreateGoalRequest {
  goal_name: string;
  goal_type: GoalType;
  description?: string;
  target_amount: number;
  current_amount?: number;
  initial_amount?: number;
  target_date?: string;
  monthly_contribution?: number;
  priority?: GoalPriority;
  icon?: string;
  color?: string;
  milestones?: {
    title: string;
    target_amount: number;
    target_date?: string;
  }[];
  notes?: string;
}

export interface GoalContribution {
  contribution_id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  source?: string;
  notes?: string;
  created_at: string;
}

// ============ INSIGHT TYPES ============

export type InsightType = 
  | 'tip' | 'warning' | 'positive' | 'pattern' 
  | 'alert' | 'suggestion' | 'achievement' | 'reminder';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Insight {
  insight_id: string;
  user_id: string;
  type: InsightType;
  title: string;
  message: string;
  priority: InsightPriority;
  is_read: boolean;
  is_dismissed: boolean;
  action_url?: string;
  action_label?: string;
  related_data?: Record<string, any>;
  expires_at?: string;
  created_at: string;
}

// ============ NOTIFICATION TYPES ============

export type NotificationType = 
  | 'budget_alert' | 'goal_milestone' | 'bill_reminder' | 'spending_alert'
  | 'income_received' | 'insight' | 'achievement' | 'tip' | 'system' | 'reminder';

export interface Notification {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: InsightPriority;
  is_read: boolean;
  action_url?: string;
  related_id?: string;
  related_type?: string;
  created_at: string;
}

// ============ SEARCH TYPES ============

export interface SearchResult {
  id: string;
  type: 'expense' | 'goal' | 'budget' | 'bill' | 'income' | 'dependent';
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
  icon?: string;
  color?: string;
}

export interface SearchRequest {
  query: string;
  types?: SearchResult['type'][];
  limit?: number;
}

// ============ ANALYTICS TYPES ============

export interface SpendingPattern {
  pattern_id: string;
  pattern_type: 'time_based' | 'emotion_based' | 'category_based' | 'merchant_based';
  title: string;
  description: string;
  frequency: number;
  average_amount: number;
  total_impact: number;
  recommendations: string[];
}

export interface EmotionalSpendingReport {
  period_start: string;
  period_end: string;
  total_spending: number;
  emotional_spending: number;
  planned_spending: number;
  by_emotion: {
    emotion: EmotionType;
    total: number;
    count: number;
    average: number;
    percentage: number;
  }[];
  by_time_of_day: {
    time_of_day: string;
    total: number;
    count: number;
    primary_emotion?: EmotionType;
  }[];
  insights: string[];
}

export interface MonthlyAnalysis {
  month: string;
  year: number;
  total_income: number;
  total_expenses: number;
  total_saved: number;
  savings_rate: number;
  budget_adherence: number;
  emotional_spending_percentage: number;
  top_categories: {
    category: string;
    amount: number;
    percentage: number;
    vs_last_month: number;
  }[];
  goals_progress: {
    goal_id: string;
    goal_name: string;
    contribution: number;
    progress: number;
  }[];
}