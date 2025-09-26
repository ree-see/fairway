import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
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