// src/api/types/income.ts
/**
 * Income Types - Aligned with Backend
 */

// ============ ENUMS ============

export type IncomeType = 'employment' | 'freelance' | 'business' | 'investment' | 'rental' | 'scholarship' | 'other';
export type PayStructure = 'salary' | 'hourly' | 'commission' | 'contract' | 'variable';
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'annually' | 'irregular';
export type IncomeStatus = 'active' | 'paused' | 'ended';
export type DeductionType = 'pre_tax' | 'post_tax';
export type HistoryStatus = 'confirmed' | 'pending' | 'expected';

// ============ DEDUCTION ============

export interface Deduction {
  deduction_id: string;
  deduction_name: string;
  deduction_type: DeductionType;
  amount: number;
  is_percentage: boolean;
}

export interface CreateDeductionRequest {
  deduction_name: string;
  deduction_type: DeductionType;
  amount: number;
  is_percentage: boolean;
}

// ============ INCOME SOURCE ============

export interface CreateIncomeSourceRequest {
  source_name: string;
  employer_name?: string;
  income_type: IncomeType;
  pay_structure: PayStructure;
  base_amount: number;
  hourly_rate?: number;
  expected_hours?: number;
  expected_hours_per_period?: number;
  pay_frequency: PayFrequency;
  next_payment_date?: string;
  pay_day?: number;
  max_hours_per_week?: number;
  is_taxable?: boolean;
  federal_tax_rate?: number;
  state_tax_rate?: number;
  local_tax_rate?: number;
  is_guaranteed?: boolean;
  deductions?: CreateDeductionRequest[];
  status?: IncomeStatus;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface UpdateIncomeSourceRequest {
  source_name?: string;
  employer_name?: string;
  income_type?: IncomeType;
  pay_structure?: PayStructure;
  base_amount?: number;
  hourly_rate?: number;
  expected_hours?: number;
  expected_hours_per_period?: number;
  pay_frequency?: PayFrequency;
  next_payment_date?: string;
  pay_day?: number;
  max_hours_per_week?: number;
  is_taxable?: boolean;
  federal_tax_rate?: number;
  state_tax_rate?: number;
  local_tax_rate?: number;
  is_guaranteed?: boolean;
  deductions?: CreateDeductionRequest[];
  status?: IncomeStatus;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface IncomeSource {
  income_id: string;
  source_name: string;
  employer_name?: string;
  // Type fields (backend sends both)
  income_type: IncomeType;
  source_type: IncomeType;
  pay_structure: PayStructure;
  // Amount fields (backend sends both)
  base_amount: number;
  amount: number;
  hourly_rate?: number;
  expected_hours?: number;
  // Frequency fields (backend sends both)
  pay_frequency: PayFrequency;
  frequency: PayFrequency;
  next_payment_date?: string;
  pay_day?: number;
  max_hours_per_week?: number;
  // Tax fields
  is_taxable: boolean;
  federal_tax_rate: number;
  state_tax_rate: number;
  local_tax_rate: number;
  fica_rate: number;
  total_tax_rate: number;
  // Computed values
  gross_per_period: number;
  net_per_period: number;
  taxes_per_period: number;
  monthly_gross: number;
  monthly_net: number;
  annual_gross: number;
  annual_net: number;
  // Status flags
  is_guaranteed: boolean;
  is_recurring: boolean;
  is_active: boolean;
  status: IncomeStatus;
  // Related
  deductions: Deduction[];
  // Dates
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeSourceSummary {
  income_id: string;
  source_name: string;
  source_type: IncomeType;
  pay_structure: PayStructure;
  amount: number;
  frequency: PayFrequency;
  next_payment_date?: string;
  is_active: boolean;
  monthly_net: number;
}

// ============ INCOME HISTORY ============

export interface LogIncomeRequest {
  gross_amount: number;
  net_amount?: number;
  payment_date: string;
  pay_period_start?: string;
  pay_period_end?: string;
  hours_worked?: number;
  tax_federal?: number;
  tax_state?: number;
  tax_local?: number;
  tax_fica?: number;
  notes?: string;
}

export interface IncomeHistoryEntry {
  history_id: string;
  income_id: string;
  gross_amount: number;
  net_amount: number;
  tax_federal: number;
  tax_state: number;
  tax_local: number;
  tax_fica: number;
  hours_worked?: number;
  payment_date: string;
  pay_period_start?: string;
  pay_period_end?: string;
  status: HistoryStatus;
  is_confirmed: boolean;
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

// ============ STATISTICS ============

export interface IncomeStats {
  total_monthly_gross: number;
  total_monthly_net: number;
  total_annual_gross: number;
  total_annual_net: number;
  guaranteed_monthly: number;
  variable_monthly: number;
  active_sources_count: number;
  average_tax_rate: number;
}