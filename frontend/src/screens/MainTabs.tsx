// src/navigation/MainTabs.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SFSymbol } from 'react-native-sfsymbols';

// Placeholder screens
const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Home</Text>
  </View>
);

const LogScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Log</Text>
  </View>
);

const PlanningScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Planning</Text>
  </View>
);

const DependentsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Dependents</Text>
  </View>
);

const AccountsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Accounts</Text>
  </View>
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
            <SFSymbol name="house.fill" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlanningScreen}
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
            <SFSymbol name="plus.circle.fill" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Manage"
        component={DependentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="square.stack.3d.up.fill" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={AccountsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="ellipsis.circle.fill" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
});