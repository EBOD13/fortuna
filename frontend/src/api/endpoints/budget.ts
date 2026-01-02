// src/api/endpoints/budget.ts
/**
 * Budget API Endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import {
  Budget,
  BudgetAllocation,
  CreateBudgetRequest,
  BudgetStats,
  BudgetPeriod,
  CategoryType,
} from '../types';

// ============ BUDGETS CRUD ============

/**
 * Get all budgets for current user
 */
export async function getBudgets(params?: {
  status?: 'active' | 'completed' | 'archived';
  period?: BudgetPeriod;
}): Promise<Budget[]> {
  return apiGet<Budget[]>('/budgets', params);
}

/**
 * Get active budget
 */
export async function getActiveBudget(): Promise<Budget | null> {
  try {
    return await apiGet<Budget>('/budgets/active');
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get a single budget by ID
 */
export async function getBudget(budgetId: string): Promise<Budget> {
  return apiGet<Budget>(`/budgets/${budgetId}`);
}

/**
 * Create a new budget
 */
export async function createBudget(data: CreateBudgetRequest): Promise<Budget> {
  return apiPost<Budget>('/budgets', data);
}

/**
 * Update an existing budget
 */
export async function updateBudget(
  budgetId: string,
  data: Partial<CreateBudgetRequest>
): Promise<Budget> {
  return apiPut<Budget>(`/budgets/${budgetId}`, data);
}

/**
 * Delete a budget
 */
export async function deleteBudget(budgetId: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/budgets/${budgetId}`);
}

/**
 * Archive a budget
 */
export async function archiveBudget(budgetId: string): Promise<Budget> {
  return apiPost<Budget>(`/budgets/${budgetId}/archive`, {});
}

/**
 * Duplicate a budget for a new period
 */
export async function duplicateBudget(
  budgetId: string,
  newStartDate: string
): Promise<Budget> {
  return apiPost<Budget>(`/budgets/${budgetId}/duplicate`, { start_date: newStartDate });
}

// ============ BUDGET STATS ============

/**
 * Get budget statistics
 */
export async function getBudgetStats(): Promise<BudgetStats> {
  return apiGet<BudgetStats>('/budgets/stats');
}

/**
 * Get budget utilization over time
 */
export async function getBudgetHistory(params?: {
  months?: number;
}): Promise<{
  month: string;
  year: number;
  total_budgeted: number;
  total_spent: number;
  utilization: number;
}[]> {
  return apiGet('/budgets/history', params);
}

// ============ ALLOCATIONS ============

/**
 * Get allocations for a budget
 */
export async function getBudgetAllocations(budgetId: string): Promise<BudgetAllocation[]> {
  return apiGet<BudgetAllocation[]>(`/budgets/${budgetId}/allocations`);
}

/**
 * Add allocation to budget
 */
export async function addBudgetAllocation(
  budgetId: string,
  data: {
    category_name: string;
    category_type: CategoryType;
    allocated_amount: number;
  }
): Promise<BudgetAllocation> {
  return apiPost<BudgetAllocation>(`/budgets/${budgetId}/allocations`, data);
}

/**
 * Update allocation
 */
export async function updateBudgetAllocation(
  budgetId: string,
  allocationId: string,
  data: {
    allocated_amount?: number;
    category_type?: CategoryType;
  }
): Promise<BudgetAllocation> {
  return apiPut<BudgetAllocation>(`/budgets/${budgetId}/allocations/${allocationId}`, data);
}

/**
 * Delete allocation
 */
export async function deleteBudgetAllocation(
  budgetId: string,
  allocationId: string
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/budgets/${budgetId}/allocations/${allocationId}`);
}

// ============ QUICK BUDGET ============

/**
 * Create quick budget using 50/30/20 rule
 */
export async function createQuickBudget(data: {
  budget_name: string;
  total_income: number;
  budget_period: BudgetPeriod;
  start_date: string;
  use_503020_rule?: boolean;
  emergency_buffer_percentage?: number;
}): Promise<Budget> {
  return apiPost<Budget>('/budgets/quick', data);
}

/**
 * Get AI-suggested budget based on spending history
 */
export async function getAISuggestedBudget(): Promise<{
  suggested_total: number;
  allocations: {
    category_name: string;
    category_type: CategoryType;
    suggested_amount: number;
    reasoning: string;
    based_on_history: boolean;
  }[];
  insights: string[];
}> {
  return apiGet('/budgets/ai-suggest');
}

// ============ TEMPLATES ============

/**
 * Get budget templates
 */
export async function getBudgetTemplates(): Promise<{
  template_id: string;
  name: string;
  description: string;
  allocations: {
    category_name: string;
    category_type: CategoryType;
    percentage: number;
  }[];
}[]> {
  return apiGet('/budgets/templates');
}

/**
 * Apply template to create budget
 */
export async function applyBudgetTemplate(data: {
  template_id: string;
  budget_name: string;
  total_income: number;
  budget_period: BudgetPeriod;
  start_date: string;
}): Promise<Budget> {
  return apiPost<Budget>('/budgets/templates/apply', data);
}

/**
 * Save current budget as template
 */
export async function saveBudgetAsTemplate(
  budgetId: string,
  templateName: string
): Promise<{ template_id: string; message: string }> {
  return apiPost(`/budgets/${budgetId}/save-template`, { name: templateName });
}

// ============ ROLLOVER ============

/**
 * Calculate rollover amount for a category
 */
export async function calculateRollover(budgetId: string): Promise<{
  total_rollover: number;
  by_category: {
    category_name: string;
    remaining: number;
    rollover_amount: number;
  }[];
}> {
  return apiGet(`/budgets/${budgetId}/rollover`);
}

/**
 * Apply rollover to new budget
 */
export async function applyRollover(
  fromBudgetId: string,
  toBudgetId: string
): Promise<Budget> {
  return apiPost<Budget>(`/budgets/${toBudgetId}/apply-rollover`, {
    from_budget_id: fromBudgetId,
  });
}

// ============ CATEGORY ANALYSIS ============

/**
 * Get spending vs budget by category
 */
export async function getCategoryAnalysis(budgetId: string): Promise<{
  category_name: string;
  category_type: CategoryType;
  allocated: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: 'under' | 'on_track' | 'warning' | 'over';
  daily_average: number;
  projected_end: number;
}[]> {
  return apiGet(`/budgets/${budgetId}/category-analysis`);
}

/**
 * Get 50/30/20 analysis
 */
export async function get503020Analysis(budgetId: string): Promise<{
  needs: {
    target_percentage: 50;
    actual_percentage: number;
    allocated: number;
    spent: number;
    status: 'under' | 'on_track' | 'over';
  };
  wants: {
    target_percentage: 30;
    actual_percentage: number;
    allocated: number;
    spent: number;
    status: 'under' | 'on_track' | 'over';
  };
  savings: {
    target_percentage: 20;
    actual_percentage: number;
    allocated: number;
    spent: number;
    status: 'under' | 'on_track' | 'over';
  };
  insights: string[];
}> {
  return apiGet(`/budgets/${budgetId}/503020-analysis`);
}

// ============ ALERTS ============

/**
 * Get budget alerts
 */
export async function getBudgetAlerts(budgetId: string): Promise<{
  alert_id: string;
  type: 'warning' | 'critical' | 'info';
  category_name?: string;
  message: string;
  threshold_percentage: number;
  current_percentage: number;
  created_at: string;
}[]> {
  return apiGet(`/budgets/${budgetId}/alerts`);
}

/**
 * Dismiss budget alert
 */
export async function dismissBudgetAlert(
  budgetId: string,
  alertId: string
): Promise<{ message: string }> {
  return apiPost(`/budgets/${budgetId}/alerts/${alertId}/dismiss`, {});
}

// ============ TRANSACTIONS ============

/**
 * Get transactions for a budget (expenses linked to this budget)
 */
export async function getBudgetTransactions(
  budgetId: string,
  params?: {
    category?: string;
    page?: number;
    page_size?: number;
  }
): Promise<{
  items: {
    expense_id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    merchant?: string;
  }[];
  total: number;
  page: number;
  page_size: number;
}> {
  return apiGet(`/budgets/${budgetId}/transactions`, params);
}