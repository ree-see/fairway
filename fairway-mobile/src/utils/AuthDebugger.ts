import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthDebugger {
  static async debugStoredTokens(): Promise<void> {
    try {
      const tokens = await AsyncStorage.multiGet([
        'access_token',
        'refresh_token',
        'user'
      ]);

      console.log('=== AUTH DEBUG INFO ===');
      tokens.forEach(([key, value]) => {
        if (value) {
          if (key === 'user') {
            try {
              const user = JSON.parse(value);
              console.log(`${key}:`, { id: user.id, email: user.email });
            } catch {
              console.log(`${key}:`, 'Invalid JSON');
            }
          } else {
            // Show first/last few characters of token for security
            const truncated = value.length > 20 
              ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}`
              : value;
            console.log(`${key}:`, truncated);
          }
        } else {
          console.log(`${key}:`, 'NULL');
        }
      });
      console.log('=====================');
    } catch (error) {
      console.error('Auth debug failed:', error);
    }
  }

  static async clearAllAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      console.log('All auth tokens cleared');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }
}

export default AuthDebugger;