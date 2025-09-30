/**
 * Color palette for the application
 * Following Material Design dark theme guidelines
 */

export const colors = {
  // Primary Colors
  primary: {
    main: '#4CAF50',      // Bright green - primary brand color
    dark: '#2E7D32',      // Darker green variant
    light: '#81C784',     // Lighter green variant
  },

  // Background Colors
  background: {
    primary: '#121212',   // Main app background
    secondary: '#1E1E1E', // Card/elevated surface background
    tertiary: '#2A2A2A',  // Input fields, higher elevation surfaces
  },

  // Text Colors
  text: {
    primary: '#EEEEEE',   // Main text color
    secondary: '#AAAAAA', // Secondary/subtle text
    tertiary: '#888888',  // Disabled/placeholder text
    inverse: '#FFFFFF',   // Text on dark backgrounds
  },

  // UI Element Colors
  ui: {
    border: '#3A3A3A',    // Border color for inputs/dividers
    divider: '#2A2A2A',   // Subtle dividers
    overlay: 'rgba(0, 0, 0, 0.3)', // Overlay backgrounds
  },

  // Status Colors
  status: {
    success: '#4CAF50',   // Success states
    error: '#F44336',     // Error states
    warning: '#FF9800',   // Warning states
    info: '#2196F3',      // Info states
  },

  // Functional Colors
  functional: {
    verified: '#4CAF50',  // Verified badge color
    unverified: '#666666', // Unverified/default state
  },

  // Transparent overlays
  alpha: {
    black10: 'rgba(0, 0, 0, 0.1)',
    black30: 'rgba(0, 0, 0, 0.3)',
    white05: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white80: 'rgba(255, 255, 255, 0.8)',
  },
};