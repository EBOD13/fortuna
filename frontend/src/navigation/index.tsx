// // mobile/src/navigation/index.tsx
// /**
//  * Main Navigation Structure
//  * 
//  * Tabs: Home | Plan | Add | Manage | Insights
//  * Header: Notifications (left) | Settings (right)
//  */

// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// import { useAuth } from '../context/AuthContext';
// import { colors, spacing, typography, borderRadius } from '../theme';
// import { AddMenu } from '../components/AddMenu';
// import type { RootStackParamList, TabParamList, AddMenuAction } from '../types';

// // Auth Screens
// import { LoginScreen } from '../screens/auth/LoginScreen';
// import { RegisterScreen } from '../screens/auth/RegisterScreen';

// // Main Screens
// import { HomeScreen } from '../screens/main/HomeScreen';
// import { PlanScreen } from '../screens/main/PlanScreen';
// import { ManageScreen } from '../screens/main/ManageScreen';
// import { InsightsScreen } from '../screens/main/InsightsScreen';

// // Modal Screens
// import { AddExpenseScreen } from '../screens/modals/AddExpenseScreen';
// import { AddIncomeScreen } from '../screens/modals/AddIncomeScreen';
// import { UpdateGoalScreen } from '../screens/modals/UpdateGoalScreen';
// import { SettingsScreen } from '../screens/modals/SettingsScreen';
// import { NotificationsScreen } from '../screens/modals/NotificationsScreen';

// const Stack = createNativeStackNavigator<RootStackParamList>();
// const Tab = createBottomTabNavigator<TabParamList>();

// // Tab Icon Component
// const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
//   const icons: Record<string, { active: string; inactive: string }> = {
//     Home: { active: '🏠', inactive: '🏡' },
//     Plan: { active: '🎯', inactive: '📋' },
//     Add: { active: '➕', inactive: '➕' },
//     Manage: { active: '📁', inactive: '📂' },
//     Insights: { active: '📊', inactive: '📈' },
//   };

//   const icon = icons[name] || { active: '📱', inactive: '📱' };

//   return (
//     <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
//       <Text style={styles.tabIcon}>{focused ? icon.active : icon.inactive}</Text>
//     </View>
//   );
// };

// // Main Tab Navigator
// interface MainTabsProps {
//   navigation: any;
// }

// const MainTabs: React.FC<MainTabsProps> = ({ navigation }) => {
//   const [showAddMenu, setShowAddMenu] = useState(false);

//   const handleAddAction = (action: AddMenuAction) => {
//     switch (action) {
//       case 'log_income':
//         navigation.navigate('AddIncome');
//         break;
//       case 'log_expense':
//         navigation.navigate('AddExpense', {});
//         break;
//       case 'update_goal':
//         navigation.navigate('UpdateGoal', {});
//         break;
//       case 'make_payment':
//         navigation.navigate('MakePayment', {});
//         break;
//     }
//   };

//   return (
//     <>
//       <Tab.Navigator
//         screenOptions={({ route }) => ({
//           tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
//           tabBarActiveTintColor: colors.gold[500],
//           tabBarInactiveTintColor: colors.text.muted,
//           tabBarStyle: styles.tabBar,
//           tabBarLabelStyle: styles.tabLabel,
//           tabBarShowLabel: true,
//           headerStyle: styles.header,
//           headerTitleStyle: styles.headerTitle,
//           headerTintColor: colors.text.primary,
//           headerLeft: () => (
//             <TouchableOpacity
//               style={styles.headerButton}
//               onPress={() => navigation.navigate('Notifications')}
//             >
//               <Text style={styles.headerIcon}>🔔</Text>
//             </TouchableOpacity>
//           ),
//           headerRight: () => (
//             <TouchableOpacity
//               style={styles.headerButton}
//               onPress={() => navigation.navigate('Settings')}
//             >
//               <Text style={styles.headerIcon}>⚙️</Text>
//             </TouchableOpacity>
//           ),
//         })}
//       >
//         <Tab.Screen
//           name="Home"
//           component={HomeScreen}
//           options={{ title: 'Fortuna' }}
//         />
//         <Tab.Screen
//           name="Plan"
//           component={PlanScreen}
//           options={{ title: 'Goals' }}
//         />
//         <Tab.Screen
//           name="Add"
//           component={EmptyAddScreen}
//           options={{
//             tabBarLabel: '',
//             tabBarIcon: () => (
//               <TouchableOpacity
//                 style={styles.addButton}
//                 onPress={() => setShowAddMenu(true)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.addButtonText}>+</Text>
//               </TouchableOpacity>
//             ),
//           }}
//           listeners={{
//             tabPress: (e) => {
//               e.preventDefault();
//               setShowAddMenu(true);
//             },
//           }}
//         />
//         <Tab.Screen
//           name="Manage"
//           component={ManageScreen}
//           options={{ title: 'Manage' }}
//         />
//         <Tab.Screen
//           name="Insights"
//           component={InsightsScreen}
//           options={{ title: 'Insights' }}
//         />
//       </Tab.Navigator>

//       <AddMenu
//         visible={showAddMenu}
//         onClose={() => setShowAddMenu(false)}
//         onSelect={handleAddAction}
//       />
//     </>
//   );
// };

// // Empty screen for Add tab (never actually shown)
// const EmptyAddScreen = () => <View style={{ flex: 1, backgroundColor: colors.background.primary }} />;

// // Auth Stack
// const AuthStack = () => (
//   <Stack.Navigator screenOptions={{ headerShown: false }}>
//     <Stack.Screen name="Login" component={LoginScreen} />
//     <Stack.Screen name="Register" component={RegisterScreen} />
//   </Stack.Navigator>
// );

// // Loading Screen
// const LoadingScreen = () => (
//   <View style={styles.loading}>
//     <Text style={styles.loadingLogo}>🌟</Text>
//     <Text style={styles.loadingText}>Fortuna</Text>
//   </View>
// );

// // Main Navigation
// export const Navigation = () => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {isAuthenticated ? (
//           <>
//             <Stack.Screen name="Main" component={MainTabs} />
            
//             {/* Modal Screens */}
//             <Stack.Screen
//               name="AddExpense"
//               component={AddExpenseScreen}
//               options={{ presentation: 'modal' }}
//             />
//             <Stack.Screen
//               name="AddIncome"
//               component={AddIncomeScreen}
//               options={{ presentation: 'modal' }}
//             />
//             <Stack.Screen
//               name="UpdateGoal"
//               component={UpdateGoalScreen}
//               options={{ presentation: 'modal' }}
//             />
//             <Stack.Screen
//               name="Settings"
//               component={SettingsScreen}
//               options={{ presentation: 'modal' }}
//             />
//             <Stack.Screen
//               name="Notifications"
//               component={NotificationsScreen}
//               options={{ presentation: 'modal' }}
//             />
//           </>
//         ) : (
//           <Stack.Screen name="Auth" component={AuthStack} />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// const styles = StyleSheet.create({
//   // Loading
//   loading: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.background.primary,
//   },
//   loadingLogo: {
//     fontSize: 64,
//     marginBottom: spacing.md,
//   },
//   loadingText: {
//     ...typography.headline.medium,
//     color: colors.gold[500],
//   },

//   // Header
//   header: {
//     backgroundColor: colors.background.primary,
//     borderBottomWidth: 0,
//     elevation: 0,
//     shadowOpacity: 0,
//   },
//   headerTitle: {
//     ...typography.title.large,
//     color: colors.text.primary,
//   },
//   headerButton: {
//     paddingHorizontal: spacing.md,
//   },
//   headerIcon: {
//     fontSize: 22,
//   },

//   // Tab Bar
//   tabBar: {
//     backgroundColor: colors.background.secondary,
//     borderTopWidth: 1,
//     borderTopColor: colors.border.dark,
//     paddingTop: spacing.xs,
//     height: 88,
//   },
//   tabLabel: {
//     ...typography.label.small,
//     fontSize: 10,
//     marginBottom: spacing.sm,
//     textTransform: 'none',
//   },
//   tabIconContainer: {
//     padding: spacing.xs,
//     borderRadius: borderRadius.md,
//   },
//   tabIconActive: {
//     backgroundColor: colors.gold[500] + '20',
//   },
//   tabIcon: {
//     fontSize: 24,
//   },

//   // Add Button
//   addButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: colors.emerald[500],
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: spacing.lg,
//     shadowColor: colors.emerald[500],
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.4,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   addButtonText: {
//     fontSize: 32,
//     color: colors.text.primary,
//     fontWeight: '300',
//     marginTop: -2,
//   },
// });