// src/api/endpoints/goal.ts
/**
 * Goal API Endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import {
  Goal,
  GoalMilestone,
  GoalContribution,
  CreateGoalRequest,
  GoalType,
  GoalStatus,
  GoalPriority,
} from '../types';

// ============ GOALS CRUD ============

/**
 * Get all goals for current user
 */
export async function getGoals(params?: {
  status?: GoalStatus;
  type?: GoalType;
  priority?: GoalPriority;
}): Promise<Goal[]> {
  return apiGet<Goal[]>('/goals', params);
}

/**
 * Get a single goal by ID
 */
export async function getGoal(goalId: string): Promise<Goal> {
  return apiGet<Goal>(`/goals/${goalId}`);
}

/**
 * Create a new goal
 */
export async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  return apiPost<Goal>('/goals', data);
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  goalId: string,
  data: Partial<CreateGoalRequest>
): Promise<Goal> {
  return apiPut<Goal>(`/goals/${goalId}`, data);
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/goals/${goalId}`);
}

// ============ GOAL STATUS ============

/**
 * Pause a goal
 */
export async function pauseGoal(goalId: string): Promise<Goal> {
  return apiPost<Goal>(`/goals/${goalId}/pause`, {});
}

/**
 * Resume a paused goal
 */
export async function resumeGoal(goalId: string): Promise<Goal> {
  return apiPost<Goal>(`/goals/${goalId}/resume`, {});
}

/**
 * Complete a goal
 */
export async function completeGoal(goalId: string): Promise<Goal> {
  return apiPost<Goal>(`/goals/${goalId}/complete`, {});
}

/**
 * Cancel a goal
 */
export async function cancelGoal(goalId: string): Promise<Goal> {
  return apiPost<Goal>(`/goals/${goalId}/cancel`, {});
}

// ============ CONTRIBUTIONS ============

/**
 * Get contributions for a goal
 */
export async function getGoalContributions(
  goalId: string,
  params?: {
    page?: number;
    page_size?: number;
  }
): Promise<{
  items: GoalContribution[];
  total: number;
  page: number;
  page_size: number;
}> {
  return apiGet(`/goals/${goalId}/contributions`, params);
}

/**
 * Add contribution to goal
 */
export async function addGoalContribution(
  goalId: string,
  data: {
    amount: number;
    contribution_date?: string;
    source?: string;
    notes?: string;
  }
): Promise<GoalContribution> {
  return apiPost<GoalContribution>(`/goals/${goalId}/contributions`, data);
}

/**
 * Update a contribution
 */
export async function updateGoalContribution(
  goalId: string,
  contributionId: string,
  data: Partial<{
    amount: number;
    contribution_date: string;
    notes: string;
  }>
): Promise<GoalContribution> {
  return apiPut<GoalContribution>(`/goals/${goalId}/contributions/${contributionId}`, data);
}

/**
 * Delete a contribution
 */
export async function deleteGoalContribution(
  goalId: string,
  contributionId: string
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/goals/${goalId}/contributions/${contributionId}`);
}

/**
 * Quick add contribution (simplified)
 */
export async function quickContribute(
  goalId: string,
  amount: number
): Promise<GoalContribution> {
  return apiPost<GoalContribution>(`/goals/${goalId}/quick-contribute`, { amount });
}

// ============ MILESTONES ============

/**
 * Get milestones for a goal
 */
export async function getGoalMilestones(goalId: string): Promise<GoalMilestone[]> {
  return apiGet<GoalMilestone[]>(`/goals/${goalId}/milestones`);
}

/**
 * Add milestone to goal
 */
export async function addGoalMilestone(
  goalId: string,
  data: {
    title: string;
    target_amount: number;
    target_date?: string;
    celebration_message?: string;
  }
): Promise<GoalMilestone> {
  return apiPost<GoalMilestone>(`/goals/${goalId}/milestones`, data);
}

/**
 * Update a milestone
 */
export async function updateGoalMilestone(
  goalId: string,
  milestoneId: string,
  data: Partial<{
    title: string;
    target_amount: number;
    target_date: string;
    celebration_message: string;
  }>
): Promise<GoalMilestone> {
  return apiPut<GoalMilestone>(`/goals/${goalId}/milestones/${milestoneId}`, data);
}

/**
 * Delete a milestone
 */
export async function deleteGoalMilestone(
  goalId: string,
  milestoneId: string
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/goals/${goalId}/milestones/${milestoneId}`);
}

/**
 * Mark milestone as completed
 */
export async function completeGoalMilestone(
  goalId: string,
  milestoneId: string
): Promise<GoalMilestone> {
  return apiPost<GoalMilestone>(`/goals/${goalId}/milestones/${milestoneId}/complete`, {});
}

// ============ STATS ============

/**
 * Get goal statistics
 */
export async function getGoalStats(): Promise<{
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target: number;
  total_saved: number;
  overall_progress: number;
  monthly_contribution_avg: number;
  on_track_count: number;
  behind_count: number;
}> {
  return apiGet('/goals/stats');
}

/**
 * Get progress history for a goal
 */
export async function getGoalProgressHistory(
  goalId: string,
  params?: {
    months?: number;
  }
): Promise<{
  date: string;
  amount: number;
  progress_percentage: number;
}[]> {
  return apiGet(`/goals/${goalId}/progress-history`, params);
}

// ============ PROJECTIONS ============

/**
 * Get goal projection
 */
export async function getGoalProjection(goalId: string): Promise<{
  current_amount: number;
  target_amount: number;
  monthly_contribution: number;
  projected_completion_date: string;
  on_track: boolean;
  months_remaining: number;
  required_monthly_to_meet_deadline: number;
  shortfall_or_surplus: number;
}> {
  return apiGet(`/goals/${goalId}/projection`);
}

/**
 * Get all goals projections
 */
export async function getAllGoalProjections(): Promise<{
  goal_id: string;
  goal_name: string;
  progress: number;
  on_track: boolean;
  projected_completion_date: string;
  status: 'ahead' | 'on_track' | 'behind' | 'at_risk';
}[]> {
  return apiGet('/goals/projections');
}

// ============ RECOMMENDATIONS ============

/**
 * Get contribution recommendations
 */
export async function getContributionRecommendations(): Promise<{
  goal_id: string;
  goal_name: string;
  current_monthly: number;
  recommended_monthly: number;
  reason: string;
  priority_score: number;
}[]> {
  return apiGet('/goals/recommendations');
}

/**
 * Get goal suggestions based on spending patterns
 */
export async function getGoalSuggestions(): Promise<{
  suggested_type: GoalType;
  suggested_name: string;
  suggested_amount: number;
  reasoning: string;
  monthly_contribution: number;
}[]> {
  return apiGet('/goals/suggestions');
}

// ============ QUICK GOALS ============

/**
 * Create emergency fund goal
 */
export async function createEmergencyFundGoal(data: {
  monthly_expenses: number;
  months_to_cover?: number; // default 6
}): Promise<Goal> {
  return apiPost<Goal>('/goals/quick/emergency-fund', data);
}

/**
 * Create vacation goal
 */
export async function createVacationGoal(data: {
  destination?: string;
  target_amount: number;
  target_date: string;
}): Promise<Goal> {
  return apiPost<Goal>('/goals/quick/vacation', data);
}

/**
 * Create debt payoff goal
 */
export async function createDebtPayoffGoal(data: {
  debt_name: string;
  total_debt: number;
  interest_rate?: number;
  minimum_payment?: number;
}): Promise<Goal> {
  return apiPost<Goal>('/goals/quick/debt-payoff', data);
}