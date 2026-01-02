// src/screens/NotificationDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { 
  Notification, 
  NotificationType, 
  NotificationAction,
} from '../components/cards/NotificationCard';

// ============ TYPE CONFIG ============
const typeConfig: Record<NotificationType, { 
  icon: string; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  budget_alert: { 
    icon: 'exclamationmark.triangle.fill', 
    color: '#DC2626', 
    bgColor: '#FEF2F2',
    label: 'Budget Alert',
  },
  goal_milestone: { 
    icon: 'flag.fill', 
    color: '#7C3AED', 
    bgColor: '#EDE9FE',
    label: 'Goal Update',
  },
  bill_reminder: { 
    icon: 'calendar.badge.clock', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7',
    label: 'Bill Reminder',
  },
  spending_alert: { 
    icon: 'creditcard.fill', 
    color: '#DC2626', 
    bgColor: '#FEF2F2',
    label: 'Spending Alert',
  },
  income_received: { 
    icon: 'banknote.fill', 
    color: '#046C4E', 
    bgColor: '#D1FAE5',
    label: 'Income',
  },
  insight: { 
    icon: 'lightbulb.fill', 
    color: '#2563EB', 
    bgColor: '#DBEAFE',
    label: 'Insight',
  },
  achievement: { 
    icon: 'trophy.fill', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7',
    label: 'Achievement',
  },
  tip: { 
    icon: 'sparkles', 
    color: '#EC4899', 
    bgColor: '#FCE7F3',
    label: 'Tip',
  },
  system: { 
    icon: 'gear', 
    color: '#6B7280', 
    bgColor: '#F3F4F6',
    label: 'System',
  },
  reminder: { 
    icon: 'bell.fill', 
    color: '#0891B2', 
    bgColor: '#CFFAFE',
    label: 'Reminder',
  },
};

// ============ RELATED ITEM TYPE ============
type RelatedItem = {
  item_id: string;
  type: 'budget' | 'bill' | 'goal' | 'expense' | 'income';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: keyof RootStackParamList;
  params?: Record<string, any>;
};

// ============ HEADER ============
const Header = ({ onDelete }: { onDelete: () => void }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleOptions = () => {
    Alert.alert(
      'Notification Options',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Notification', 
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#007AFF" />
        <Text style={styles.headerBackText}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerOptionsButton} onPress={handleOptions}>
        <SFSymbol name="ellipsis.circle" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export default function NotificationDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NotificationDetailScreen'>>();
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);

  const { notificationId } = route.params;

  useEffect(() => {
    fetchNotification();
  }, [notificationId]);

  const fetchNotification = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 300));

      // Mock notification data based on ID
      const mockNotifications: Record<string, Notification> = {
        '1': {
          notification_id: '1',
          type: 'budget_alert',
          title: 'Dining budget at 85%',
          message: 'You\'ve spent $340 of your $400 dining budget with 5 days left in the month. At your current pace, you\'ll exceed your budget by approximately $60.\n\nConsider reducing dining expenses or adjusting your budget to stay on track.',
          timestamp: '2 hours ago',
          read: true,
          priority: 'high',
          actions: [
            { label: 'View Budget', action: 'view_budget', style: 'primary' },
            { label: 'Adjust Budget', action: 'adjust_budget', style: 'secondary' },
          ],
          metadata: {
            amount: 340,
            category: 'Dining',
            screen: 'BudgetDetailScreen',
            params: { budgetId: 'budget-1' },
          },
        },
        '2': {
          notification_id: '2',
          type: 'bill_reminder',
          title: 'Netflix due tomorrow',
          message: 'Your Netflix subscription of $15.99 will be charged tomorrow. Make sure you have sufficient funds in your account.\n\nThis is a recurring monthly bill that you set up on January 15, 2025.',
          timestamp: '3 hours ago',
          read: true,
          actions: [
            { label: 'Mark as Paid', action: 'mark_paid', style: 'primary' },
            { label: 'Snooze 1 Day', action: 'snooze', style: 'secondary' },
          ],
          metadata: {
            amount: 15.99,
            screen: 'BillDetailScreen',
            params: { billId: 'bill-1' },
          },
        },
        '3': {
          notification_id: '3',
          type: 'insight',
          title: 'Spending pattern detected',
          message: 'We noticed you spend 40% more on weekends compared to weekdays. This pattern has been consistent over the past 4 weeks.\n\nMost of this extra spending goes to dining and entertainment. Would you like some tips to manage weekend spending?',
          timestamp: '5 hours ago',
          read: true,
          actions: [
            { label: 'View Tips', action: 'view_tips', style: 'primary' },
            { label: 'See Full Analysis', action: 'view_analysis', style: 'secondary' },
          ],
          metadata: {
            screen: 'SpendingPatternsScreen',
          },
        },
        '4': {
          notification_id: '4',
          type: 'income_received',
          title: 'Paycheck deposited',
          message: 'Your bi-weekly paycheck of $2,847.50 has been deposited. This includes:\n\n• Gross pay: $3,846.15\n• Federal tax: -$692.31\n• State tax: -$192.31\n• 401(k): -$115.38\n\nNet deposit: $2,847.50',
          timestamp: 'Yesterday',
          read: true,
          metadata: {
            amount: 2847.50,
            screen: 'IncomeDetailScreen',
            params: { incomeId: 'income-1' },
          },
        },
        '5': {
          notification_id: '5',
          type: 'goal_milestone',
          title: 'Emergency Fund: 65% complete!',
          message: 'Great progress on your Emergency Fund goal! You\'ve saved $6,500 towards your $10,000 target.\n\nAt your current savings rate, you\'ll reach your goal in approximately 3 months. Keep up the great work!',
          timestamp: 'Yesterday',
          read: true,
          actions: [
            { label: 'View Goal', action: 'view_goal', style: 'primary' },
            { label: 'Add Funds', action: 'add_funds', style: 'secondary' },
          ],
          metadata: {
            progress: 65,
            screen: 'GoalDetailScreen',
            params: { goalId: 'goal-1' },
          },
        },
      };

      // Get notification or use a default
      const notif = mockNotifications[notificationId] || {
        notification_id: notificationId,
        type: 'system' as NotificationType,
        title: 'Notification',
        message: 'This notification is no longer available.',
        timestamp: 'Unknown',
        read: true,
      };

      setNotification(notif);

      // Mock related items based on notification type
      const related: RelatedItem[] = [];
      
      if (notif.type === 'budget_alert') {
        related.push({
          item_id: '1',
          type: 'budget',
          title: 'Dining Budget',
          subtitle: '$340 of $400 spent',
          icon: 'fork.knife',
          color: '#F59E0B',
          screen: 'BudgetDetailScreen',
          params: { budgetId: 'budget-1' },
        });
        related.push({
          item_id: '2',
          type: 'expense',
          title: 'Recent Dining Expenses',
          subtitle: '12 transactions this month',
          icon: 'creditcard.fill',
          color: '#6B7280',
          screen: 'BudgetDetailScreen',
          params: { budgetId: 'budget-1' },
        });
      } else if (notif.type === 'bill_reminder') {
        related.push({
          item_id: '1',
          type: 'bill',
          title: 'Netflix',
          subtitle: 'Monthly • $15.99',
          icon: 'tv.fill',
          color: '#DC2626',
          screen: 'BillDetailScreen',
          params: { billId: 'bill-1' },
        });
      } else if (notif.type === 'goal_milestone') {
        related.push({
          item_id: '1',
          type: 'goal',
          title: 'Emergency Fund',
          subtitle: '$6,500 of $10,000',
          icon: 'shield.fill',
          color: '#046C4E',
          screen: 'GoalDetailScreen',
          params: { goalId: 'goal-1' },
        });
      } else if (notif.type === 'income_received') {
        related.push({
          item_id: '1',
          type: 'income',
          title: 'TechCorp Inc.',
          subtitle: 'Bi-weekly salary',
          icon: 'building.2.fill',
          color: '#2563EB',
          screen: 'IncomeDetailScreen',
          params: { incomeId: 'income-1' },
        });
      }

      setRelatedItems(related);

    } catch (error) {
      console.error('Error fetching notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: NotificationAction) => {
    switch (action.action) {
      case 'view_budget':
      case 'adjust_budget':
        navigation.navigate('BudgetDetailScreen', { budgetId: 'budget-1' });
        break;
      case 'view_goal':
      case 'add_funds':
        navigation.navigate('GoalDetailScreen', { goalId: 'goal-1' });
        break;
      case 'mark_paid':
        Alert.alert('Success', 'Bill marked as paid!', [{ text: 'OK' }]);
        break;
      case 'snooze':
        Alert.alert('Snoozed', 'Reminder snoozed for 1 day', [{ text: 'OK' }]);
        break;
      case 'view_tips':
      case 'view_analysis':
        navigation.navigate('SpendingPatternsScreen');
        break;
      default:
        console.log('Action:', action.action);
    }
  };

  const handleRelatedItemPress = (item: RelatedItem) => {
    if (item.screen && item.params) {
      navigation.navigate(item.screen as any, item.params);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header onDelete={() => {}} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
        </View>
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={styles.container}>
        <Header onDelete={() => {}} />
        <View style={styles.errorContainer}>
          <SFSymbol name="exclamationmark.circle" size={48} color="#DC2626" />
          <Text style={styles.errorText}>Notification not found</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const config = typeConfig[notification.type];

  return (
    <View style={styles.container}>
      <Header onDelete={handleDelete} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: config.bgColor }]}>
          <View style={[styles.heroIcon, { backgroundColor: config.color + '20' }]}>
            <SFSymbol name={config.icon} size={36} color={config.color} />
          </View>
          <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{notification.title}</Text>
          <Text style={styles.heroTimestamp}>{notification.timestamp}</Text>
        </View>

        {/* Message */}
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{notification.message}</Text>
        </View>

        {/* Metadata */}
        {notification.metadata && (
          <View style={styles.metadataCard}>
            {notification.metadata.amount !== undefined && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataIcon}>
                  <SFSymbol name="dollarsign.circle.fill" size={20} color={config.color} />
                </View>
                <View style={styles.metadataContent}>
                  <Text style={styles.metadataLabel}>Amount</Text>
                  <Text style={[styles.metadataValue, { color: config.color }]}>
                    ${notification.metadata.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
            {notification.metadata.category && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataIcon}>
                  <SFSymbol name="tag.fill" size={20} color="#6B7280" />
                </View>
                <View style={styles.metadataContent}>
                  <Text style={styles.metadataLabel}>Category</Text>
                  <Text style={styles.metadataValue}>{notification.metadata.category}</Text>
                </View>
              </View>
            )}
            {notification.metadata.progress !== undefined && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataIcon}>
                  <SFSymbol name="chart.bar.fill" size={20} color={config.color} />
                </View>
                <View style={[styles.metadataContent, { flex: 1 }]}>
                  <Text style={styles.metadataLabel}>Progress</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${notification.metadata.progress}%`, backgroundColor: config.color }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.progressText, { color: config.color }]}>
                      {notification.metadata.progress}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Actions</Text>
            <View style={styles.actionsGrid}>
              {notification.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    action.style === 'primary' && { backgroundColor: config.color },
                    action.style === 'destructive' && { backgroundColor: '#DC2626' },
                  ]}
                  onPress={() => handleAction(action)}
                >
                  <Text style={[
                    styles.actionButtonText,
                    (action.style === 'primary' || action.style === 'destructive') && { color: '#FFFFFF' },
                    (!action.style || action.style === 'secondary') && { color: config.color },
                  ]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <View style={styles.relatedCard}>
            <Text style={styles.relatedTitle}>Related</Text>
            {relatedItems.map((item) => (
              <TouchableOpacity
                key={item.item_id}
                style={styles.relatedItem}
                onPress={() => handleRelatedItemPress(item)}
              >
                <View style={[styles.relatedIcon, { backgroundColor: item.color + '15' }]}>
                  <SFSymbol name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedItemTitle}>{item.title}</Text>
                  <Text style={styles.relatedItemSubtitle}>{item.subtitle}</Text>
                </View>
                <SFSymbol name="chevron.right" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Priority Badge (if high) */}
        {notification.priority === 'high' && (
          <View style={styles.priorityBanner}>
            <SFSymbol name="exclamationmark.circle.fill" size={18} color="#DC2626" />
            <Text style={styles.priorityText}>
              This is a high priority notification that requires your attention.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBackText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerOptionsButton: {
    padding: 4,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  // Hero Section
  heroSection: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroTimestamp: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Message Card
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },

  // Metadata Card
  metadataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  metadataIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  metadataContent: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 45,
  },

  // Actions Card
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Related Card
  relatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  relatedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  relatedContent: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  relatedItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Priority Banner
  priorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  priorityText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
});