// // mobile/src/screens/main/PlanScreen.tsx
// /**
//  * Plan Screen - Goals Management
//  */

// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   FlatList,
//   RefreshControl,
//   TouchableOpacity,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// import { api } from '../../services/api';
// import { Card } from '../../components/Card';
// import { AmountDisplay, ProgressBar } from '../../components/ProgressBar';
// import { GoalItem, EmptyState } from '../../components/ListItems';
// import { colors, spacing, typography, borderRadius } from '../../theme';
// import type { Goal, RootStackParamList } from '../../types';

// type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// export const PlanScreen: React.FC = () => {
//   const navigation = useNavigation<NavigationProp>();

//   const [goals, setGoals] = useState<Goal[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const fetchGoals = useCallback(async () => {
//     try {
//       const data = await api.getGoals();
//       setGoals(data);
//     } catch (error) {
//       console.error('Error fetching goals:', error);
//     } finally {
//       setIsLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchGoals();
//   }, [fetchGoals]);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchGoals();
//   };

//   const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
//   const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
//   const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

//   const renderGoal = ({ item }: { item: Goal }) => (
//     <GoalItem
//       goal={item}
//       onPress={() => navigation.navigate('UpdateGoal', { goalId: item.goal_id })}
//     />
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <FlatList
//         data={goals}
//         renderItem={renderGoal}
//         keyExtractor={(item) => item.goal_id}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={colors.gold[500]}
//           />
//         }
//         contentContainerStyle={styles.listContent}
//         ListHeaderComponent={
//           goals.length > 0 ? (
//             <Card variant="elevated" style={styles.summaryCard}>
//               <Text style={styles.summaryTitle}>Total Progress</Text>
//               <View style={styles.summaryRow}>
//                 <AmountDisplay amount={totalSaved} size="large" color={colors.gold[500]} />
//                 <Text style={styles.summaryOf}>of</Text>
//                 <AmountDisplay amount={totalTarget} size="large" color={colors.text.tertiary} />
//               </View>
//               <ProgressBar
//                 progress={overallProgress}
//                 height={14}
//                 color={colors.gold[500]}
//                 variant="glow"
//                 style={styles.summaryProgress}
//               />
//               <Text style={styles.summaryPercentage}>
//                 {overallProgress.toFixed(0)}% towards all goals
//               </Text>
//             </Card>
//           ) : null
//         }
//         ListEmptyComponent={
//           isLoading ? null : (
//             <EmptyState
//               icon="🎯"
//               title="No goals yet"
//               subtitle="Set financial goals to track your savings progress"
//               action="Create Goal"
//               onAction={() => {}}
//             />
//           )
//         }
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background.primary,
//   },
//   listContent: {
//     padding: spacing.lg,
//     paddingBottom: 120,
//   },
//   summaryCard: {
//     marginBottom: spacing.lg,
//     backgroundColor: colors.slate[500],
//   },
//   summaryTitle: {
//     ...typography.label.small,
//     color: colors.text.tertiary,
//     marginBottom: spacing.sm,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//     marginBottom: spacing.md,
//   },
//   summaryOf: {
//     ...typography.body.medium,
//     color: colors.text.muted,
//     marginHorizontal: spacing.sm,
//   },
//   summaryProgress: {
//     marginBottom: spacing.sm,
//   },
//   summaryPercentage: {
//     ...typography.body.small,
//     color: colors.text.secondary,
//   },
// });