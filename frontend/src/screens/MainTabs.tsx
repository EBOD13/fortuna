// src/navigation/MainTabs.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SFSymbol } from 'react-native-sfsymbols';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIcon from '../components/icons/HomeIcon';
import LogScreen from './LogScreen';
import ManageScreen from './ManageScreen';
import HomeScreen from './HomeScreen';
import PlansScreen from './PlanScreen';
import InsightScreen from './InsightScreen';

// src/navigation/MainTabs.tsx
import { StackNavigationProp } from '@react-navigation/stack';

// Inside AppHeader:
import { useAuth } from '../context/AuthContext';

const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      {/* Logout */}
      <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
        <SFSymbol name="rectangle.portrait.and.arrow.right" size={22} color="#DC2626" />
      </TouchableOpacity>

      {/* App Name */}
      <Text style={styles.appName}>Fortun</Text>

      {/* Profile */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.navigate('ProfileScreen')} 
      >
        <SFSymbol name="person.circle" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

// Screen wrapper with header
const ScreenWithHeader = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.screenContainer}>
    <AppHeader />
    {children}
  </View>
);


const AccountsScreen = () => (
  <ScreenWithHeader>
    <View style={styles.screen}>
      <Text style={styles.text}>Accounts</Text>
    </View>
  </ScreenWithHeader>
);

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#046C4E',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
          paddingTop: 8,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlansScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="target" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={LogScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="plus.app.fill" size={36} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Manage"
        component={ManageScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="square.stack.3d.up.fill" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Insight"
        component={InsightScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="sparkles.rectangle.stack.fill" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8,
  },
  appName: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#000',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
});