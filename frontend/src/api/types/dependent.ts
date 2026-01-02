// src/api/types/dependent.ts
/**
 * Dependent Types - Aligned with Backend Schema
 */

// ============ ENUMS ============

export type DependentType = 'human' | 'animal' | 'other';

export type DependentCategory =
  | 'child'
  | 'spouse'
  | 'parent'
  | 'sibling'
  | 'other_family'
  | 'dog'
  | 'cat'
  | 'bird'
  | 'fish'
  | 'other_pet'
  | 'other';

export type DependentRelationship =
  | 'child'
  | 'spouse'
  | 'parent'
  | 'sibling'
  | 'partner'
  | 'pet'
  | 'other';

// ============ REQUEST TYPES ============

/**
 * Request to create a new dependent
 * Matches backend DependentCreate schema
 */
export interface CreateDependentRequest {
  dependent_name: string;
  relationship: string; // Free text: "Son", "Daughter", "Brother", "Cat", etc.
  dependent_type: DependentType;
  dependent_category: DependentCategory;
  
  // Optional fields
  date_of_birth?: string; // YYYY-MM-DD
  age?: number; // For pets or if DOB unknown
  
  // Pet-specific
  pet_type?: string;
  pet_breed?: string;
  
  // Cost tracking
  monthly_cost_estimate?: number;
  
  // Shared responsibility
  shared_responsibility?: boolean;
  cost_sharing_partners?: string[]; // ["Mom", "Dad"]
  your_share_percentage?: number; // 0-100
  partner_contribution_amount?: number;
  
  // Education (for siblings/children)
  institution_name?: string;
  semester_cost?: number;
  support_start_date?: string;
  support_end_date?: string;
  remaining_semesters?: number;
  
  // Additional
  special_needs?: string;
  notes?: string;
  profile_image_url?: string;
}

/**
 * Request to update a dependent
 */
export type UpdateDependentRequest = Partial<CreateDependentRequest>;

// ============ RESPONSE TYPES ============

/**
 * Expense type for a dependent
 */
export interface DependentExpenseType {
  expense_type_id: string;
  dependent_id: string;
  type_name: string;
  description?: string;
  default_amount?: number;
  is_recurring: boolean;
  frequency?: string;
  icon?: string;
  color?: string;
  created_at: string;
}

/**
 * Expense for a dependent
 */
export interface DependentExpense {
  expense_id: string;
  dependent_id: string;
  expense_type_id?: string;
  expense_name: string;
  amount: number;
  expense_date: string;
  your_share?: number;
  is_recurring: boolean;
  frequency?: string;
  semester?: string;
  academic_year?: string;
  notes?: string;
  created_at: string;
}

/**
 * Shared cost agreement
 */
export interface SharedCost {
  shared_cost_id: string;
  dependent_id: string;
  agreement_name: string;
  total_cost: number;
  your_contribution: number;
  your_contribution_paid: number;
  partner_name: string;
  partner_contribution: number;
  partner_contribution_paid: number;
  due_date?: string;
  payment_period?: string;
  your_monthly_allocation?: number;
  months_to_save?: number;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed
  your_remaining: number;
  total_paid: number;
  total_remaining: number;
  completion_percentage: number;
}

/**
 * Full dependent response from API
 * Matches backend DependentResponse schema
 */
export interface Dependent {
  dependent_id: string;
  user_id: string;
  dependent_name: string;
  relationship: string;
  dependent_type: DependentType;
  dependent_category: DependentCategory;
  
  // Age/Birth
  date_of_birth?: string;
  age?: number;
  calculated_age?: number; // Server-calculated from DOB
  
  // Pet-specific
  pet_type?: string;
  pet_breed?: string;
  
  // Cost tracking
  monthly_cost_estimate?: number;
  total_spent_to_date: number;
  
  // Time-bound support
  support_start_date?: string;
  support_end_date?: string;
  remaining_semesters?: number;
  
  // Shared responsibility
  shared_responsibility: boolean;
  cost_sharing_partners?: string[];
  your_share_percentage?: number;
  partner_contribution_amount?: number;
  
  // Education
  institution_name?: string;
  semester_cost?: number;
  
  // Additional
  special_needs?: string;
  notes?: string;
  profile_image_url?: string;
  
  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed properties (from backend)
  support_duration_months?: number;
  your_monthly_share?: number;
  is_time_bound: boolean;
  total_remaining_cost?: number;
  
  // Related data (included in full response)
  expense_types?: DependentExpenseType[];
  recent_expenses?: DependentExpense[];
  active_shared_costs?: SharedCost[];
}

/**
 * Lightweight dependent summary for list views
 * Matches backend DependentSummary schema
 */
export interface DependentSummary {
  dependent_id: string;
  dependent_name: string;
  relationship: string;
  dependent_type: DependentType;
  dependent_category: DependentCategory;
  monthly_cost_estimate?: number;
  your_monthly_share?: number;
  support_end_date?: string;
  support_duration_months?: number;
  is_time_bound: boolean;
  shared_responsibility: boolean;
  profile_image_url?: string;
  is_active: boolean;
}

// ============ STATS TYPES ============

/**
 * Dependent statistics
 */
export interface DependentStats {
  total_dependents: number;
  human_count: number;
  pet_count: number;
  total_monthly_cost: number;
  your_monthly_share: number;
  shared_costs_pending: number;
  by_type: {
    dependent_type: DependentType;
    count: number;
    monthly_total: number;
  }[];
  by_category: {
    category: DependentCategory;
    count: number;
    monthly_total: number;
  }[];
  top_spending: {
    dependent_id: string;
    dependent_name: string;
    monthly_average: number;
  }[];
}

/**
 * Cost projection for a dependent
 */
export interface DependentCostProjection {
  dependent_id: string;
  dependent_name: string;
  current_monthly: number;
  projected_months: {
    month: string;
    year: number;
    projected_cost: number;
    your_share: number;
  }[];
  total_projected: number;
  your_total_share: number;
  support_ends?: string;
}

/**
 * Monthly summary for a dependent
 */
export interface DependentMonthlySummary {
  dependent_id: string;
  dependent_name: string;
  year: number;
  month: number;
  total_expenses: number;
  expense_count: number;
  expense_breakdown: Record<string, number>;
  vs_budget?: number;
  vs_last_month?: number;
}

// ============ QUICK SETUP TYPES ============

/**
 * Quick setup for brother's education
 */
export interface BrotherEducationSetup {
  brother_name: string;
  institution_name: string;
  semester_cost: number;
  your_share_percentage: number;
  partner_name: string; // e.g., "Mom"
  remaining_semesters: number;
  support_start_date?: string;
  notes?: string;
}

/**
 * Quick setup for pet
 */
export interface PetSetup {
  pet_name: string;
  pet_type: 'dog' | 'cat' | 'bird' | 'fish' | 'other';
  pet_breed?: string;
  age?: number;
  monthly_food_cost?: number;
  monthly_medical_cost?: number;
  monthly_other_cost?: number;
  special_needs?: string;
  notes?: string;
}

// ============ EXPENSE TRACKING TYPES ============

/**
 * Create expense type for a dependent
 */
export interface CreateExpenseTypeRequest {
  type_name: string;
  description?: string;
  default_amount?: number;
  is_recurring?: boolean;
  frequency?: string;
  icon?: string;
  color?: string;
}

/**
 * Create expense for a dependent
 */
export interface CreateDependentExpenseRequest {
  expense_type_id?: string;
  expense_name: string;
  amount: number;
  expense_date: string;
  is_recurring?: boolean;
  frequency?: string;
  semester?: string;
  academic_year?: string;
  notes?: string;
}

/**
 * Create shared cost agreement
 */
export interface CreateSharedCostRequest {
  agreement_name: string;
  total_cost: number;
  your_contribution: number;
  partner_name: string;
  partner_contribution: number;
  due_date?: string;
  payment_period?: string;
  your_monthly_allocation?: number;
  notes?: string;
}

/**
 * Record shared cost payment
 */
export interface SharedCostPaymentRequest {
  amount: number;
  payer: 'you' | string; // 'you' or partner name
  payment_date?: string;
  notes?: string;
}