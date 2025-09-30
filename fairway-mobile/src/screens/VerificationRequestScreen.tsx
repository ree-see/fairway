import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import VerificationService from '../services/VerificationService';

type RouteParams = {
  VerificationRequest: {
    roundId: string;
    playerName: string;
    courseName: string;
    score: number;
  };
};

export const VerificationRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'VerificationRequest'>>();
  const { roundId, playerName, courseName, score } = route.params;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verifierName, setVerifierName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneNumberChange = (text: string) => {
    // Auto-format phone number as user types
    const digits = text.replace(/\D/g, '');
    let formatted = digits;

    if (digits.length >= 10) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    setPhoneNumber(formatted);
  };

  const handleSendRequest = async () => {
    // Validate phone number
    const validation = VerificationService.validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      Alert.alert('Invalid Phone Number', validation.error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await VerificationService.sendVerificationRequest(
        roundId,
        phoneNumber,
        verifierName || undefined
      );

      if (result.success) {
        Alert.alert(
          'Verification Request Sent!',
          `A text message has been sent to ${VerificationService.formatPhoneNumber(phoneNumber)}. They can verify your round by clicking the link (no app required).`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification request');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Request Verification</Text>
          <Text style={styles.subtitle}>
            Send a verification request to your playing partner via text message
          </Text>
        </View>

        {/* Round Info Card */}
        <View style={styles.roundCard}>
          <Text style={styles.roundLabel}>Your Round</Text>
          <Text style={styles.courseName}>{courseName}</Text>
          <View style={styles.roundDetails}>
            <View style={styles.roundDetailItem}>
              <Text style={styles.roundDetailLabel}>Score</Text>
              <Text style={styles.roundDetailValue}>{score}</Text>
            </View>
            <View style={styles.roundDetailDivider} />
            <View style={styles.roundDetailItem}>
              <Text style={styles.roundDetailLabel}>Player</Text>
              <Text style={styles.roundDetailValue}>{playerName}</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              placeholderTextColor="#888"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={14}
              autoFocus
            />
            <Text style={styles.hint}>
              They'll receive a text with a verification link (no app required)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verifier's Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#888"
              value={verifierName}
              onChangeText={setVerifierName}
              autoCapitalize="words"
            />
            <Text style={styles.hint}>
              Helps you remember who verified your round
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              1. Your playing partner receives a text message{'\n'}
              2. They tap the link (opens in their browser){'\n'}
              3. They verify your score with one tap{'\n'}
              4. Your round is instantly verified!
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendRequest}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.sendButtonText}>Send Verification Request</Text>
              <Text style={styles.sendButtonEmoji}>📤</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EEEEEE',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 22,
  },
  roundCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  roundLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  roundDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  roundDetailDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  roundDetailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  roundDetailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EEE',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EEE',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#EEE',
    borderWidth: 2,
    borderColor: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    lineHeight: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  infoEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#AAA',
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  sendButtonEmoji: {
    fontSize: 18,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});

export default VerificationRequestScreen;