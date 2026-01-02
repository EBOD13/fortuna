// mobile/src/screens/main/ProfileScreen.tsx
/**
 * Profile Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/Input';
import { ProgressBar } from '../../components/AmountDisplay';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { RootStackParamList, EmotionalAnalysis } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();

  const [emotionalData, setEmotionalData] = useState<EmotionalAnalysis | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [emotional, achievementsData] = await Promise.all([
        api.getEmotionalRiskScore().catch(() => null),
        api.getAchievements().catch(() => []),
      ]);
      if (emotional) setEmotionalData(emotional);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: '🔔', label: 'Notifications', screen: 'Notifications' },
    { icon: '📊', label: 'Insights', screen: 'Insights' },
    { icon: '💰', label: 'Budget Settings', screen: 'Budget' },
    { icon: '⚙️', label: 'Settings', screen: 'Settings' },
  ];

  const getRiskColor = (score: number): string => {
    if (score < 30) return colors.success;
    if (score < 60) return colors.warning;
    return colors.error;
  };

  const getRiskLabel = (score: number): string => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Moderate';
    return 'High Risk';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.full_name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Spending Persona */}
        {emotionalData?.persona && (
          <Card variant="elevated" style={styles.personaCard}>
            <Text style={styles.personaLabel}>Your Spending Persona</Text>
            <Text style={styles.personaTitle}>
              {emotionalData.persona.persona}
            </Text>
            <Text style={styles.personaDescription}>
              {emotionalData.persona.description}
            </Text>
          </Card>
        )}

        {/* Emotional Risk Score */}
        {emotionalData?.risk_score !== undefined && (
          <Card variant="outlined" style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskTitle}>Emotional Spending Risk</Text>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: getRiskColor(emotionalData.risk_score) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.riskBadgeText,
                    { color: getRiskColor(emotionalData.risk_score) },
                  ]}
                >
                  {getRiskLabel(emotionalData.risk_score)}
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={emotionalData.risk_score}
              height={10}
              color={getRiskColor(emotionalData.risk_score)}
              style={styles.riskProgress}
            />
            <Text style={styles.riskScore}>
              Score: {emotionalData.risk_score}/100
            </Text>
          </Card>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <Card variant="outlined" style={styles.achievementsCard}>
            <View style={styles.achievementsHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Text style={styles.achievementsCount}>
                {achievements.length} earned
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.achievementsScroll}
            >
              {achievements.slice(0, 5).map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>
                    {achievement.achievement?.icon || '🏆'}
                  </Text>
                  <Text style={styles.achievementName} numberOfLines={2}>
                    {achievement.achievement?.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Quick Stats */}
        <Card variant="outlined" style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {emotionalData?.summary?.emotion_capture_rate?.toFixed(0) || 0}%
              </Text>
              <Text style={styles.statLabel}>Emotions Logged</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen as any)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Fortuna</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.headline.medium,
    color: colors.text.inverse,
  },
  name: {
    ...typography.headline.small,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },

  // Persona Card
  personaCard: {
    margin: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primary[50],
  },
  personaLabel: {
    ...typography.label.small,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  personaTitle: {
    ...typography.headline.small,
    color: colors.primary[800],
    marginBottom: spacing.sm,
  },
  personaDescription: {
    ...typography.body.medium,
    color: colors.primary[700],
  },

  // Risk Card
  riskCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  riskTitle: {
    ...typography.title.small,
    color: colors.text.primary,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  riskBadgeText: {
    ...typography.label.small,
    fontWeight: '600',
  },
  riskProgress: {
    marginBottom: spacing.sm,
  },
  riskScore: {
    ...typography.body.small,
    color: colors.text.secondary,
  },

  // Achievements
  achievementsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title.small,
    color: colors.text.primary,
  },
  achievementsCount: {
    ...typography.label.medium,
    color: colors.text.tertiary,
  },
  achievementsScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  achievementItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 70,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  achievementName: {
    ...typography.label.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Stats
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.headline.small,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },

  // Menu
  menu: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  menuArrow: {
    ...typography.body.medium,
    color: colors.text.tertiary,
  },

  // Logout
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.body.medium,
    color: colors.error,
    fontWeight: '600',
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  appName: {
    ...typography.label.medium,
    color: colors.text.tertiary,
  },
  appVersion: {
    ...typography.body.small,
    color: colors.gray[400],
  },
});