import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#2E7D32',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
});