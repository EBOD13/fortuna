// src/hooks/useBudget.ts
/**
 * useBudget Hooks
 * Manages budget data fetching, caching, and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as BudgetAPI from '../api/endpoints/budget';
import {
  Budget,
  BudgetAllocation,
  CreateBudgetRequest,
  BudgetStats,
  BudgetPeriod,
  CategoryType,
} from '../api/types';

// ============ TYPES ============

interface UseBudgetsResult {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createBudget: (data: CreateBudgetRequest) => Promise<Budget | null>;
  deleteBudget: (id: string) => Promise<boolean>;
  archiveBudget: (id: string) => Promise<boolean>;
}

interface UseBudgetResult {
  budget: Budget | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateBudget: (data: Partial<CreateBudgetRequest>) => Promise<Budget | null>;
  deleteBudget: () => Promise<boolean>;
  addAllocation: (data: { category_name: string; category_type: CategoryType; allocated_amount: number }) => Promise<BudgetAllocation | null>;
  updateAllocation: (allocationId: string, data: { allocated_amount?: number }) => Promise<BudgetAllocation | null>;
  deleteAllocation: (allocationId: string) => Promise<boolean>;
}

interface UseActiveBudgetResult {
  budget: Budget | null;
  stats: BudgetStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============ useBudgets ============

export function useBudgets(params?: {
  status?: 'active' | 'completed' | 'archived';
  period?: BudgetPeriod;
}): UseBudgetsResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BudgetAPI.getBudgets(params);
      setBudgets(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load budgets';
      setError(message);
      console.error('Error fetching budgets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.period]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = useCallback(async (data: CreateBudgetRequest): Promise<Budget | null> => {
    try {
      const newBudget = await BudgetAPI.createBudget(data);
      setBudgets(prev => [newBudget, ...prev]);
      return newBudget;
    } catch (err: any) {
      const message = err?.message || 'Failed to create budget';
      Alert.alert('Error', message);
      console.error('Error creating budget:', err);
      return null;
    }
  }, []);

  const deleteBudget = useCallback(async (id: string): Promise<boolean> => {
    try {
      await BudgetAPI.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.budget_id !== id));
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete budget';
      Alert.alert('Error', message);
      console.error('Error deleting budget:', err);
      return false;
    }
  }, []);

  const archiveBudget = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updated = await BudgetAPI.archiveBudget(id);
      setBudgets(prev => prev.map(b => b.budget_id === id ? updated : b));
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to archive budget';
      Alert.alert('Error', message);
      console.error('Error archiving budget:', err);
      return false;
    }
  }, []);

  return {
    budgets,
    isLoading,
    error,
    refetch: fetchBudgets,
    createBudget,
    deleteBudget,
    archiveBudget,
  };
}

// ============ useBudget (single) ============

export function useBudget(budgetId: string | undefined): UseBudgetResult {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!budgetId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await BudgetAPI.getBudget(budgetId);
      setBudget(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load budget';
      setError(message);
      console.error('Error fetching budget:', err);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const updateBudget = useCallback(async (
    data: Partial<CreateBudgetRequest>
  ): Promise<Budget | null> => {
    if (!budgetId) return null;

    try {
      const updated = await BudgetAPI.updateBudget(budgetId, data);
      setBudget(updated);
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update budget';
      Alert.alert('Error', message);
      console.error('Error updating budget:', err);
      return null;
    }
  }, [budgetId]);

  const deleteBudget = useCallback(async (): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      await BudgetAPI.deleteBudget(budgetId);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete budget';
      Alert.alert('Error', message);
      console.error('Error deleting budget:', err);
      return false;
    }
  }, [budgetId]);

  const addAllocation = useCallback(async (data: {
    category_name: string;
    category_type: CategoryType;
    allocated_amount: number;
  }): Promise<BudgetAllocation | null> => {
    if (!budgetId) return null;

    try {
      const allocation = await BudgetAPI.addBudgetAllocation(budgetId, data);
      // Refetch budget to get updated allocations
      await fetchBudget();
      return allocation;
    } catch (err: any) {
      const message = err?.message || 'Failed to add allocation';
      Alert.alert('Error', message);
      console.error('Error adding allocation:', err);
      return null;
    }
  }, [budgetId, fetchBudget]);

  const updateAllocation = useCallback(async (
    allocationId: string,
    data: { allocated_amount?: number }
  ): Promise<BudgetAllocation | null> => {
    if (!budgetId) return null;

    try {
      const updated = await BudgetAPI.updateBudgetAllocation(budgetId, allocationId, data);
      // Refetch budget to get updated totals
      await fetchBudget();
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update allocation';
      Alert.alert('Error', message);
      console.error('Error updating allocation:', err);
      return null;
    }
  }, [budgetId, fetchBudget]);

  const deleteAllocation = useCallback(async (allocationId: string): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      await BudgetAPI.deleteBudgetAllocation(budgetId, allocationId);
      // Refetch budget to get updated totals
      await fetchBudget();
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete allocation';
      Alert.alert('Error', message);
      console.error('Error deleting allocation:', err);
      return false;
    }
  }, [budgetId, fetchBudget]);

  return {
    budget,
    isLoading,
    error,
    refetch: fetchBudget,
    updateBudget,
    deleteBudget,
    addAllocation,
    updateAllocation,
    deleteAllocation,
  };
}

// ============ useActiveBudget ============

export function useActiveBudget(): UseActiveBudgetResult {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [budgetData, statsData] = await Promise.all([
        BudgetAPI.getActiveBudget(),
        BudgetAPI.getBudgetStats(),
      ]);

      setBudget(budgetData);
      setStats(statsData);
    } catch (err: any) {
      const message = err?.message || 'Failed to load budget data';
      setError(message);
      console.error('Error fetching active budget:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    budget,
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ============ useBudgetStats ============

export function useBudgetStats() {
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BudgetAPI.getBudgetStats();
      setStats(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load budget stats';
      setError(message);
      console.error('Error fetching budget stats:', err);
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

// ============ useCreateBudget ============

interface UseCreateBudgetResult {
  isSubmitting: boolean;
  createBudget: (data: CreateBudgetRequest) => Promise<Budget | null>;
  createQuickBudget: (data: {
    budget_name: string;
    total_income: number;
    budget_period: BudgetPeriod;
    start_date: string;
    use_503020_rule?: boolean;
  }) => Promise<Budget | null>;
}

export function useCreateBudget(): UseCreateBudgetResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBudget = useCallback(async (data: CreateBudgetRequest): Promise<Budget | null> => {
    try {
      setIsSubmitting(true);
      const budget = await BudgetAPI.createBudget(data);
      return budget;
    } catch (err: any) {
      const message = err?.message || 'Failed to create budget';
      Alert.alert('Error', message);
      console.error('Error creating budget:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const createQuickBudget = useCallback(async (data: {
    budget_name: string;
    total_income: number;
    budget_period: BudgetPeriod;
    start_date: string;
    use_503020_rule?: boolean;
  }): Promise<Budget | null> => {
    try {
      setIsSubmitting(true);
      const budget = await BudgetAPI.createQuickBudget(data);
      return budget;
    } catch (err: any) {
      const message = err?.message || 'Failed to create budget';
      Alert.alert('Error', message);
      console.error('Error creating quick budget:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    createBudget,
    createQuickBudget,
  };
}

// ============ useBudgetAnalysis ============

export function useBudgetAnalysis(budgetId: string | undefined) {
  const [categoryAnalysis, setCategoryAnalysis] = useState<Awaited<ReturnType<typeof BudgetAPI.getCategoryAnalysis>> | null>(null);
  const [analysis503020, setAnalysis503020] = useState<Awaited<ReturnType<typeof BudgetAPI.get503020Analysis>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!budgetId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [catData, ruleData] = await Promise.all([
        BudgetAPI.getCategoryAnalysis(budgetId),
        BudgetAPI.get503020Analysis(budgetId),
      ]);

      setCategoryAnalysis(catData);
      setAnalysis503020(ruleData);
    } catch (err: any) {
      const message = err?.message || 'Failed to load budget analysis';
      setError(message);
      console.error('Error fetching budget analysis:', err);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    categoryAnalysis,
    analysis503020,
    isLoading,
    error,
    refetch: fetchAnalysis,
  };
}

// ============ useBudgetAlerts ============

export function useBudgetAlerts(budgetId: string | undefined) {
  const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof BudgetAPI.getBudgetAlerts>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!budgetId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await BudgetAPI.getBudgetAlerts(budgetId);
      setAlerts(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load budget alerts';
      setError(message);
      console.error('Error fetching budget alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const dismissAlert = useCallback(async (alertId: string): Promise<boolean> => {
    if (!budgetId) return false;

    try {
      await BudgetAPI.dismissBudgetAlert(budgetId, alertId);
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
      return true;
    } catch (err: any) {
      Alert.alert('Error', 'Failed to dismiss alert');
      return false;
    }
  }, [budgetId]);

  return {
    alerts,
    isLoading,
    error,
    refetch: fetchAlerts,
    dismissAlert,
  };
}

// ============ useBudgetTemplates ============

export function useBudgetTemplates() {
  const [templates, setTemplates] = useState<Awaited<ReturnType<typeof BudgetAPI.getBudgetTemplates>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BudgetAPI.getBudgetTemplates();
      setTemplates(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load templates';
      setError(message);
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const applyTemplate = useCallback(async (data: {
    template_id: string;
    budget_name: string;
    total_income: number;
    budget_period: BudgetPeriod;
    start_date: string;
  }): Promise<Budget | null> => {
    try {
      const budget = await BudgetAPI.applyBudgetTemplate(data);
      return budget;
    } catch (err: any) {
      Alert.alert('Error', 'Failed to apply template');
      return null;
    }
  }, []);

  return {
    templates,
    isLoading,
    error,
    refetch: fetchTemplates,
    applyTemplate,
  };
}

// ============ useBudgetTransactions ============

export function useBudgetTransactions(budgetId: string | undefined, category?: string) {
  const [transactions, setTransactions] = useState<{
    expense_id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    merchant?: string;
  }[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!budgetId) {
      setIsLoading(false);
      return;
    }

    try {
      if (pageNum === 1) setIsLoading(true);
      setError(null);

      const response = await BudgetAPI.getBudgetTransactions(budgetId, {
        category,
        page: pageNum,
        page_size: 20,
      });

      if (append) {
        setTransactions(prev => [...prev, ...response.items]);
      } else {
        setTransactions(response.items);
      }

      setTotal(response.total);
      setHasMore(pageNum * 20 < response.total);
      setPage(pageNum);
    } catch (err: any) {
      const message = err?.message || 'Failed to load transactions';
      setError(message);
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, category]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchTransactions(page + 1, true);
  }, [page, hasMore, isLoading, fetchTransactions]);

  return {
    transactions,
    total,
    isLoading,
    error,
    hasMore,
    refetch: () => fetchTransactions(1),
    loadMore,
  };
}