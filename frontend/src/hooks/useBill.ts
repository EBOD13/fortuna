// src/hooks/useBill.ts
/**
 * useBill Hooks
 * Manages bill data fetching, caching, and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as BillAPI from '../api/endpoints/bill';
import {
  Bill,
  BillPayment,
  CreateBillRequest,
  BillCategory,
  BillStatus,
} from '../api/types';

// ============ TYPES ============

interface UseBillsResult {
  bills: Bill[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createBill: (data: CreateBillRequest) => Promise<Bill | null>;
  deleteBill: (id: string) => Promise<boolean>;
}

interface UseBillResult {
  bill: Bill | null;
  payments: BillPayment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateBill: (data: Partial<CreateBillRequest>) => Promise<Bill | null>;
  deleteBill: () => Promise<boolean>;
  markAsPaid: (data?: { amount?: number; notes?: string }) => Promise<BillPayment | null>;
  pauseBill: () => Promise<boolean>;
  resumeBill: () => Promise<boolean>;
}

// ============ useBills ============

export function useBills(params?: {
  status?: BillStatus;
  category?: BillCategory;
}): UseBillsResult {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BillAPI.getBills(params);
      setBills(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load bills';
      setError(message);
      console.error('Error fetching bills:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.category]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const createBill = useCallback(async (data: CreateBillRequest): Promise<Bill | null> => {
    try {
      const newBill = await BillAPI.createBill(data);
      setBills(prev => [...prev, newBill]);
      return newBill;
    } catch (err: any) {
      const message = err?.message || 'Failed to create bill';
      Alert.alert('Error', message);
      console.error('Error creating bill:', err);
      return null;
    }
  }, []);

  const deleteBill = useCallback(async (id: string): Promise<boolean> => {
    try {
      await BillAPI.deleteBill(id);
      setBills(prev => prev.filter(b => b.bill_id !== id));
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete bill';
      Alert.alert('Error', message);
      console.error('Error deleting bill:', err);
      return false;
    }
  }, []);

  return {
    bills,
    isLoading,
    error,
    refetch: fetchBills,
    createBill,
    deleteBill,
  };
}

// ============ useBill (single) ============

export function useBill(billId: string | undefined): UseBillResult {
  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBill = useCallback(async () => {
    if (!billId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [billData, paymentsData] = await Promise.all([
        BillAPI.getBill(billId),
        BillAPI.getBillPayments(billId, { page_size: 12 }),
      ]);

      setBill(billData);
      setPayments(paymentsData.items);
    } catch (err: any) {
      const message = err?.message || 'Failed to load bill';
      setError(message);
      console.error('Error fetching bill:', err);
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  const updateBill = useCallback(async (
    data: Partial<CreateBillRequest>
  ): Promise<Bill | null> => {
    if (!billId) return null;

    try {
      const updated = await BillAPI.updateBill(billId, data);
      setBill(updated);
      return updated;
    } catch (err: any) {
      const message = err?.message || 'Failed to update bill';
      Alert.alert('Error', message);
      console.error('Error updating bill:', err);
      return null;
    }
  }, [billId]);

  const deleteBill = useCallback(async (): Promise<boolean> => {
    if (!billId) return false;

    try {
      await BillAPI.deleteBill(billId);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to delete bill';
      Alert.alert('Error', message);
      console.error('Error deleting bill:', err);
      return false;
    }
  }, [billId]);

  const markAsPaid = useCallback(async (data?: {
    amount?: number;
    notes?: string;
  }): Promise<BillPayment | null> => {
    if (!billId) return null;

    try {
      const payment = await BillAPI.markBillAsPaid(billId, data);
      setPayments(prev => [payment, ...prev]);
      // Refetch bill to get updated next_due_date
      await fetchBill();
      return payment;
    } catch (err: any) {
      const message = err?.message || 'Failed to mark bill as paid';
      Alert.alert('Error', message);
      console.error('Error marking bill as paid:', err);
      return null;
    }
  }, [billId, fetchBill]);

  const pauseBill = useCallback(async (): Promise<boolean> => {
    if (!billId) return false;

    try {
      const updated = await BillAPI.pauseBill(billId);
      setBill(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to pause bill';
      Alert.alert('Error', message);
      console.error('Error pausing bill:', err);
      return false;
    }
  }, [billId]);

  const resumeBill = useCallback(async (): Promise<boolean> => {
    if (!billId) return false;

    try {
      const updated = await BillAPI.resumeBill(billId);
      setBill(updated);
      return true;
    } catch (err: any) {
      const message = err?.message || 'Failed to resume bill';
      Alert.alert('Error', message);
      console.error('Error resuming bill:', err);
      return false;
    }
  }, [billId]);

  return {
    bill,
    payments,
    isLoading,
    error,
    refetch: fetchBill,
    updateBill,
    deleteBill,
    markAsPaid,
    pauseBill,
    resumeBill,
  };
}

// ============ useBillStats ============

export function useBillStats() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof BillAPI.getBillStats>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BillAPI.getBillStats();
      setStats(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load bill stats';
      setError(message);
      console.error('Error fetching bill stats:', err);
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

// ============ useUpcomingBills ============

export function useUpcomingBills(days: number = 30) {
  const [bills, setBills] = useState<Awaited<ReturnType<typeof BillAPI.getUpcomingBills>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BillAPI.getUpcomingBills(days);
      setBills(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load upcoming bills';
      setError(message);
      console.error('Error fetching upcoming bills:', err);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  return {
    bills,
    isLoading,
    error,
    refetch: fetchUpcoming,
  };
}

// ============ useOverdueBills ============

export function useOverdueBills() {
  const [bills, setBills] = useState<Awaited<ReturnType<typeof BillAPI.getOverdueBills>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverdue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BillAPI.getOverdueBills();
      setBills(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load overdue bills';
      setError(message);
      console.error('Error fetching overdue bills:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdue();
  }, [fetchOverdue]);

  return {
    bills,
    isLoading,
    error,
    refetch: fetchOverdue,
  };
}

// ============ useCreateBill ============

interface UseCreateBillResult {
  isSubmitting: boolean;
  createBill: (data: CreateBillRequest) => Promise<Bill | null>;
}

export function useCreateBill(): UseCreateBillResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBill = useCallback(async (data: CreateBillRequest): Promise<Bill | null> => {
    try {
      setIsSubmitting(true);
      const bill = await BillAPI.createBill(data);
      return bill;
    } catch (err: any) {
      const message = err?.message || 'Failed to create bill';
      Alert.alert('Error', message);
      console.error('Error creating bill:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    createBill,
  };
}

// ============ useBillProjections ============

export function useBillProjections(months: number = 3) {
  const [projections, setProjections] = useState<Awaited<ReturnType<typeof BillAPI.getBillProjections>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BillAPI.getBillProjections(months);
      setProjections(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load projections';
      setError(message);
      console.error('Error fetching projections:', err);
    } finally {
      setIsLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  return {
    projections,
    isLoading,
    error,
    refetch: fetchProjections,
  };
}

// ============ useYearlyBillSummary ============

export function useYearlyBillSummary(year?: number) {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof BillAPI.getYearlyBillSummary>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BillAPI.getYearlyBillSummary(year);
      setSummary(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load yearly summary';
      setError(message);
      console.error('Error fetching yearly summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

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