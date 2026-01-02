// src/navigation/RootNavigator.tsx
/**
 * Root Navigator for Fortuna
 * Handles switching between Auth and Main flows
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main App
import MainTabs from '../screens/MainTabs';

// Modal Screens
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddIncomeScreen from '../screens/AddIncomeScreen';
import UpdateGoalScreen from '../screens/UpdateGoalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: { category?: string } | undefined;
  AddIncome: undefined;
  UpdateGoal: { goalId: string } | undefined;
  Settings: undefined;
  Notifications: undefined;
};

// ============================================
// NAVIGATORS
// ============================================

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ============================================
// AUTH NAVIGATOR
// ============================================

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// ============================================
// MAIN NAVIGATOR (Authenticated)
// ============================================

const MainNavigator = () => {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      {/* Main Tabs */}
      <RootStack.Screen name="MainTabs" component={MainTabs} />

      {/* Modal Screens */}
      <RootStack.Group
        screenOptions={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      >
        <RootStack.Screen name="AddExpense" component={AddExpenseScreen} />
        <RootStack.Screen name="AddIncome" component={AddIncomeScreen} />
        <RootStack.Screen name="UpdateGoal" component={UpdateGoalScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen name="Notifications" component={NotificationsScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
};

// ============================================
// ROOT NAVIGATOR
// ============================================

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.emerald[500]} />
      </View>
    );
  }

  // Switch between Auth and Main based on auth state
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default RootNavigator;