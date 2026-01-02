// src/types/income.ts
export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  source_kind: string;
  earning_model: string;
  rate_value?: number;
  rate_unit?: string;
  pay_frequency?: string;
  max_units_per_period?: number;
  amount_behavior: string;
  expected_min_amount?: number;
  expected_max_amount?: number;
  start_date: string;
  end_date?: string;
  is_time_bound: boolean;
  status: string;
  is_taxable: boolean;
  tax_application_mode?: string;
  tax_basis?: string;
  tax_context: Record<string, any>;
  current_balance: number;
  default_allocation_mode: string;
  restricted_usage: boolean;
  priority_level: number;
  payout_delay_days: number;
  requires_manual_confirmation: boolean;
  metadata: Record<string, any>;
  user_notes?: string;
  created_at?: string;
  updated_at?: string;
}
