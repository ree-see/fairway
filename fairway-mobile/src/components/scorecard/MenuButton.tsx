import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface MenuButtonProps {
  onPress: () => void;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.text}>☰ Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 20,
    backgroundColor: '#2E7D32',
  },
  button: {
    backgroundColor: '#C41E3A',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});