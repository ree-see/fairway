import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DiscardConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardConfirmationModal: React.FC<DiscardConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning-outline" size={48} color={colors.warning} />
          </View>

          <Text style={styles.title}>Discard Round?</Text>
          <Text style={styles.message}>
            Are you sure you want to discard this round? This action cannot be undone.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
              accessibilityLabel="Confirm discard"
            >
              <Text style={styles.confirmButtonText}>Yes, Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityLabel="Cancel discard"
            >
              <Text style={styles.cancelButtonText}>No, Keep It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  cancelButton: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 2,
    borderColor: colors.ui.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
