import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ key: string; label: string }>;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs 
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    ...theme.shadows.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.input,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary.main,
  },
  tabButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  tabButtonTextActive: {
    color: theme.colors.text.inverse,
  },
});