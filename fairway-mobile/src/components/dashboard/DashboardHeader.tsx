import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface DashboardHeaderProps {
  firstName?: string;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  firstName, 
  onLogout 
}) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{firstName}!</Text>
      </View>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
});