import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: ColorScheme;
}

interface ColorScheme {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  ui: {
    border: string;
    divider: string;
  };
  card: {
    background: string;
    shadow: string;
  };
  button: {
    primary: string;
    secondary: string;
    active: string;
  };
  success: string;
  warning: string;
  error: string;
  primary: string;
}

const lightColors: ColorScheme = {
  background: {
    primary: '#F5F5F5',
    secondary: '#FFFFFF',
    tertiary: '#F8F9FA',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
  },
  ui: {
    border: '#E0E0E0',
    divider: '#1B5E20',
  },
  card: {
    background: '#FFFFFF',
    shadow: '#000000',
  },
  button: {
    primary: '#1B5E20',
    secondary: '#F8F9FA',
    active: '#E8F5E9',
  },
  success: '#1B5E20',
  warning: '#E65100',
  error: '#C41E3A',
  primary: '#1B5E20',
};

const darkColors: ColorScheme = {
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2C2C2C',
  },
  text: {
    primary: '#E0E0E0',
    secondary: '#B0B0B0',
    tertiary: '#808080',
    inverse: '#121212',
  },
  ui: {
    border: '#404040',
    divider: '#404040',
  },
  card: {
    background: '#1E1E1E',
    shadow: '#000000',
  },
  button: {
    primary: '#2E7D32',
    secondary: '#2C2C2C',
    active: '#1B5E20',
  },
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#D32F2F',
  primary: '#2E7D32',
};

const THEME_STORAGE_KEY = '@theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference from storage on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Save theme preference to storage when it changes
  useEffect(() => {
    if (isLoaded) {
      saveThemePreference(themeMode);
    }
  }, [themeMode, isLoaded]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeModeState('dark');
    } else if (themeMode === 'dark') {
      setThemeModeState('light');
    } else {
      // If in system mode, toggle to the opposite of current system
      setThemeModeState(systemColorScheme === 'dark' ? 'light' : 'dark');
    }
  };

  // Calculate actual dark mode state
  const isDarkMode = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
