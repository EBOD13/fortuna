// src/api/endpoints/bill.ts
/**
 * Bill API Endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import {
  Bill,
  BillPayment,
  CreateBillRequest,
  BillCategory,
  BillFrequency,
  BillStatus,
  PaymentStatus,
} from '../types';

// ============ BILLS CRUD ============

/**
 * Get all bills for current user
 */
export async function getBills(params?: {
  status?: BillStatus;
  category?: BillCategory;
}): Promise<Bill[]> {
  return apiGet<Bill[]>('/bills', params);
}

/**
 * Get a single bill by ID
 */
export async function getBill(billId: string): Promise<Bill> {
  return apiGet<Bill>(`/bills/${billId}`);
}

/**
 * Create a new bill
 */
export async function createBill(data: CreateBillRequest): Promise<Bill> {
  return apiPost<Bill>('/bills', data);
}

/**
 * Update an existing bill
 */
export async function updateBill(
  billId: string,
  data: Partial<CreateBillRequest>
): Promise<Bill> {
  return apiPut<Bill>(`/bills/${billId}`, data);
}

/**
 * Delete a bill
 */
export async function deleteBill(billId: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/bills/${billId}`);
}

// ============ BILL STATUS ============

/**
 * Pause a bill
 */
export async function pauseBill(billId: string): Promise<Bill> {
  return apiPost<Bill>(`/bills/${billId}/pause`, {});
}

/**
 * Resume a paused bill
 */
export async function resumeBill(billId: string): Promise<Bill> {
  return apiPost<Bill>(`/bills/${billId}/resume`, {});
}

/**
 * Cancel a bill
 */
export async function cancelBill(billId: string): Promise<Bill> {
  return apiPost<Bill>(`/bills/${billId}/cancel`, {});
}

// ============ PAYMENTS ============

/**
 * Get payment history for a bill
 */
export async function getBillPayments(
  billId: string,
  params?: {
    page?: number;
    page_size?: number;
    year?: number;
  }
): Promise<{
  items: BillPayment[];
  total: number;
  page: number;
  page_size: number;
}> {
  return apiGet(`/bills/${billId}/payments`, params);
}

/**
 * Record a payment for a bill
 */
export async function recordBillPayment(
  billId: string,
  data: {
    amount: number;
    payment_date: string;
    payment_method?: string;
    confirmation_number?: string;
    was_late?: boolean;
    late_fee?: number;
    notes?: string;
  }
): Promise<BillPayment> {
  return apiPost<BillPayment>(`/bills/${billId}/payments`, data);
}

/**
 * Update a payment record
 */
export async function updateBillPayment(
  billId: string,
  paymentId: string,
  data: Partial<{
    amount: number;
    payment_date: string;
    status: PaymentStatus;
    notes: string;
  }>
): Promise<BillPayment> {
  return apiPut<BillPayment>(`/bills/${billId}/payments/${paymentId}`, data);
}

/**
 * Delete a payment record
 */
export async function deleteBillPayment(
  billId: string,
  paymentId: string
): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`/bills/${billId}/payments/${paymentId}`);
}

/**
 * Mark bill as paid (for current period)
 */
export async function markBillAsPaid(
  billId: string,
  data?: {
    amount?: number;
    payment_method?: string;
    notes?: string;
  }
): Promise<BillPayment> {
  return apiPost<BillPayment>(`/bills/${billId}/mark-paid`, data || {});
}

// ============ UPCOMING & OVERDUE ============

/**
 * Get upcoming bills
 */
export async function getUpcomingBills(days: number = 30): Promise<{
  bill_id: string;
  bill_name: string;
  payee: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  is_auto_pay: boolean;
  category: BillCategory;
}[]> {
  return apiGet('/bills/upcoming', { days });
}

/**
 * Get overdue bills
 */
export async function getOverdueBills(): Promise<{
  bill_id: string;
  bill_name: string;
  payee: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  category: BillCategory;
}[]> {
  return apiGet('/bills/overdue');
}

// ============ STATS ============

/**
 * Get bill statistics
 */
export async function getBillStats(): Promise<{
  total_monthly: number;
  total_active_bills: number;
  upcoming_7_days: number;
  upcoming_30_days: number;
  overdue_count: number;
  overdue_amount: number;
  auto_pay_count: number;
  by_category: {
    category: BillCategory;
    count: number;
    monthly_total: number;
  }[];
}> {
  return apiGet('/bills/stats');
}

/**
 * Get yearly bill summary
 */
export async function getYearlyBillSummary(year?: number): Promise<{
  year: number;
  total_paid: number;
  total_late_fees: number;
  by_month: {
    month: number;
    total: number;
    on_time: number;
    late: number;
  }[];
  by_category: {
    category: BillCategory;
    total: number;
    count: number;
  }[];
}> {
  return apiGet('/bills/yearly-summary', year ? { year } : undefined);
}

// ============ AUTO-PAY ============

/**
 * Enable auto-pay for a bill
 */
export async function enableAutoPay(
  billId: string,
  data: {
    payment_method: string;
    account_number?: string;
    pay_days_before?: number;
  }
): Promise<Bill> {
  return apiPost<Bill>(`/bills/${billId}/auto-pay/enable`, data);
}

/**
 * Disable auto-pay for a bill
 */
export async function disableAutoPay(billId: string): Promise<Bill> {
  return apiPost<Bill>(`/bills/${billId}/auto-pay/disable`, {});
}

// ============ REMINDERS ============

/**
 * Update reminder settings for a bill
 */
export async function updateBillReminders(
  billId: string,
  data: {
    reminders_enabled: boolean;
    reminder_days?: number;
  }
): Promise<Bill> {
  return apiPut<Bill>(`/bills/${billId}/reminders`, data);
}

/**
 * Get reminder schedule
 */
export async function getBillReminders(): Promise<{
  bill_id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  reminder_date: string;
  reminder_sent: boolean;
}[]> {
  return apiGet('/bills/reminders');
}

// ============ PROJECTIONS ============

/**
 * Get bill projections for upcoming months
 */
export async function getBillProjections(months: number = 3): Promise<{
  month: string;
  year: number;
  projected_total: number;
  bills: {
    bill_id: string;
    bill_name: string;
    amount: number;
    due_date: string;
  }[];
}[]> {
  return apiGet('/bills/projections', { months });
}