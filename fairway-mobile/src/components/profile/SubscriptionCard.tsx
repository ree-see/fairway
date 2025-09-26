import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SubscriptionCardProps {
  title: string;
  status: string;
  description: string;
  onUpgrade?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  title, 
  status, 
  description, 
  onUpgrade 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Subscription</Text>
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionTitle}>{title}</Text>
          <Text style={styles.subscriptionStatus}>{status}</Text>
        </View>
        <Text style={styles.subscriptionDescription}>
          {description}
        </Text>
        {onUpgrade && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Verified Golfer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});