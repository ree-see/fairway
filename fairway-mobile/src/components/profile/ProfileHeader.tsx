import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  email
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getInitials = () => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  return (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials()}
          </Text>
        </View>
        <Text style={styles.userName}>
          {firstName} {lastName}
        </Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    backgroundColor: '#2E7D32', // Theme green for both light and dark mode
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#2E7D32',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});