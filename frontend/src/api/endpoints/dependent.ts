// src/api/endpoints/dependent.ts
/**
 * Dependent API Endpoints
 * Aligned with backend/app/api/v1/dependents.py
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import type {
  Dependent,
  DependentSummary,
  DependentStats,
  DependentCostProjection,
  DependentMonthlySummary,
  CreateDependentRequest,
  UpdateDependentRequest,
  DependentExpenseType,
  DependentExpense,
  SharedCost,
  CreateExpenseTypeRequest,
  CreateDependentExpenseRequest,
  CreateSharedCostRequest,
  SharedCostPaymentRequest,
  BrotherEducationSetup,
  PetSetup,
  DependentType,
  DependentCategory,
} from '../types/dependent';

// ============ DEPENDENTS CRUD ============

/**
 * Get all dependents for current user
 * Returns lightweight summaries for list views
 */
export async function getDependents(params?: {
  is_active?: boolean;
  dependent_type?: DependentType;
  dependent_category?: DependentCategory;
}): Promise<DependentSummary[]> {
  return apiGet<DependentSummary[]>('/dependents', params);
}

/**
 * Get a single dependent with full details
 */
export async function getDependent(dependentId: string): Promise<Dependent> {
  return apiGet<Dependent>(`/dependents/${dependentId}`);
}

/**
 * Create a new dependent
 */
export async function createDependent(data: CreateDependentRequest): Promise<Dependent> {
  return apiPost<Dependent>('/dependents', data);
}

/**
 * Update an existing dependent
 */
export async function updateDependent(
  dependentId: string,
  data: UpdateDependentRequest
): Promise<Dependent> {
  return apiPut<Dependent>(`/dependents/${dependentId}`, data);
}

/**
 * Delete or deactivate a dependent
 */
export async function deleteDependent(
  dependentId: string,
  permanent: boolean = false
): Promise<void> {
  return apiDelete(`/dependents/${dependentId}?permanent=${permanent}`);
}

// ============ EXPENSE TYPES ============

/**
 * Add an expense type for a dependent
 * e.g., "Tuition", "Books", "Food", "Vet"
 */
export async function addExpenseType(
  dependentId: string,
  data: CreateExpenseTypeRequest
): Promise<DependentExpenseType> {
  return apiPost<DependentExpenseType>(`/dependents/${dependentId}/expense-types`, data);
}

/**
 * Get expense types for a dependent
 */
export async function getExpenseTypes(
  dependentId: string
): Promise<DependentExpenseType[]> {
  return apiGet<DependentExpenseType[]>(`/dependents/${dependentId}/expense-types`);
}

// ============ EXPENSES ============

/**
 * Add an expense for a dependent
 */
export async function addExpense(
  dependentId: string,
  data: CreateDependentExpenseRequest
): Promise<DependentExpense> {
  return apiPost<DependentExpense>(`/dependents/${dependentId}/expenses`, data);
}

/**
 * Get expenses for a dependent
 */
export async function getExpenses(
  dependentId: string,
  params?: {
    limit?: number;
    expense_type_id?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<DependentExpense[]> {
  return apiGet<DependentExpense[]>(`/dependents/${dependentId}/expenses`, params);
}

// ============ SHARED COSTS ============

/**
 * Create a shared cost agreement
 */
export async function createSharedCost(
  dependentId: string,
  data: CreateSharedCostRequest
): Promise<SharedCost> {
  return apiPost<SharedCost>(`/dependents/${dependentId}/shared-costs`, data);
}

/**
 * Get shared costs for a dependent
 */
export async function getSharedCosts(
  dependentId: string,
  status?: 'pending' | 'in_progress' | 'completed'
): Promise<SharedCost[]> {
  return apiGet<SharedCost[]>(`/dependents/${dependentId}/shared-costs`, status ? { status } : undefined);
}

/**
 * Record a payment towards shared cost
 */
export async function recordSharedCostPayment(
  sharedCostId: string,
  data: SharedCostPaymentRequest
): Promise<SharedCost> {
  return apiPost<SharedCost>(`/dependents/shared-costs/${sharedCostId}/payments`, data);
}

// ============ STATS & ANALYTICS ============

/**
 * Get dependent statistics
 */
export async function getDependentStats(): Promise<DependentStats> {
  return apiGet<DependentStats>('/dependents/stats');
}

/**
 * Get cost projection for a dependent
 */
export async function getCostProjection(
  dependentId: string,
  monthsAhead: number = 12
): Promise<DependentCostProjection> {
  return apiGet<DependentCostProjection>(`/dependents/${dependentId}/projection`, {
    months_ahead: monthsAhead,
  });
}

/**
 * Get monthly summary for a dependent
 */
export async function getMonthlySummary(
  dependentId: string,
  year: number,
  month: number
): Promise<DependentMonthlySummary> {
  return apiGet<DependentMonthlySummary>(
    `/dependents/${dependentId}/monthly-summary/${year}/${month}`
  );
}

// ============ QUICK SETUP ============

/**
 * Quick setup: Brother's education
 * Creates dependent + shared cost agreement + expense types
 */
export async function setupBrotherEducation(
  data: BrotherEducationSetup
): Promise<{
  message: string;
  dependent_id: string;
  shared_cost_id: string;
  monthly_savings_needed: number;
  remaining_semesters: number;
}> {
  return apiPost('/dependents/setup/brother-education', data);
}

/**
 * Quick setup: Pet
 * Creates dependent with common expense types
 */
export async function setupPet(data: PetSetup): Promise<Dependent> {
  return apiPost<Dependent>('/dependents/setup/pet', data);
}

// ============ LEGACY COMPATIBILITY ============
// These functions provide backwards compatibility with existing hooks

/**
 * Get spending data for a dependent
 * @deprecated Use getCostProjection or getMonthlySummary instead
 */
export async function getDependentSpending(
  dependentId: string,
  params?: { start_date?: string; end_date?: string }
): Promise<{
  total_spent: number;
  monthly_average: number;
  by_category: { category: string; total: number; percentage: number }[];
  recent_expenses: { expense_id: string; description: string; amount: number; date: string; category: string }[];
  trend: { month: string; amount: number }[];
}> {
  // This endpoint may not exist in backend - implement on backend or use alternatives
  const [dependent, projection] = await Promise.all([
    getDependent(dependentId),
    getCostProjection(dependentId, 6),
  ]);

  return {
    total_spent: dependent.total_spent_to_date,
    monthly_average: dependent.your_monthly_share || dependent.monthly_cost_estimate || 0,
    by_category: [], // Would need separate endpoint
    recent_expenses: (dependent.recent_expenses || []).map(exp => ({
      expense_id: exp.expense_id,
      description: exp.expense_name,
      amount: exp.amount,
      date: exp.expense_date,
      category: exp.expense_type_id || 'other',
    })),
    trend: projection.projected_months.map(m => ({
      month: m.month,
      amount: m.projected_cost,
    })),
  };
}