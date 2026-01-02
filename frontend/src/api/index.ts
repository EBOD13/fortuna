// src/api/index.ts
export {
  apiClient,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  TokenManager,
  ApiException,
  API_BASE_URL,
} from './client';

export * from './types';

export * as AuthAPI from './endpoints/auth';
export * as IncomeAPI from './endpoints/income';
export * as ExpenseAPI from './endpoints/expense';
export * as BudgetAPI from './endpoints/budget';
export * as BillAPI from './endpoints/bill';
export * as GoalAPI from './endpoints/goal';
export * as DependentAPI from './endpoints/dependent';