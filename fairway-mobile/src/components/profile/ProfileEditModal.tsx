import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';

interface EditForm {
  first_name: string;
  last_name: string;
  phone: string;
}

interface ProfileEditModalProps {
  visible: boolean;
  editForm: EditForm;
  isUpdating: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpdateForm: (form: EditForm) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  editForm,
  isUpdating,
  onClose,
  onSave,
  onUpdateForm
}) => {
  const handleSave = () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    onSave();
  };

  const updateField = (field: keyof EditForm, value: string) => {
    onUpdateForm({ ...editForm, [field]: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isUpdating}>
            <Text style={[styles.modalSaveText, isUpdating && styles.modalSaveTextDisabled]}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>First Name</Text>
            <TextInput
              style={styles.formInput}
              value={editForm.first_name}
              onChangeText={(text) => updateField('first_name', text)}
              placeholder="Enter first name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Last Name</Text>
            <TextInput
              style={styles.formInput}
              value={editForm.last_name}
              onChangeText={(text) => updateField('last_name', text)}
              placeholder="Enter last name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              value={editForm.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#F44336',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: '#CCCCCC',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
});