// src/components/navigation/TabSelector.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Tab = {
  id: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function TabSelector({
  tabs,
  activeTab,
  onTabChange,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.segmentContainer}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.segment,
                isActive && styles.activeSegment,
              ]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.label,
                  isActive ? styles.activeLabel : styles.inactiveLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7', // system grouped bg
    borderRadius: 12,          // 👈 container is rounded
    padding: 4,                // 👈 space between container + segments
  },

  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,           // 👈 inner segments rounded
  },

  activeSegment: {
    backgroundColor: '#046C4E',
  },

  label: {
    fontSize: 14,
  },

  inactiveLabel: {
    fontWeight: '500',
    color: '#8E8E93',
  },

  activeLabel: {
    fontWeight: '600',
    color: '#ffffff',
  },
});
