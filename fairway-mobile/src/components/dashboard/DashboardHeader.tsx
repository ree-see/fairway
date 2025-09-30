import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { theme } from '../../theme';
import { layout, text as textStyles } from '../../theme/commonStyles';

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
    ...layout.rowSpaceBetween,
    padding: theme.padding.screen,
    backgroundColor: theme.colors.background.secondary,
    paddingTop: theme.spacing.massive,
  },
  welcomeText: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
  nameText: {
    ...theme.textStyles.h2,
    color: theme.colors.primary.main,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  logoutText: {
    ...textStyles.errorText,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
});