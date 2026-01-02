// src/hooks/useIncome.ts
/**
 * Income Hooks
 */

// import { useState, useEffect, useCallback } from 'react';
// import { Alert } from 'react-native';
// import * as IncomeAPI from '../api/endpoints/income';
// import type {
//   IncomeSource,
//   IncomeSourceSummary,
//   IncomeHistoryEntry,
//   IncomeStats,
//   CreateIncomeSourceRequest,
//   UpdateIncomeSourceRequest,
//   LogIncomeRequest,
//   Deduction,
//   CreateDeductionRequest,
//   IncomeType,
//   IncomeStatus,
// } from '../api/types/income';

// // ============ useIncomeSources ============

// export function useIncomeSources(filters?: { status?: IncomeStatus; income_type?: IncomeType }) {
//   const [sources, setSources] = useState<IncomeSourceSummary[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchSources = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const data = await IncomeAPI.getIncomeSources(filters);
//       setSources(data);
//     } catch (err: any) {
//       setError(err?.message || 'Failed to load income sources');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [filters?.status, filters?.income_type]);

//   useEffect(() => {
//     fetchSources();
//   }, [fetchSources]);

//   const createSource = async (data: CreateIncomeSourceRequest) => {
//     try {
//       const newSource = await IncomeAPI.createIncomeSource(data);
//       await fetchSources();
//       return newSource;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to create income source');
//       return null;
//     }
//   };

//   const deleteSource = async (id: string, permanent = false) => {
//     try {
//       await IncomeAPI.deleteIncomeSource(id, permanent);
//       setSources(prev => prev.filter(s => s.income_id !== id));
//       return true;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to delete income source');
//       return false;
//     }
//   };

//   return { sources, isLoading, error, refetch: fetchSources, createSource, deleteSource };
// }

// // ============ useIncomeSource ============

// export function useIncomeSource(incomeId: string | undefined) {
//   const [source, setSource] = useState<IncomeSource | null>(null);
//   const [history, setHistory] = useState<IncomeHistoryEntry[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchData = useCallback(async () => {
//     if (!incomeId) {
//       setIsLoading(false);
//       return;
//     }
//     try {
//       setIsLoading(true);
//       setError(null);
//       const [sourceData, historyData] = await Promise.all([
//         IncomeAPI.getIncomeSource(incomeId),
//         IncomeAPI.getIncomeHistory(incomeId, { limit: 50 }).catch(() => []),
//       ]);
//       setSource(sourceData);
//       setHistory(historyData);
//     } catch (err: any) {
//       setError(err?.message || 'Failed to load income source');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [incomeId]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const updateSource = async (data: UpdateIncomeSourceRequest) => {
//     if (!incomeId) return null;
//     try {
//       const updated = await IncomeAPI.updateIncomeSource(incomeId, data);
//       setSource(updated);
//       return updated;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to update');
//       return null;
//     }
//   };

//   const deleteSource = async (permanent = false) => {
//     if (!incomeId) return false;
//     try {
//       await IncomeAPI.deleteIncomeSource(incomeId, permanent);
//       return true;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to delete');
//       return false;
//     }
//   };

//   const logPayment = async (data: LogIncomeRequest) => {
//     if (!incomeId) return null;
//     try {
//       const entry = await IncomeAPI.logIncomePayment(incomeId, data);
//       await fetchData();
//       return entry;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to log payment');
//       return null;
//     }
//   };

//   const confirmPayment = async (historyId: string) => {
//     try {
//       const updated = await IncomeAPI.confirmIncomePayment(historyId);
//       setHistory(prev => prev.map(h => h.history_id === historyId ? updated : h));
//       return updated;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to confirm');
//       return null;
//     }
//   };

//   return {
//     source,
//     history,
//     isLoading,
//     error,
//     refetch: fetchData,
//     updateSource,
//     deleteSource,
//     logPayment,
//     confirmPayment,
//   };
// }

// // ============ useIncomeStats ============

// export function useIncomeStats() {
//   const [stats, setStats] = useState<IncomeStats | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchStats = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const data = await IncomeAPI.getIncomeStats();
//       setStats(data);
//     } catch (err: any) {
//       setError(err?.message || 'Failed to load stats');
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchStats();
//   }, [fetchStats]);

//   return { stats, isLoading, error, refetch: fetchStats };
// }

// // ============ useCreateIncome ============

// export function useCreateIncome() {
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const createSource = async (data: CreateIncomeSourceRequest) => {
//     try {
//       setIsSubmitting(true);
//       const source = await IncomeAPI.createIncomeSource(data);
//       return source;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to create income source');
//       return null;
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return { isSubmitting, createSource };
// }

// // ============ useLogIncome ============

// export function useLogIncome() {
//   const [sources, setSources] = useState<IncomeSourceSummary[]>([]);
//   const [isLoadingSources, setIsLoadingSources] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     const fetch = async () => {
//       try {
//         const data = await IncomeAPI.getIncomeSources({ status: 'active' });
//         setSources(data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setIsLoadingSources(false);
//       }
//     };
//     fetch();
//   }, []);

//   const logPayment = async (incomeId: string, data: LogIncomeRequest) => {
//     try {
//       setIsSubmitting(true);
//       const entry = await IncomeAPI.logIncomePayment(incomeId, data);
//       return entry;
//     } catch (err: any) {
//       Alert.alert('Error', err?.message || 'Failed to log payment');
//       return null;
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return { sources, isLoadingSources, isSubmitting, logPayment };
// }

// src/hooks/useIncome.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchIncomes,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
} from '../api/income';
import { IncomeSource } from '../types/income';

// ----------- Fetch all incomes -----------
export function useIncomes() {
  return useQuery<IncomeSource[]>({queryKey: ['incomes'], queryFn: fetchIncomes});
}

// ----------- Create income -----------
export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IncomeSource>) => createIncomeSource(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
  });
}

// ----------- Update income -----------
export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncomeSource> }) =>
      updateIncomeSource(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
  });
}

// ----------- Delete income -----------
export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIncomeSource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
  });
}
