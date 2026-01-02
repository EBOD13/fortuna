// src/hooks/useDependent.ts
/**
 * useDependent Hooks
 * Manages dependent data fetching, caching, and mutations
 * Aligned with backend API structure
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as DependentAPI from '../api/endpoints/dependent';
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
  DependentType,
  DependentCategory,
} from '../api/types/dependent';

// ============ useDependents (List) ============

interface UseDependentsResult {
  dependents: DependentSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDependent: (data: CreateDependentRequest) => Promise<Dependent | null>;
  deleteDependent: (id: string, permanent?: boolean) => Promise<boolean>;
}

export function useDependents(filters?: {
  is_active?: boolean;
  dependent_type?: DependentType;
  dependent_category?: DependentCategory;
}): UseDependentsResult {
  const [dependents, setDependents] = useState<DependentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDependents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getDependents(filters);
      setDependents(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load dependents';
      setError(message);
      console.error('Error fetching dependents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.is_active, filters?.dependent_type, filters?.dependent_category]);

  useEffect(() => {
    fetchDependents();
  }, [fetchDependents]);

  const createDependent = useCallback(async (data: CreateDependentRequest): Promise<Dependent | null> => {
    try {
      const newDependent = await DependentAPI.createDependent(data);
      // Refetch list to get updated summaries
      await fetchDependents();
      return newDependent;
    } catch (err: any) {
      const message = err?.message || 'Failed to create dependent';
      Alert.alert('Error', message);
      console.error('Error creating dependent:', err);
      return null;
    }
  }, [fetchDependents]);

  const deleteDependent = useCallback(async (id: string, permanent: boolean = false): Promise<boolean> => {
    try {
      await DependentAPI.deleteDependent(id, permanent);
      setDependents(prev => prev.filter(d => d.dependent_id !== id));
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete dependent';
      Alert.alert('Error', message);
      console.error('Error deleting dependent:', err);
      return false;
    }
  }, []);

  return {
    dependents,
    isLoading,
    error,
    refetch: fetchDependents,
    createDependent,
    deleteDependent,
  };
}

// ============ useDependent (Single) ============

interface UseDependentResult {
  dependent: Dependent | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateDependent: (data: UpdateDependentRequest) => Promise<Dependent | null>;
  deleteDependent: (permanent?: boolean) => Promise<boolean>;
  // Expense management
  addExpenseType: (data: CreateExpenseTypeRequest) => Promise<DependentExpenseType | null>;
  addExpense: (data: CreateDependentExpenseRequest) => Promise<DependentExpense | null>;
  // Shared cost management
  createSharedCost: (data: CreateSharedCostRequest) => Promise<SharedCost | null>;
  recordPayment: (sharedCostId: string, data: SharedCostPaymentRequest) => Promise<SharedCost | null>;
}

export function useDependent(dependentId: string | undefined): UseDependentResult {
  const [dependent, setDependent] = useState<Dependent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDependent = useCallback(async () => {
    if (!dependentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getDependent(dependentId);
      setDependent(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load dependent';
      setError(message);
      console.error('Error fetching dependent:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dependentId]);

  useEffect(() => {
    fetchDependent();
  }, [fetchDependent]);

  const updateDependent = useCallback(async (
    data: UpdateDependentRequest
  ): Promise<Dependent | null> => {
    if (!dependentId) return null;

    try {
      const updated = await DependentAPI.updateDependent(dependentId, data);
      setDependent(updated);
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update dependent';
      Alert.alert('Error', message);
      console.error('Error updating dependent:', err);
      return null;
    }
  }, [dependentId]);

  const deleteDependent = useCallback(async (permanent: boolean = false): Promise<boolean> => {
    if (!dependentId) return false;

    try {
      await DependentAPI.deleteDependent(dependentId, permanent);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete dependent';
      Alert.alert('Error', message);
      console.error('Error deleting dependent:', err);
      return false;
    }
  }, [dependentId]);

  const addExpenseType = useCallback(async (
    data: CreateExpenseTypeRequest
  ): Promise<DependentExpenseType | null> => {
    if (!dependentId) return null;

    try {
      const expenseType = await DependentAPI.addExpenseType(dependentId, data);
      // Refresh dependent to get updated expense types
      await fetchDependent();
      return expenseType;
    } catch (err: any) {
      const message = err?.message || 'Failed to add expense type';
      Alert.alert('Error', message);
      console.error('Error adding expense type:', err);
      return null;
    }
  }, [dependentId, fetchDependent]);

  const addExpense = useCallback(async (
    data: CreateDependentExpenseRequest
  ): Promise<DependentExpense | null> => {
    if (!dependentId) return null;

    try {
      const expense = await DependentAPI.addExpense(dependentId, data);
      // Refresh dependent to get updated expenses
      await fetchDependent();
      return expense;
    } catch (err: any) {
      const message = err?.message || 'Failed to add expense';
      Alert.alert('Error', message);
      console.error('Error adding expense:', err);
      return null;
    }
  }, [dependentId, fetchDependent]);

  const createSharedCost = useCallback(async (
    data: CreateSharedCostRequest
  ): Promise<SharedCost | null> => {
    if (!dependentId) return null;

    try {
      const sharedCost = await DependentAPI.createSharedCost(dependentId, data);
      // Refresh dependent to get updated shared costs
      await fetchDependent();
      return sharedCost;
    } catch (err: any) {
      const message = err?.message || 'Failed to create shared cost agreement';
      Alert.alert('Error', message);
      console.error('Error creating shared cost:', err);
      return null;
    }
  }, [dependentId, fetchDependent]);

  const recordPayment = useCallback(async (
    sharedCostId: string,
    data: SharedCostPaymentRequest
  ): Promise<SharedCost | null> => {
    try {
      const sharedCost = await DependentAPI.recordSharedCostPayment(sharedCostId, data);
      // Refresh dependent to get updated shared costs
      await fetchDependent();
      return sharedCost;
    } catch (err: any) {
      const message = err?.message || 'Failed to record payment';
      Alert.alert('Error', message);
      console.error('Error recording payment:', err);
      return null;
    }
  }, [fetchDependent]);

  return {
    dependent,
    isLoading,
    error,
    refetch: fetchDependent,
    updateDependent,
    deleteDependent,
    addExpenseType,
    addExpense,
    createSharedCost,
    recordPayment,
  };
}

// ============ useDependentStats ============

interface UseDependentStatsResult {
  stats: DependentStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDependentStats(): UseDependentStatsResult {
  const [stats, setStats] = useState<DependentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getDependentStats();
      setStats(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load dependent stats';
      setError(message);
      console.error('Error fetching dependent stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// ============ useCreateDependent ============

interface UseCreateDependentResult {
  isSubmitting: boolean;
  createDependent: (data: CreateDependentRequest) => Promise<Dependent | null>;
}

export function useCreateDependent(): UseCreateDependentResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDependent = useCallback(async (data: CreateDependentRequest): Promise<Dependent | null> => {
    try {
      setIsSubmitting(true);
      const dependent = await DependentAPI.createDependent(data);
      return dependent;
    } catch (err: any) {
      const message = err?.message || 'Failed to create dependent';
      Alert.alert('Error', message);
      console.error('Error creating dependent:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    createDependent,
  };
}

// ============ useDependentProjection ============

interface UseDependentProjectionResult {
  projection: DependentCostProjection | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDependentProjection(
  dependentId: string | undefined,
  monthsAhead: number = 12
): UseDependentProjectionResult {
  const [projection, setProjection] = useState<DependentCostProjection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = useCallback(async () => {
    if (!dependentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getCostProjection(dependentId, monthsAhead);
      setProjection(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load projection';
      setError(message);
      console.error('Error fetching projection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dependentId, monthsAhead]);

  useEffect(() => {
    fetchProjection();
  }, [fetchProjection]);

  return {
    projection,
    isLoading,
    error,
    refetch: fetchProjection,
  };
}

// ============ useDependentMonthlySummary ============

interface UseDependentMonthlySummaryResult {
  summary: DependentMonthlySummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDependentMonthlySummary(
  dependentId: string | undefined,
  year: number,
  month: number
): UseDependentMonthlySummaryResult {
  const [summary, setSummary] = useState<DependentMonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!dependentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getMonthlySummary(dependentId, year, month);
      setSummary(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load monthly summary';
      setError(message);
      console.error('Error fetching monthly summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dependentId, year, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}

// ============ useDependentExpenses ============

interface UseDependentExpensesResult {
  expenses: DependentExpense[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDependentExpenses(
  dependentId: string | undefined,
  params?: {
    limit?: number;
    expense_type_id?: string;
    start_date?: string;
    end_date?: string;
  }
): UseDependentExpensesResult {
  const [expenses, setExpenses] = useState<DependentExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!dependentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getExpenses(dependentId, params);
      setExpenses(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load expenses';
      setError(message);
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dependentId, params?.limit, params?.expense_type_id, params?.start_date, params?.end_date]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    isLoading,
    error,
    refetch: fetchExpenses,
  };
}

// ============ useSharedCosts ============

interface UseSharedCostsResult {
  sharedCosts: SharedCost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  recordPayment: (sharedCostId: string, data: SharedCostPaymentRequest) => Promise<SharedCost | null>;
}

export function useSharedCosts(
  dependentId: string | undefined,
  status?: 'pending' | 'in_progress' | 'completed'
): UseSharedCostsResult {
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedCosts = useCallback(async () => {
    if (!dependentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await DependentAPI.getSharedCosts(dependentId, status);
      setSharedCosts(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load shared costs';
      setError(message);
      console.error('Error fetching shared costs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dependentId, status]);

  useEffect(() => {
    fetchSharedCosts();
  }, [fetchSharedCosts]);

  const recordPayment = useCallback(async (
    sharedCostId: string,
    data: SharedCostPaymentRequest
  ): Promise<SharedCost | null> => {
    try {
      const updated = await DependentAPI.recordSharedCostPayment(sharedCostId, data);
      // Update local state
      setSharedCosts(prev => prev.map(sc => 
        sc.shared_cost_id === sharedCostId ? updated : sc
      ));
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to record payment';
      Alert.alert('Error', message);
      console.error('Error recording payment:', err);
      return null;
    }
  }, []);

  return {
    sharedCosts,
    isLoading,
    error,
    refetch: fetchSharedCosts,
    recordPayment,
  };
}