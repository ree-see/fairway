import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AppFooterProps {
  appName?: string;
  version?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({ 
  appName = 'The Verified Handicap', 
  version = '1.0.0' 
}) => {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{appName}</Text>
      <Text style={styles.versionText}>Version {version}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
});