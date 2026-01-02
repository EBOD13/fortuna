// src/hooks/useGoal.ts
/**
 * useGoal Hooks
 * Manages goal data fetching, caching, and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as GoalAPI from '../api/endpoints/goal';
import {
  Goal,
  GoalMilestone,
  GoalContribution,
  CreateGoalRequest,
  GoalType,
  GoalStatus,
  GoalPriority,
} from '../api/types';

// ============ TYPES ============

interface UseGoalsResult {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGoal: (data: CreateGoalRequest) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
}

interface UseGoalResult {
  goal: Goal | null;
  contributions: GoalContribution[];
  milestones: GoalMilestone[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateGoal: (data: Partial<CreateGoalRequest>) => Promise<Goal | null>;
  deleteGoal: () => Promise<boolean>;
  addContribution: (amount: number, notes?: string) => Promise<GoalContribution | null>;
  pauseGoal: () => Promise<boolean>;
  resumeGoal: () => Promise<boolean>;
  completeGoal: () => Promise<boolean>;
}

// ============ useGoals ============

export function useGoals(params?: {
  status?: GoalStatus;
  type?: GoalType;
  priority?: GoalPriority;
}): UseGoalsResult {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await GoalAPI.getGoals(params);
      setGoals(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load goals';
      setError(message);
      console.error('Error fetching goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.type, params?.priority]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (data: CreateGoalRequest): Promise<Goal | null> => {
    try {
      const newGoal = await GoalAPI.createGoal(data);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err: any) {
      const message = err?.message || 'Failed to create goal';
      Alert.alert('Error', message);
      console.error('Error creating goal:', err);
      return null;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      await GoalAPI.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.goal_id !== id));
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete goal';
      Alert.alert('Error', message);
      console.error('Error deleting goal:', err);
      return false;
    }
  }, []);

  return {
    goals,
    isLoading,
    error,
    refetch: fetchGoals,
    createGoal,
    deleteGoal,
  };
}

// ============ useGoal (single) ============

export function useGoal(goalId: string | undefined): UseGoalResult {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = useCallback(async () => {
    if (!goalId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [goalData, contributionsData, milestonesData] = await Promise.all([
        GoalAPI.getGoal(goalId),
        GoalAPI.getGoalContributions(goalId, { page_size: 20 }),
        GoalAPI.getGoalMilestones(goalId),
      ]);

      setGoal(goalData);
      setContributions(contributionsData.items);
      setMilestones(milestonesData);
    } catch (err: any) {
      const message = err?.message || 'Failed to load goal';
      setError(message);
      console.error('Error fetching goal:', err);
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const updateGoal = useCallback(async (
    data: Partial<CreateGoalRequest>
  ): Promise<Goal | null> => {
    if (!goalId) return null;

    try {
      const updated = await GoalAPI.updateGoal(goalId, data);
      setGoal(updated);
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update goal';
      Alert.alert('Error', message);
      console.error('Error updating goal:', err);
      return null;
    }
  }, [goalId]);

  const deleteGoal = useCallback(async (): Promise<boolean> => {
    if (!goalId) return false;

    try {
      await GoalAPI.deleteGoal(goalId);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete goal';
      Alert.alert('Error', message);
      console.error('Error deleting goal:', err);
      return false;
    }
  }, [goalId]);

  const addContribution = useCallback(async (
    amount: number,
    notes?: string
  ): Promise<GoalContribution | null> => {
    if (!goalId) return null;

    try {
      const contribution = await GoalAPI.addGoalContribution(goalId, {
        amount,
        notes,
      });
      setContributions(prev => [contribution, ...prev]);
      // Refetch goal to get updated amounts
      await fetchGoal();
      return contribution;
    } catch (err: any) {
      const message = err?.message || 'Failed to add contribution';
      Alert.alert('Error', message);
      console.error('Error adding contribution:', err);
      return null;
    }
  }, [goalId, fetchGoal]);

  const pauseGoal = useCallback(async (): Promise<boolean> => {
    if (!goalId) return false;

    try {
      const updated = await GoalAPI.pauseGoal(goalId);
      setGoal(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to pause goal';
      Alert.alert('Error', message);
      console.error('Error pausing goal:', err);
      return false;
    }
  }, [goalId]);

  const resumeGoal = useCallback(async (): Promise<boolean> => {
    if (!goalId) return false;

    try {
      const updated = await GoalAPI.resumeGoal(goalId);
      setGoal(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to resume goal';
      Alert.alert('Error', message);
      console.error('Error resuming goal:', err);
      return false;
    }
  }, [goalId]);

  const completeGoal = useCallback(async (): Promise<boolean> => {
    if (!goalId) return false;

    try {
      const updated = await GoalAPI.completeGoal(goalId);
      setGoal(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to complete goal';
      Alert.alert('Error', message);
      console.error('Error completing goal:', err);
      return false;
    }
  }, [goalId]);

  return {
    goal,
    contributions,
    milestones,
    isLoading,
    error,
    refetch: fetchGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    pauseGoal,
    resumeGoal,
    completeGoal,
  };
}

// ============ useGoalStats ============

export function useGoalStats() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof GoalAPI.getGoalStats>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await GoalAPI.getGoalStats();
      setStats(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load goal stats';
      setError(message);
      console.error('Error fetching goal stats:', err);
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

// ============ useCreateGoal ============

interface UseCreateGoalResult {
  isSubmitting: boolean;
  createGoal: (data: CreateGoalRequest) => Promise<Goal | null>;
  createEmergencyFund: (monthlyExpenses: number, monthsToCover?: number) => Promise<Goal | null>;
  createVacationGoal: (data: { destination?: string; target_amount: number; target_date: string }) => Promise<Goal | null>;
  createDebtPayoffGoal: (data: { debt_name: string; total_debt: number }) => Promise<Goal | null>;
}

export function useCreateGoal(): UseCreateGoalResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createGoal = useCallback(async (data: CreateGoalRequest): Promise<Goal | null> => {
    try {
      setIsSubmitting(true);
      const goal = await GoalAPI.createGoal(data);
      return goal;
    } catch (err: any) {
      const message = err?.message || 'Failed to create goal';
      Alert.alert('Error', message);
      console.error('Error creating goal:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const createEmergencyFund = useCallback(async (
    monthlyExpenses: number,
    monthsToCover: number = 6
  ): Promise<Goal | null> => {
    try {
      setIsSubmitting(true);
      const goal = await GoalAPI.createEmergencyFundGoal({
        monthly_expenses: monthlyExpenses,
        months_to_cover: monthsToCover,
      });
      return goal;
    } catch (err: any) {
      const message = err?.message || 'Failed to create emergency fund';
      Alert.alert('Error', message);
      console.error('Error creating emergency fund:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const createVacationGoal = useCallback(async (data: {
    destination?: string;
    target_amount: number;
    target_date: string;
  }): Promise<Goal | null> => {
    try {
      setIsSubmitting(true);
      const goal = await GoalAPI.createVacationGoal(data);
      return goal;
    } catch (err: any) {
      const message = err?.message || 'Failed to create vacation goal';
      Alert.alert('Error', message);
      console.error('Error creating vacation goal:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const createDebtPayoffGoal = useCallback(async (data: {
    debt_name: string;
    total_debt: number;
  }): Promise<Goal | null> => {
    try {
      setIsSubmitting(true);
      const goal = await GoalAPI.createDebtPayoffGoal(data);
      return goal;
    } catch (err: any) {
      const message = err?.message || 'Failed to create debt payoff goal';
      Alert.alert('Error', message);
      console.error('Error creating debt payoff goal:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    createGoal,
    createEmergencyFund,
    createVacationGoal,
    createDebtPayoffGoal,
  };
}

// ============ useGoalProjection ============

export function useGoalProjection(goalId: string | undefined) {
  const [projection, setProjection] = useState<Awaited<ReturnType<typeof GoalAPI.getGoalProjection>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = useCallback(async () => {
    if (!goalId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await GoalAPI.getGoalProjection(goalId);
      setProjection(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load projection';
      setError(message);
      console.error('Error fetching projection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

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

// ============ useGoalRecommendations ============

export function useGoalRecommendations() {
  const [recommendations, setRecommendations] = useState<Awaited<ReturnType<typeof GoalAPI.getContributionRecommendations>>>([]);
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof GoalAPI.getGoalSuggestions>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [recData, sugData] = await Promise.all([
        GoalAPI.getContributionRecommendations(),
        GoalAPI.getGoalSuggestions(),
      ]);

      setRecommendations(recData);
      setSuggestions(sugData);
    } catch (err: any) {
      const message = err?.message || 'Failed to load recommendations';
      setError(message);
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    suggestions,
    isLoading,
    error,
    refetch: fetchRecommendations,
  };
}

// ============ useGoalProgressHistory ============

export function useGoalProgressHistory(goalId: string | undefined, months: number = 12) {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof GoalAPI.getGoalProgressHistory>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!goalId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await GoalAPI.getGoalProgressHistory(goalId, { months });
      setHistory(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load progress history';
      setError(message);
      console.error('Error fetching progress history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [goalId, months]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}