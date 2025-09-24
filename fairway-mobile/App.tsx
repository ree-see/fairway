import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import 'react-native-gesture-handler';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" backgroundColor="#2E7D32" />
    </AuthProvider>
  );
}
