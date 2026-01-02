// src/api/endpoints/expense.ts
/**
 * Expense API Endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import {
  Expense,
  CreateExpenseRequest,
  ExpenseFilters,
  PaginatedResponse,
  ExpenseCategory,
  EmotionType,
} from '../types';

// ============ EXPENSES CRUD ============

/**
 * Get all expenses with optional filters
 */
export async function getExpenses(
  filters?: ExpenseFilters & { page?: number; page_size?: number }
): Promise<PaginatedResponse<Expense>> {
  return apiGet<PaginatedResponse<Expense>>('/expenses', filters);
}

/**
 * Get a single expense by ID
 */
export async function getExpense(expenseId: string): Promise<Expense> {
  return apiGet<Expense>(`/expenses/${expenseId}`);
}

/**
 * Create a new expense
 */
export async function createExpense(data: CreateExpenseRequest): Promise<Expense> {
  return apiPost<Expense>('/expenses', data);
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  expenseId: string,
  data: Partial<CreateExpenseRequest>
): Promise<Expense> {
  return apiPut<Expense>(`/expenses/${expenseId}`, data);
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/expenses/${expenseId}`);
}

// ============ RECENT & QUICK ACCESS ============

/**
 * Get recent expenses (last 7 days)
 */
export async function getRecentExpenses(limit: number = 10): Promise<Expense[]> {
  return apiGet<Expense[]>('/expenses/recent', { limit });
}

/**
 * Get today's expenses
 */
export async function getTodayExpenses(): Promise<{
  expenses: Expense[];
  total: number;
  count: number;
}> {
  return apiGet('/expenses/today');
}

/**
 * Quick add expense (minimal fields)
 */
export async function quickAddExpense(data: {
  amount: number;
  description: string;
  category: ExpenseCategory;
  emotion?: EmotionType;
}): Promise<Expense> {
  return apiPost<Expense>('/expenses/quick', data);
}

// ============ EXPENSE STATS ============

/**
 * Get expense statistics
 */
export async function getExpenseStats(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  total_spent: number;
  average_per_day: number;
  transaction_count: number;
  largest_expense: number;
  by_category: {
    category: ExpenseCategory;
    total: number;
    count: number;
    percentage: number;
  }[];
  by_emotion: {
    emotion: EmotionType;
    total: number;
    count: number;
    percentage: number;
  }[];
}> {
  return apiGet('/expenses/stats', params);
}

/**
 * Get monthly expense summary
 */
export async function getMonthlyExpenses(
  year: number,
  month: number
): Promise<{
  total: number;
  count: number;
  daily_average: number;
  by_category: {
    category: ExpenseCategory;
    total: number;
    count: number;
  }[];
  by_day: {
    date: string;
    total: number;
    count: number;
  }[];
  comparison: {
    vs_last_month: number;
    vs_last_month_percentage: number;
  };
}> {
  return apiGet(`/expenses/monthly/${year}/${month}`);
}

// ============ EMOTIONAL TRACKING ============

/**
 * Get emotional spending analysis
 */
export async function getEmotionalSpendingAnalysis(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  total_emotional_spending: number;
  total_planned_spending: number;
  emotional_percentage: number;
  by_emotion: {
    emotion: EmotionType;
    total: number;
    count: number;
    average_amount: number;
    common_categories: ExpenseCategory[];
  }[];
  triggers: {
    trigger: string;
    frequency: number;
    average_amount: number;
  }[];
  time_patterns: {
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
    total: number;
    count: number;
    primary_emotion: EmotionType;
  }[];
}> {
  return apiGet('/expenses/emotional-analysis', params);
}

/**
 * Add reflection to an expense
 */
export async function addExpenseReflection(
  expenseId: string,
  data: {
    prompt: string;
    response: string;
  }
): Promise<Expense> {
  return apiPost<Expense>(`/expenses/${expenseId}/reflection`, data);
}

/**
 * Update satisfaction rating
 */
export async function updateSatisfactionRating(
  expenseId: string,
  rating: number
): Promise<Expense> {
  return apiPut<Expense>(`/expenses/${expenseId}/satisfaction`, { rating });
}

// ============ RECURRING EXPENSES ============

/**
 * Get recurring expenses
 */
export async function getRecurringExpenses(): Promise<Expense[]> {
  return apiGet<Expense[]>('/expenses/recurring');
}

/**
 * Create recurring expense
 */
export async function createRecurringExpense(data: CreateExpenseRequest & {
  recurring_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
}): Promise<Expense> {
  return apiPost<Expense>('/expenses/recurring', data);
}

/**
 * Skip next occurrence of recurring expense
 */
export async function skipRecurringExpense(expenseId: string): Promise<Expense> {
  return apiPost<Expense>(`/expenses/${expenseId}/skip`, {});
}

/**
 * Stop recurring expense
 */
export async function stopRecurringExpense(expenseId: string): Promise<Expense> {
  return apiPost<Expense>(`/expenses/${expenseId}/stop`, {});
}

// ============ CATEGORIES ============

/**
 * Get spending by category
 */
export async function getSpendingByCategory(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  vs_last_period: number;
}[]> {
  return apiGet('/expenses/by-category', params);
}

/**
 * Get category details
 */
export async function getCategoryDetails(
  category: ExpenseCategory,
  params?: {
    start_date?: string;
    end_date?: string;
  }
): Promise<{
  category: ExpenseCategory;
  total: number;
  count: number;
  average: number;
  expenses: Expense[];
  merchants: {
    name: string;
    total: number;
    count: number;
  }[];
}> {
  return apiGet(`/expenses/category/${category}`, params);
}

// ============ SEARCH ============

/**
 * Search expenses
 */
export async function searchExpenses(
  query: string,
  filters?: ExpenseFilters
): Promise<Expense[]> {
  return apiGet<Expense[]>('/expenses/search', { query, ...filters });
}

// ============ EXPORT ============

/**
 * Export expenses to CSV
 */
export async function exportExpenses(params?: {
  start_date?: string;
  end_date?: string;
  format?: 'csv' | 'json';
}): Promise<{ download_url: string }> {
  return apiGet('/expenses/export', params);
}

// ============ DEPENDENT EXPENSES ============

/**
 * Get expenses for a dependent
 */
export async function getDependentExpenses(
  dependentId: string,
  params?: {
    start_date?: string;
    end_date?: string;
  }
): Promise<{
  expenses: Expense[];
  total: number;
  count: number;
  by_category: {
    category: ExpenseCategory;
    total: number;
    count: number;
  }[];
}> {
  return apiGet(`/expenses/dependent/${dependentId}`, params);
}