import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { MenuSection } from '../components/profile/MenuSection';
import { SubscriptionCard } from '../components/profile/SubscriptionCard';
import { LogoutButton } from '../components/profile/LogoutButton';
import { ProfileEditModal } from '../components/profile/ProfileEditModal';
import { AppFooter } from '../components/profile/AppFooter';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUserData } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setIsUpdating(true);
    
    try {
      const result = await updateUserData(editForm);
      
      if (result.success) {
        setShowEditModal(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', action: handleEditProfile },
    { icon: 'settings-outline', title: 'Settings', action: () => {} },
    { icon: 'help-circle-outline', title: 'Help & Support', action: () => {} },
    { icon: 'information-circle-outline', title: 'About', action: () => {} },
  ];

  const handleUpgrade = () => {
    // TODO: Implement upgrade functionality
  };

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader 
        firstName={user?.first_name}
        lastName={user?.last_name}
        email={user?.email}
      />

      <View style={styles.content}>
        <MenuSection 
          title="Account"
          items={menuItems}
        />

        <SubscriptionCard 
          title="Free Plan"
          status="Active"
          description="Basic features including provisional handicap and course finder"
          onUpgrade={handleUpgrade}
        />

        <View style={styles.section}>
          <LogoutButton onLogout={handleLogout} />
        </View>

        <AppFooter />
      </View>

      <ProfileEditModal 
        visible={showEditModal}
        editForm={editForm}
        isUpdating={isUpdating}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
        onUpdateForm={setEditForm}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
});