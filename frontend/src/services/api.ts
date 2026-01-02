// // mobile/src/services/api.ts
// /**
//  * API Service - Handles all backend communication
//  */

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';
// import type {
//   AuthResponse,
//   LoginCredentials,
//   RegisterData,
//   User,
//   Dashboard,
//   Expense,
//   ExpenseCreate,
//   ExpenseCategory,
//   Goal,
//   GoalCreate,
//   GoalContribution,
//   Budget,
//   IncomeSource,
//   IncomeLog,
//   RecurringExpense,
//   UpcomingBill,
//   Dependent,
//   Notification,
//   EmotionalAnalysis,
//   SpendingPrediction,
//   Achievement,
// } from '../types';

// // API URL configuration
// const getBaseUrl = (): string => {
//   if (__DEV__) {
//     if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:8000';
//     }
//     return 'http://localhost:8000';
//   }
//   return 'https://api.fortuna.app';
// };

// const API_BASE_URL = getBaseUrl();
// const API_URL = `${API_BASE_URL}/api/v1`;

// const TOKEN_KEY = 'fortuna_auth_token';
// const USER_KEY = 'fortuna_user';

// class ApiService {
//   private token: string | null = null;

//   constructor() {
//     this.loadToken();
//   }

//   private async loadToken(): Promise<void> {
//     try {
//       this.token = await AsyncStorage.getItem(TOKEN_KEY);
//     } catch (error) {
//       console.error('Error loading token:', error);
//     }
//   }

//   private async saveToken(token: string): Promise<void> {
//     this.token = token;
//     await AsyncStorage.setItem(TOKEN_KEY, token);
//   }

//   private async clearToken(): Promise<void> {
//     this.token = null;
//     await AsyncStorage.removeItem(TOKEN_KEY);
//     await AsyncStorage.removeItem(USER_KEY);
//   }

//   private getHeaders(): HeadersInit {
//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//     };
//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }
//     return headers;
//   }

//   private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//     const url = `${API_URL}${endpoint}`;
    
//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         ...this.getHeaders(),
//         ...options.headers,
//       },
//     });

//     if (!response.ok) {
//       if (response.status === 401) {
//         await this.clearToken();
//         throw new Error('Session expired. Please login again.');
//       }
//       const error = await response.json().catch(() => ({}));
//       throw new Error(error.detail || `Request failed: ${response.status}`);
//     }

//     const text = await response.text();
//     if (!text) return {} as T;
//     return JSON.parse(text);
//   }

//   // ============================================
//   // AUTH
//   // ============================================

//   async login(credentials: LoginCredentials): Promise<AuthResponse> {
//     const response = await this.request<AuthResponse>('/auth/login', {
//       method: 'POST',
//       body: JSON.stringify(credentials),
//     });
//     await this.saveToken(response.access_token);
//     await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
//     return response;
//   }

//   async register(data: RegisterData): Promise<AuthResponse> {
//     const response = await this.request<AuthResponse>('/auth/register', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//     await this.saveToken(response.access_token);
//     await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
//     return response;
//   }

//   async logout(): Promise<void> {
//     await this.clearToken();
//   }

//   async getCurrentUser(): Promise<User> {
//     return this.request<User>('/auth/me');
//   }

//   async isAuthenticated(): Promise<boolean> {
//     await this.loadToken();
//     return !!this.token;
//   }

//   async getStoredUser(): Promise<User | null> {
//     try {
//       const userStr = await AsyncStorage.getItem(USER_KEY);
//       return userStr ? JSON.parse(userStr) : null;
//     } catch {
//       return null;
//     }
//   }

//   // ============================================
//   // DASHBOARD
//   // ============================================

//   async getDashboard(): Promise<Dashboard> {
//     return this.request<Dashboard>('/dashboard/');
//   }

//   async getQuickStats(): Promise<any> {
//     return this.request('/dashboard/quick-stats');
//   }

//   async getUpcomingBills(): Promise<UpcomingBill[]> {
//     return this.request('/dashboard/upcoming-bills');
//   }

//   // ============================================
//   // EXPENSES
//   // ============================================

//   async getExpenses(params?: {
//     skip?: number;
//     limit?: number;
//     category_id?: string;
//     start_date?: string;
//     end_date?: string;
//   }): Promise<Expense[]> {
//     const queryParams = new URLSearchParams();
//     if (params?.skip) queryParams.append('skip', String(params.skip));
//     if (params?.limit) queryParams.append('limit', String(params.limit));
//     if (params?.category_id) queryParams.append('category_id', params.category_id);
//     if (params?.start_date) queryParams.append('start_date', params.start_date);
//     if (params?.end_date) queryParams.append('end_date', params.end_date);
//     const query = queryParams.toString();
//     return this.request<Expense[]>(`/expenses/${query ? `?${query}` : ''}`);
//   }

//   async getExpense(expenseId: string): Promise<Expense> {
//     return this.request<Expense>(`/expenses/${expenseId}`);
//   }

//   async createExpense(data: ExpenseCreate): Promise<Expense> {
//     return this.request<Expense>('/expenses/', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async updateExpense(expenseId: string, data: Partial<ExpenseCreate>): Promise<Expense> {
//     return this.request<Expense>(`/expenses/${expenseId}`, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     });
//   }

//   async deleteExpense(expenseId: string): Promise<void> {
//     await this.request(`/expenses/${expenseId}`, { method: 'DELETE' });
//   }

//   async getCategories(): Promise<ExpenseCategory[]> {
//     return this.request<ExpenseCategory[]>('/expenses/categories/');
//   }

//   // ============================================
//   // INCOME
//   // ============================================

//   async getIncomeSources(): Promise<IncomeSource[]> {
//     return this.request<IncomeSource[]>('/income/sources/');
//   }

//   async createIncomeSource(data: Partial<IncomeSource>): Promise<IncomeSource> {
//     return this.request<IncomeSource>('/income/sources/', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async logIncome(data: {
//     source_id: string;
//     gross_amount: number;
//     net_amount: number;
//     payment_date: string;
//     hours_worked?: number;
//     notes?: string;
//   }): Promise<IncomeLog> {
//     return this.request<IncomeLog>('/income/log/', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async getIncomeHistory(params?: { limit?: number }): Promise<IncomeLog[]> {
//     const query = params?.limit ? `?limit=${params.limit}` : '';
//     return this.request<IncomeLog[]>(`/income/history/${query}`);
//   }

//   // ============================================
//   // RECURRING EXPENSES / BILLS
//   // ============================================

//   async getRecurringExpenses(): Promise<RecurringExpense[]> {
//     return this.request<RecurringExpense[]>('/recurring-expenses/');
//   }

//   async createRecurringExpense(data: Partial<RecurringExpense>): Promise<RecurringExpense> {
//     return this.request<RecurringExpense>('/recurring-expenses/', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async markBillPaid(billId: string, amount: number): Promise<void> {
//     await this.request(`/recurring-expenses/bills/${billId}/pay`, {
//       method: 'POST',
//       body: JSON.stringify({ amount }),
//     });
//   }

//   // ============================================
//   // DEPENDENTS
//   // ============================================

//   async getDependents(): Promise<Dependent[]> {
//     return this.request<Dependent[]>('/dependents/');
//   }

//   async createDependent(data: Partial<Dependent>): Promise<Dependent> {
//     return this.request<Dependent>('/dependents/', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   // ============================================
//   // GOALS
//   // ============================================

//   async getGoals(): Promise<Goal[]> {
//     return this.request<Goal[]>('/goals/');
//   }

//   async getGoal(goalId: string): Promise<Goal> {
//     return this.request<Goal>(`/goals/${goalId}`);
//   }

//   async createGoal(data: GoalCreate): Promise<Goal> {
//     return this.request<Goal>('/goals/', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async updateGoal(goalId: string, data: Partial<GoalCreate>): Promise<Goal> {
//     return this.request<Goal>(`/goals/${goalId}`, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     });
//   }

//   async contributeToGoal(goalId: string, amount: number): Promise<Goal> {
//     return this.request<Goal>(`/goals/${goalId}/contribute`, {
//       method: 'POST',
//       body: JSON.stringify({ amount }),
//     });
//   }

//   // ============================================
//   // BUDGET
//   // ============================================

//   async getActiveBudget(): Promise<Budget> {
//     return this.request<Budget>('/budget/active');
//   }

//   async getBudgetStats(): Promise<any> {
//     return this.request('/budget/stats');
//   }

//   async createQuickBudget(data: { monthly_income: number; savings_percentage?: number }): Promise<Budget> {
//     return this.request<Budget>('/budget/quick', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   // ============================================
//   // NOTIFICATIONS
//   // ============================================

//   async getNotifications(params?: { unread_only?: boolean; page?: number }): Promise<{ notifications: Notification[]; unread_count: number }> {
//     const queryParams = new URLSearchParams();
//     if (params?.unread_only) queryParams.append('unread_only', 'true');
//     if (params?.page) queryParams.append('page', String(params.page));
//     const query = queryParams.toString();
//     return this.request(`/notifications/${query ? `?${query}` : ''}`);
//   }

//   async markNotificationRead(notificationId: string): Promise<Notification> {
//     return this.request<Notification>(`/notifications/${notificationId}/read`, {
//       method: 'POST',
//     });
//   }

//   async getUnreadCount(): Promise<{ unread_count: number }> {
//     return this.request('/notifications/unread-count');
//   }

//   // ============================================
//   // AI INSIGHTS
//   // ============================================

//   async getEmotionalAnalysis(days?: number): Promise<EmotionalAnalysis> {
//     const query = days ? `?days=${days}` : '';
//     return this.request<EmotionalAnalysis>(`/insights/emotional${query}`);
//   }

//   async getSpendingPrediction(days?: number): Promise<SpendingPrediction> {
//     const query = days ? `?days=${days}` : '';
//     return this.request<SpendingPrediction>(`/insights/spending/predict${query}`);
//   }

//   async getGoalScores(): Promise<any[]> {
//     return this.request('/insights/goals/score-all');
//   }

//   async getDashboardInsights(): Promise<any> {
//     return this.request('/insights/dashboard');
//   }

//   // ============================================
//   // ACHIEVEMENTS
//   // ============================================

//   async getAchievements(): Promise<Achievement[]> {
//     return this.request('/notifications/achievements');
//   }

//   async getAchievementProgress(): Promise<any[]> {
//     return this.request('/notifications/achievements/progress');
//   }
// }

// export const api = new ApiService();