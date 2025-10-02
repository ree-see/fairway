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

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();

  const themeOptions: Array<{
    mode: 'light' | 'dark' | 'system';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
          <View style={styles.header}>
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={isDarkMode ? '#E0E0E0' : '#333333'} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Appearance
            </Text>

            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.option,
                  isDarkMode && styles.optionDark,
                  themeMode === option.mode && styles.optionSelected,
                  themeMode === option.mode && isDarkMode && styles.optionSelectedDark,
                ]}
                onPress={() => setThemeMode(option.mode)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={
                      themeMode === option.mode
                        ? '#2E7D32'
                        : isDarkMode
                        ? '#B0B0B0'
                        : '#666666'
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      isDarkMode && styles.optionTextDark,
                      themeMode === option.mode && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {themeMode === option.mode && (
                  <Ionicons name="checkmark" size={24} color="#2E7D32" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: 300,
  },
  modalContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  titleDark: {
    color: '#E0E0E0',
  },
  closeButton: {
    padding: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 15,
    letterSpacing: 1,
  },
  sectionTitleDark: {
    color: '#B0B0B0',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionDark: {
    backgroundColor: '#2C2C2C',
  },
  optionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  optionSelectedDark: {
    backgroundColor: '#1B5E20',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginLeft: 12,
  },
  optionTextDark: {
    color: '#E0E0E0',
  },
  optionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
