// src/api/endpoints/income.ts
/**
 * Income API Endpoints
 */

import client from '../client';
import type {
  IncomeSource,
  IncomeSourceSummary,
  IncomeHistoryEntry,
  IncomeStats,
  CreateIncomeSourceRequest,
  UpdateIncomeSourceRequest,
  LogIncomeRequest,
  Deduction,
  CreateDeductionRequest,
  IncomeType,
  IncomeStatus,
} from '../types/income';

const BASE = '/income';

// ============ INCOME SOURCES ============

export async function getIncomeSources(filters?: {
  status?: IncomeStatus;
  income_type?: IncomeType;
}): Promise<IncomeSourceSummary[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.income_type) params.append('income_type', filters.income_type);
  const query = params.toString();
  const url = query ? `${BASE}/sources?${query}` : `${BASE}/sources`;
  const response = await client.get(url);
  return response.data;
}

export async function getIncomeSource(incomeId: string): Promise<IncomeSource> {
  const response = await client.get(`${BASE}/sources/${incomeId}`);
  return response.data;
}

export async function createIncomeSource(data: CreateIncomeSourceRequest): Promise<IncomeSource> {
  const response = await client.post(`${BASE}/sources`, data);
  return response.data;
}

export async function updateIncomeSource(incomeId: string, data: UpdateIncomeSourceRequest): Promise<IncomeSource> {
  const response = await client.put(`${BASE}/sources/${incomeId}`, data);
  return response.data;
}

export async function deleteIncomeSource(incomeId: string, permanent = false): Promise<void> {
  await client.delete(`${BASE}/sources/${incomeId}?permanent=${permanent}`);
}

// ============ DEDUCTIONS ============

export async function addDeduction(incomeId: string, data: CreateDeductionRequest): Promise<Deduction> {
  const response = await client.post(`${BASE}/sources/${incomeId}/deductions`, data);
  return response.data;
}

export async function removeDeduction(deductionId: string): Promise<void> {
  await client.delete(`${BASE}/deductions/${deductionId}`);
}

// ============ HISTORY ============

export async function logIncomePayment(incomeId: string, data: LogIncomeRequest): Promise<IncomeHistoryEntry> {
  const response = await client.post(`${BASE}/sources/${incomeId}/log`, data);
  return response.data;
}

export async function getIncomeHistory(
  incomeId: string,
  params?: { limit?: number }
): Promise<IncomeHistoryEntry[]> {
  const query = params?.limit ? `?limit=${params.limit}` : '';
  const response = await client.get(`${BASE}/sources/${incomeId}/history${query}`);
  return response.data;
}

export async function confirmIncomePayment(historyId: string): Promise<IncomeHistoryEntry> {
  const response = await client.post(`${BASE}/history/${historyId}/confirm`);
  return response.data;
}

// ============ STATS ============

export async function getIncomeStats(): Promise<IncomeStats> {
  const response = await client.get(`${BASE}/stats`);
  return response.data;
}