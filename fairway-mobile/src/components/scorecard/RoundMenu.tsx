import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LiveActivityService from '../../services/LiveActivityService';

interface RoundMenuProps {
  visible: boolean;
  onClose: () => void;
  completedHoles: number;
  totalHoles: number;
  scoreDisplay: string;
  canSubmit: boolean;
  onSubmit: () => void;
}

export const RoundMenu: React.FC<RoundMenuProps> = ({
  visible,
  onClose,
  completedHoles,
  totalHoles,
  scoreDisplay,
  canSubmit,
  onSubmit
}) => {
  const navigation = useNavigation();

  const handlePauseRound = () => {
    onClose();
    Alert.alert(
      'Pause Round',
      'Save progress and return to Dashboard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pause & Exit', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleRoundSettings = () => {
    onClose();
    Alert.alert('Round Settings', 'Settings coming soon');
  };

  const handleViewSummary = () => {
    onClose();
    Alert.alert('Summary', `Completed: ${completedHoles}/${totalHoles} holes\nScore: ${scoreDisplay}`);
  };

  const handleEndRound = () => {
    onClose();
    onSubmit();
  };

  const handleExitWithoutSaving = () => {
    onClose();
    Alert.alert(
      'Exit Without Saving?',
      'All progress will be lost. Return to Dashboard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive', 
          onPress: () => {
            if (LiveActivityService.isLiveActivitySupported()) {
              LiveActivityService.endActivity();
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.menuItem} onPress={onClose}>
            <Text style={styles.menuItemText}>Continue Round</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handlePauseRound}>
            <Text style={styles.menuItemText}>Pause Round</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleRoundSettings}>
            <Text style={styles.menuItemText}>Round Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleViewSummary}>
            <Text style={styles.menuItemText}>View Summary</Text>
          </TouchableOpacity>
          
          {canSubmit && (
            <TouchableOpacity style={[styles.menuItem, styles.menuItemSuccess]} onPress={handleEndRound}>
              <Text style={[styles.menuItemText, styles.menuItemTextSuccess]}>End Round</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleExitWithoutSaving}>
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Exit Without Saving</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
  },
  menuItemSuccess: {
    backgroundColor: '#E8F5E8',
  },
  menuItemTextSuccess: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  menuItemDanger: {
    backgroundColor: '#FFEBEE',
  },
  menuItemTextDanger: {
    color: '#F44336',
    fontWeight: 'bold',
  },
});