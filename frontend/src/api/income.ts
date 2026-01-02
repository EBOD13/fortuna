// src/api/income.ts
import { apiRequest } from '../lib/apiClient';

// Get all the incomes we have in the database
export const fetchIncomes = () => apiRequest('/income');

// Create the income
export const createIncomeSource = (data: any) => apiRequest('/income', {
    method: 'POST',
    body: JSON.stringify(data),
});

// Update income 
export const updateIncomeSource = (id: string, data: any) => apiRequest(`/income/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});
// Delete income
export const deleteIncomeSource = (id: string) => apiRequest(`/income/${id}`, {
    method: 'DELETE',
})