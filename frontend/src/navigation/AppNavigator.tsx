// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import MainTabs from '../screens/MainTabs';
import ProfileScreen from '../screens/ProfileScreen';
import AddDependentScreen from '../screens/AddDependentScreen';
import EditDependentScreen from '../screens/EditDependentScreen';
import AddIncomeScreen from '../screens/AddIncomeScreen';
import AddBillScreen from '../screens/AddBillScreen';
import AddGoalScreen from '../screens/AddGoalScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import UpdateGoalScreen from '../screens/UpdateGoalScreen';
import LogIncomeScreen from '../screens/LogIncomeScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import AddBudgetScreen from '../screens/AddBudgetScreen';
import EditBudgetScreen from '../screens/EditBudgetScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import EditGoalScreen from '../screens/EditGoalScreen';
import DependentDetailScreen from '../screens/DependentDetailScreen';
import BudgetDetailScreen from '../screens/BudgetDetailScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import IncomeDetailScreen from '../screens/IncomeDetailScreen';
import EditIncomeScreen from '../screens/EditIncomeScreen';
import DailyCheckinScreen from '../screens/DailyCheckinScreen';
import SpendingPatternsScreen from '../screens/SpendingPatternsScreen';
import EmotionalReportScreen from '../screens/EmotionalReportScreen';
import MonthlyAnalysisScreen from '../screens/MonthlyAnalysisScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditBillScreen from '../screens/EditBillScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

// ============ AUTH STACK (Unauthenticated) ============
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="LoginScreen" 
        component={LoginScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="RegisterScreen" 
        component={RegisterScreen}
        options={{
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

// ============ APP STACK (Authenticated) ============
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main App */}
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddDependentScreen"
        component={AddDependentScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="DependentDetailScreen"
        component={DependentDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EditDependentScreen"
        component={EditDependentScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddIncomeScreen"
        component={AddIncomeScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddBillScreen"
        component={AddBillScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddGoalScreen"
        component={AddGoalScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddExpenseScreen"
        component={AddExpenseScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="UpdateGoalScreen"
        component={UpdateGoalScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="LogIncomeScreen"
        component={LogIncomeScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddCategoryScreen"
        component={AddCategoryScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddBudgetScreen"
        component={AddBudgetScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EditBudgetScreen"
        component={EditBudgetScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="GoalDetailScreen"
        component={GoalDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EditGoalScreen"
        component={EditGoalScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="BudgetDetailScreen"
        component={BudgetDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="BillDetailScreen"
        component={BillDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="IncomeDetailScreen"
        component={IncomeDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EditIncomeScreen"
        component={EditIncomeScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="DailyCheckinScreen"
        component={DailyCheckinScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="SpendingPatternsScreen"
        component={SpendingPatternsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EmotionalReportScreen"
        component={EmotionalReportScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="MonthlyAnalysisScreen"
        component={MonthlyAnalysisScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="NotificationDetailScreen"
        component={NotificationDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ReflectionScreen"
        component={ReflectionScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ExpenseDetailScreen"
        component={ExpenseDetailScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="EditBillScreen"
        component={EditBillScreen}
        options={{
          headerShown: false,
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

// ============ LOADING SCREEN ============
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#046C4E" />
    </View>
  );
}

// ============ MAIN NAVIGATOR ============
export default function AppNavigator() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();

  // Show loading screen while checking auth state
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Show appropriate stack based on auth state
  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

// ============ STYLES ============
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});