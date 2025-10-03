import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { theme } from '../../theme';

interface DashboardHeaderProps {
  firstName?: string;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  firstName,
  onLogout
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.padding.screen,
    backgroundColor: '#2E7D32', // Theme green for both light and dark mode
    paddingTop: theme.spacing.massive,
  },
  welcomeText: {
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
});