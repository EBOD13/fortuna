// src/screens/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import NotificationCard, { 
  Notification, 
  NotificationType,
  NotificationGroup,
  NotificationEmptyState,
} from '../components/cards/NotificationCard';

// ============ TYPES ============
type FilterType = 'all' | 'unread' | NotificationType;

// ============ HEADER ============
type HeaderProps = {
  unreadCount: number;
  onMarkAllRead: () => void;
  hasNotifications: boolean;
};

const Header = ({ unreadCount, onMarkAllRead, hasNotifications }: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
        <SFSymbol name="chevron.left" size={20} color="#007AFF" />
        <Text style={styles.headerBackText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      {hasNotifications && unreadCount > 0 && (
        <TouchableOpacity style={styles.headerAction} onPress={onMarkAllRead}>
          <Text style={styles.headerActionText}>Mark All Read</Text>
        </TouchableOpacity>
      )}
      {(!hasNotifications || unreadCount === 0) && <View style={styles.headerSpacer} />}
    </View>
  );
};

// ============ FILTER TABS ============
type FilterTabsProps = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: Record<string, number>;
};

const FilterTabs = ({ activeFilter, onFilterChange, counts }: FilterTabsProps) => {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'budget_alert', label: 'Alerts' },
    { key: 'bill_reminder', label: 'Bills' },
    { key: 'insight', label: 'Insights' },
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
      style={styles.filterScrollView}
    >
      {filters.map((filter) => {
        const count = counts[filter.key] || 0;
        const isActive = activeFilter === filter.key;
        
        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => onFilterChange(filter.key)}
          >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
              {filter.label}
            </Text>
            {count > 0 && (
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ============ MAIN COMPONENT ============
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Mock notifications
      setNotifications([
        // Today
        {
          notification_id: '1',
          type: 'budget_alert',
          title: 'Dining budget at 85%',
          message: 'You\'ve spent $340 of your $400 dining budget with 5 days left in the month.',
          timestamp: '2 hours ago',
          read: false,
          priority: 'high',
          actions: [
            { label: 'View Budget', action: 'view_budget', style: 'primary' },
            { label: 'Dismiss', action: 'dismiss', style: 'secondary' },
          ],
          metadata: {
            amount: 340,
            category: 'Dining',
            screen: 'BudgetDetailScreen',
          },
        },
        {
          notification_id: '2',
          type: 'bill_reminder',
          title: 'Netflix due tomorrow',
          message: 'Your Netflix subscription of $15.99 will be charged tomorrow.',
          timestamp: '3 hours ago',
          read: false,
          actions: [
            { label: 'Mark Paid', action: 'mark_paid', style: 'primary' },
            { label: 'Snooze', action: 'snooze', style: 'secondary' },
          ],
          metadata: {
            amount: 15.99,
            screen: 'BillDetailScreen',
          },
        },
        {
          notification_id: '3',
          type: 'insight',
          title: 'Spending pattern detected',
          message: 'We noticed you spend 40% more on weekends. Would you like tips to reduce this?',
          timestamp: '5 hours ago',
          read: false,
          actions: [
            { label: 'View Tips', action: 'view_tips', style: 'primary' },
          ],
          metadata: {
            screen: 'SpendingPatternsScreen',
          },
        },
        // Yesterday
        {
          notification_id: '4',
          type: 'income_received',
          title: 'Paycheck deposited',
          message: 'Your bi-weekly paycheck of $2,847.50 has been deposited.',
          timestamp: 'Yesterday',
          read: true,
          metadata: {
            amount: 2847.50,
            screen: 'IncomeDetailScreen',
          },
        },
        {
          notification_id: '5',
          type: 'goal_milestone',
          title: 'Emergency Fund: 65% complete!',
          message: 'Great progress! You\'re $3,500 away from your $10,000 goal.',
          timestamp: 'Yesterday',
          read: true,
          metadata: {
            progress: 65,
            screen: 'GoalDetailScreen',
          },
        },
        {
          notification_id: '6',
          type: 'achievement',
          title: '🎉 7-Day Check-in Streak!',
          message: 'You\'ve logged your mood and spending for 7 days in a row. Keep it up!',
          timestamp: 'Yesterday',
          read: true,
        },
        // This Week
        {
          notification_id: '7',
          type: 'spending_alert',
          title: 'Unusual spending detected',
          message: 'You spent $280 on shopping today, which is 3x your daily average.',
          timestamp: '2 days ago',
          read: true,
          priority: 'medium',
          metadata: {
            amount: 280,
            category: 'Shopping',
          },
        },
        {
          notification_id: '8',
          type: 'tip',
          title: 'Save on coffee',
          message: 'You\'ve spent $45 on coffee this week. Making coffee at home could save you $150/month.',
          timestamp: '3 days ago',
          read: true,
          actions: [
            { label: 'See Breakdown', action: 'view_breakdown', style: 'secondary' },
          ],
        },
        {
          notification_id: '9',
          type: 'bill_reminder',
          title: 'Rent paid successfully',
          message: 'Your rent payment of $1,850 was processed successfully.',
          timestamp: '4 days ago',
          read: true,
          metadata: {
            amount: 1850,
          },
        },
        // Earlier
        {
          notification_id: '10',
          type: 'system',
          title: 'New feature: Daily Check-ins',
          message: 'Track your mood alongside spending to discover emotional patterns.',
          timestamp: '1 week ago',
          read: true,
          actions: [
            { label: 'Try It Now', action: 'try_feature', style: 'primary' },
          ],
        },
        {
          notification_id: '11',
          type: 'goal_milestone',
          title: 'Vacation Fund: Milestone reached!',
          message: 'You\'ve saved $1,000 towards your vacation. Only $500 to go!',
          timestamp: '1 week ago',
          read: true,
          metadata: {
            progress: 67,
          },
        },
        {
          notification_id: '12',
          type: 'reminder',
          title: 'Weekly spending summary ready',
          message: 'Your weekly spending summary is ready. You spent 12% less than last week!',
          timestamp: '1 week ago',
          read: true,
        },
      ]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All Read', 
          onPress: () => {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.notification_id === notification.notification_id ? { ...n, read: true } : n)
    );
    
    // Navigate to detail screen
    navigation.navigate('NotificationDetailScreen', { notificationId: notification.notification_id });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  // Group by time
  const groupNotifications = () => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const earlier: Notification[] = [];

    filteredNotifications.forEach(n => {
      if (n.timestamp.includes('hour') || n.timestamp.includes('minute') || n.timestamp === 'Just now') {
        today.push(n);
      } else if (n.timestamp === 'Yesterday') {
        yesterday.push(n);
      } else if (n.timestamp.includes('day')) {
        thisWeek.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, thisWeek, earlier };
  };

  // Calculate counts
  const getCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
    };
    
    notifications.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    
    return counts;
  };

  const groups = groupNotifications();
  const counts = getCounts();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          unreadCount={0} 
          onMarkAllRead={() => {}} 
          hasNotifications={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#046C4E" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        hasNotifications={notifications.length > 0}
      />

      <View style={styles.filterSection}>
        <FilterTabs 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor="#046C4E" 
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <NotificationEmptyState />
        ) : (
          <>
            {groups.today.length > 0 && (
              <NotificationGroup
                title="Today"
                notifications={groups.today}
                onNotificationPress={handleNotificationPress}
              />
            )}
            {groups.yesterday.length > 0 && (
              <NotificationGroup
                title="Yesterday"
                notifications={groups.yesterday}
                onNotificationPress={handleNotificationPress}
              />
            )}
            {groups.thisWeek.length > 0 && (
              <NotificationGroup
                title="This Week"
                notifications={groups.thisWeek}
                onNotificationPress={handleNotificationPress}
              />
            )}
            {groups.earlier.length > 0 && (
              <NotificationGroup
                title="Earlier"
                notifications={groups.earlier}
                onNotificationPress={handleNotificationPress}
              />
            )}
          </>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerAction: {
    padding: 4,
  },
  headerActionText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerSpacer: {
    width: 80,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Filter Section
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },

  // Filters - COMPACT STYLES
  filterScrollView: {
    maxHeight: 44, // Compact height
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8, // Reduced from 12
    gap: 6,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6, // Reduced from 8
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 6,
    gap: 4,
    height: 32, // Fixed height for consistency
  },
  filterTabActive: {
    backgroundColor: '#046C4E',
  },
  filterTabText: {
    fontSize: 13, // Slightly smaller
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
});