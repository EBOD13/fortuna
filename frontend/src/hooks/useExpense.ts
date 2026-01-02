// src/hooks/useExpense.ts
/**
 * useExpense Hooks
 * Manages expense data fetching, caching, and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ExpenseAPI from '../api/endpoints/expense';
import {
  Expense,
  CreateExpenseRequest,
  ExpenseFilters,
  ExpenseCategory,
  EmotionType,
} from '../api/types';

// ============ TYPES ============

interface UseExpensesResult {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createExpense: (data: CreateExpenseRequest) => Promise<Expense | null>;
  updateExpense: (id: string, data: Partial<CreateExpenseRequest>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
}

interface UseExpenseResult {
  expense: Expense | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateExpense: (data: Partial<CreateExpenseRequest>) => Promise<Expense | null>;
  deleteExpense: () => Promise<boolean>;
  addReflection: (prompt: string, response: string) => Promise<boolean>;
  updateSatisfaction: (rating: number) => Promise<boolean>;
}

interface UseExpenseStatsResult {
  stats: {
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
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============ useExpenses ============

export function useExpenses(filters?: ExpenseFilters): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchExpenses = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      setError(null);

      const response = await ExpenseAPI.getExpenses({
        ...filters,
        page: pageNum,
        page_size: 20,
      });

      if (append) {
        setExpenses(prev => [...prev, ...response.items]);
      } else {
        setExpenses(response.items);
      }
      
      setHasMore(pageNum < response.total_pages);
      setPage(pageNum);
    } catch (err: any) {
      const message = err?.message || 'Failed to load expenses';
      setError(message);
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchExpenses(page + 1, true);
  }, [page, hasMore, isLoading, fetchExpenses]);

  const createExpense = useCallback(async (data: CreateExpenseRequest): Promise<Expense | null> => {
    try {
      const newExpense = await ExpenseAPI.createExpense(data);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err: any) {
      const message = err?.message || 'Failed to create expense';
      Alert.alert('Error', message);
      console.error('Error creating expense:', err);
      return null;
    }
  }, []);

  const updateExpense = useCallback(async (
    id: string,
    data: Partial<CreateExpenseRequest>
  ): Promise<Expense | null> => {
    try {
      const updated = await ExpenseAPI.updateExpense(id, data);
      setExpenses(prev => prev.map(e => e.expense_id === id ? updated : e));
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update expense';
      Alert.alert('Error', message);
      console.error('Error updating expense:', err);
      return null;
    }
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      await ExpenseAPI.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.expense_id !== id));
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete expense';
      Alert.alert('Error', message);
      console.error('Error deleting expense:', err);
      return false;
    }
  }, []);

  return {
    expenses,
    isLoading,
    error,
    hasMore,
    refetch: () => fetchExpenses(1),
    loadMore,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

// ============ useExpense (single) ============

export function useExpense(expenseId: string | undefined): UseExpenseResult {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    if (!expenseId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await ExpenseAPI.getExpense(expenseId);
      setExpense(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load expense';
      setError(message);
      console.error('Error fetching expense:', err);
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const updateExpense = useCallback(async (
    data: Partial<CreateExpenseRequest>
  ): Promise<Expense | null> => {
    if (!expenseId) return null;

    try {
      const updated = await ExpenseAPI.updateExpense(expenseId, data);
      setExpense(updated);
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update expense';
      Alert.alert('Error', message);
      console.error('Error updating expense:', err);
      return null;
    }
  }, [expenseId]);

  const deleteExpense = useCallback(async (): Promise<boolean> => {
    if (!expenseId) return false;

    try {
      await ExpenseAPI.deleteExpense(expenseId);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete expense';
      Alert.alert('Error', message);
      console.error('Error deleting expense:', err);
      return false;
    }
  }, [expenseId]);

  const addReflection = useCallback(async (
    prompt: string,
    response: string
  ): Promise<boolean> => {
    if (!expenseId) return false;

    try {
      const updated = await ExpenseAPI.addExpenseReflection(expenseId, { prompt, response });
      setExpense(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to add reflection';
      Alert.alert('Error', message);
      console.error('Error adding reflection:', err);
      return false;
    }
  }, [expenseId]);

  const updateSatisfaction = useCallback(async (rating: number): Promise<boolean> => {
    if (!expenseId) return false;

    try {
      const updated = await ExpenseAPI.updateSatisfactionRating(expenseId, rating);
      setExpense(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to update satisfaction';
      Alert.alert('Error', message);
      console.error('Error updating satisfaction:', err);
      return false;
    }
  }, [expenseId]);

  return {
    expense,
    isLoading,
    error,
    refetch: fetchExpense,
    updateExpense,
    deleteExpense,
    addReflection,
    updateSatisfaction,
  };
}

// ============ useExpenseStats ============

export function useExpenseStats(params?: {
  start_date?: string;
  end_date?: string;
}): UseExpenseStatsResult {
  const [stats, setStats] = useState<UseExpenseStatsResult['stats']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ExpenseAPI.getExpenseStats(params);
      setStats(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load expense stats';
      setError(message);
      console.error('Error fetching expense stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.start_date, params?.end_date]);

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

// ============ useRecentExpenses ============

export function useRecentExpenses(limit: number = 10) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ExpenseAPI.getRecentExpenses(limit);
      setExpenses(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load recent expenses';
      setError(message);
      console.error('Error fetching recent expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return {
    expenses,
    isLoading,
    error,
    refetch: fetchRecent,
  };
}

// ============ useTodayExpenses ============

export function useTodayExpenses() {
  const [data, setData] = useState<{
    expenses: Expense[];
    total: number;
    count: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToday = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ExpenseAPI.getTodayExpenses();
      setData(result);
    } catch (err: any) {
      const message = err?.message || 'Failed to load today\'s expenses';
      setError(message);
      console.error('Error fetching today\'s expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  return {
    expenses: data?.expenses || [],
    total: data?.total || 0,
    count: data?.count || 0,
    isLoading,
    error,
    refetch: fetchToday,
  };
}

// ============ useCreateExpense ============

interface UseCreateExpenseResult {
  isSubmitting: boolean;
  createExpense: (data: CreateExpenseRequest) => Promise<Expense | null>;
  quickAdd: (data: {
    amount: number;
    description: string;
    category: ExpenseCategory;
    emotion?: EmotionType;
  }) => Promise<Expense | null>;
}

export function useCreateExpense(): UseCreateExpenseResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createExpense = useCallback(async (data: CreateExpenseRequest): Promise<Expense | null> => {
    try {
      setIsSubmitting(true);
      const expense = await ExpenseAPI.createExpense(data);
      return expense;
    } catch (err: any) {
      const message = err?.message || 'Failed to create expense';
      Alert.alert('Error', message);
      console.error('Error creating expense:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const quickAdd = useCallback(async (data: {
    amount: number;
    description: string;
    category: ExpenseCategory;
    emotion?: EmotionType;
  }): Promise<Expense | null> => {
    try {
      setIsSubmitting(true);
      const expense = await ExpenseAPI.quickAddExpense(data);
      return expense;
    } catch (err: any) {
      const message = err?.message || 'Failed to add expense';
      Alert.alert('Error', message);
      console.error('Error quick adding expense:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    createExpense,
    quickAdd,
  };
}

// ============ useEmotionalAnalysis ============

export function useEmotionalAnalysis(params?: {
  start_date?: string;
  end_date?: string;
}) {
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof ExpenseAPI.getEmotionalSpendingAnalysis>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ExpenseAPI.getEmotionalSpendingAnalysis(params);
      setAnalysis(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load emotional analysis';
      setError(message);
      console.error('Error fetching emotional analysis:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.start_date, params?.end_date]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysis,
    isLoading,
    error,
    refetch: fetchAnalysis,
  };
}

// ============ useMonthlyExpenses ============

export function useMonthlyExpenses(year: number, month: number) {
  const [data, setData] = useState<Awaited<ReturnType<typeof ExpenseAPI.getMonthlyExpenses>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ExpenseAPI.getMonthlyExpenses(year, month);
      setData(result);
    } catch (err: any) {
      const message = err?.message || 'Failed to load monthly expenses';
      setError(message);
      console.error('Error fetching monthly expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchMonthly();
  }, [fetchMonthly]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchMonthly,
  };
}

// ============ useRecurringExpenses ============

export function useRecurringExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurring = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ExpenseAPI.getRecurringExpenses();
      setExpenses(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load recurring expenses';
      setError(message);
      console.error('Error fetching recurring expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const skipNext = useCallback(async (expenseId: string): Promise<boolean> => {
    try {
      const updated = await ExpenseAPI.skipRecurringExpense(expenseId);
      setExpenses(prev => prev.map(e => e.expense_id === expenseId ? updated : e));
      return true;
    } catch (err: any) {
      Alert.alert('Error', 'Failed to skip expense');
      return false;
    }
  }, []);

  const stopRecurring = useCallback(async (expenseId: string): Promise<boolean> => {
    try {
      await ExpenseAPI.stopRecurringExpense(expenseId);
      setExpenses(prev => prev.filter(e => e.expense_id !== expenseId));
      return true;
    } catch (err: any) {
      Alert.alert('Error', 'Failed to stop recurring expense');
      return false;
    }
  }, []);

  return {
    expenses,
    isLoading,
    error,
    refetch: fetchRecurring,
    skipNext,
    stopRecurring,
  };
}