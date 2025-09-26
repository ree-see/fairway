import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  icon: string;
  title: string;
  action: () => void;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({ title, items }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.menuItem} 
          onPress={item.action}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name={item.icon as any} size={24} color="#666666" />
            <Text style={styles.menuItemText}>{item.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 16,
  },
});