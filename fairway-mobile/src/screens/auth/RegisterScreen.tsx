import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim() || 
        !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await register({
      ...formData,
      email: formData.email.trim().toLowerCase(),
    });
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.message || 'Please try again');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.titleText}>Create Your Account</Text>
          <Text style={styles.subtitleText}>Join The Verified Handicap community</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="First Name"
              value={formData.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Last Name"
              value={formData.last_name}
              onChangeText={(value) => updateField('last_name', value)}
              autoCapitalize="words"
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number (Optional)"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            passwordRules="minlength: 6;"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
          />

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666666',
  },
  loginLink: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
});