// src/api/types/income.ts
/**
 * Income Types - Aligned with Backend
 */

// ============ ENUMS ============

export type IncomeType = 
  | 'employment' 
  | 'freelance' 
  | 'business' 
  | 'investment' 
  | 'rental' 
  | 'scholarship' 
  | 'other';

export type PayStructure = 
  | 'salary' 
  | 'hourly' 
  | 'commission' 
  | 'contract' 
  | 'variable';

export type PayFrequency = 
  | 'weekly' 
  | 'biweekly' 
  | 'semimonthly' 
  | 'monthly' 
  | 'quarterly' 
  | 'annually' 
  | 'irregular';

export type IncomeStatus = 'active' | 'paused' | 'ended';

export type DeductionType = 'pre_tax' | 'post_tax';

export type HistoryStatus = 'confirmed' | 'pending' | 'expected' | 'missed';

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
  pay_frequency: PayFrequency;
  next_payment_date?: string;
  pay_day?: number;
  max_hours_per_week?: number;
  expected_hours_per_period?: number;
  is_taxable?: boolean;
  federal_tax_rate?: number;
  state_tax_rate?: number;
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
  pay_frequency?: PayFrequency;
  next_payment_date?: string;
  pay_day?: number;
  max_hours_per_week?: number;
  expected_hours_per_period?: number;
  is_taxable?: boolean;
  federal_tax_rate?: number;
  state_tax_rate?: number;
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
  income_type: IncomeType;
  source_type?: IncomeType;  // Alias from backend
  pay_structure: PayStructure;
  base_amount: number;
  amount?: number;  // Database column name
  hourly_rate?: number;
  expected_hours?: number;
  pay_rate?: number;
  pay_unit?: string;
  pay_frequency: PayFrequency;
  frequency: PayFrequency;  // Alias
  next_payment_date?: string;
  pay_day?: number;
  max_hours_per_week?: number;
  expected_hours_per_period?: number;
  is_taxable: boolean;
  federal_tax_rate?: number;
  state_tax_rate?: number;
  local_tax_rate?: number;  // Added
  fica_rate?: number;  // Added
  tax_rate_federal?: number;  // DB column name
  tax_rate_state?: number;  // DB column name
  tax_rate_city?: number;  // DB column name
  tax_rate_fica?: number;  // DB column name
  other_deductions?: number;
  deductions: Deduction[];
  status: IncomeStatus;
  is_active: boolean;
  is_guaranteed: boolean;
  reliability_score: number;
  is_recurring: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  // Computed (from backend properties)
  gross_per_period: number;
  net_per_period: number;
  taxes_per_period: number;
  total_deductions_amount: number;
  pre_tax_deductions_amount: number;
  post_tax_deductions_amount: number;
  annual_gross: number;
  annual_net: number;
  monthly_gross: number;
  monthly_net: number;
  total_tax_rate: number;
  // History (optionally populated)
  history?: IncomeHistoryEntry[];
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface IncomeSourceSummary {
  income_id: string;
  source_name: string;
  source_type: IncomeType;
  pay_structure: PayStructure;
  pay_rate?: number;
  pay_unit?: string;
  amount: number;
  frequency: PayFrequency;
  next_payment_date?: string;
  max_hours_per_week?: number;
  expected_hours_per_period?: number;
  is_recurring: boolean;
  is_guaranteed: boolean;
  reliability_score: number;
  is_active: boolean;
}

// ============ INCOME HISTORY ============

export interface LogIncomeRequest {
  hours_worked?: number;
  gross_amount: number;
  net_amount?: number;
  tax_federal?: number;
  tax_state?: number;
  tax_local?: number;
  tax_fica?: number;
  deductions?: { label: string; amount: number; type: DeductionType }[];
  payment_date: string;
  pay_period_start?: string;
  pay_period_end?: string;
  payment_method?: string;
  auto_calculate_taxes?: boolean;
  update_next_payment?: boolean;
  notes?: string;
}

export interface IncomeHistoryEntry {
  entry_id: string;
  history_id?: string;  // Alternative ID from backend
  source_id: string;
  source_name: string;
  income_type: string;
  gross_amount: number;
  net_amount: number;
  deductions?: { label: string; amount: number; type: string }[];
  date: string;
  payment_date?: string;  // Alternative field from backend
  pay_period?: string;
  pay_period_start?: string;
  pay_period_end?: string;
  status: HistoryStatus;
  is_confirmed: boolean;
  confirmed_at?: string;
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
  average_effective_tax_rate: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
}

export interface MonthlyIncomeBreakdown {
  year: number;
  month: number;
  total_gross: number;
  total_net: number;
  total_taxes: number;
  by_source: {
    income_id: string;
    source_name: string;
    gross: number;
    net: number;
    entries_count: number;
  }[];
  daily_breakdown: {
    date: string;
    amount: number;
  }[];
}

export interface YTDIncome {
  year: number;
  total_gross: number;
  total_net: number;
  total_taxes: number;
  by_month: {
    month: number;
    gross: number;
    net: number;
  }[];
  by_source: {
    income_id: string;
    source_name: string;
    total_gross: number;
    total_net: number;
    percentage: number;
  }[];
}

export interface UpcomingPayment {
  expected_date: string;
  expected_amount: number;
  days_until: number;
  pay_period: string;
}

// ============ PAGINATED RESPONSE ============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}