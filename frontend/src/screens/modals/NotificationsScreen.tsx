// mobile/src/screens/modals/NotificationsScreen.tsx
/**
 * Notifications Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/ListItems';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { Notification } from '../../types';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications({ per_page: 50 });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      budget_alert: '⚠️',
      goal_milestone: '🎯',
      spending_anomaly: '📊',
      daily_reminder: '⏰',
      weekly_summary: '📋',
      bill_reminder: '💳',
      emotional_insight: '🧠',
      achievement: '🏆',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unread]}
      onPress={() => handleMarkRead(item.notification_id)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getNotificationIcon(item.notification_type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.notification_id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold[500]}
          />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="🔔"
              title="No notifications"
              subtitle="You're all caught up!"
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  closeText: {
    ...typography.body.medium,
    color: colors.gold[500],
  },
  headerTitle: {
    ...typography.title.medium,
    color: colors.text.primary,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  unread: {
    backgroundColor: colors.background.tertiary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  titleUnread: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  message: {
    ...typography.body.small,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.text.muted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald[500],
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.dark,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
});