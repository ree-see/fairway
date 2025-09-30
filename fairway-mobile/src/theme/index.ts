/**
 * Central theme configuration
 * Import this file to access all theme tokens
 */

import { colors } from './colors';
import { spacing, padding, margin } from './spacing';
import { fontSize, fontWeight, lineHeight, textStyles } from './typography';
import { shadows } from './shadows';
import { borderRadius, radius } from './borderRadius';

/**
 * Main theme object
 * Use this throughout the application for consistent styling
 */
export const theme = {
  colors,
  spacing,
  padding,
  margin,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
  shadows,
  borderRadius,
  radius,
};

// Export individual modules for direct imports if needed
export { colors } from './colors';
export { spacing, padding, margin } from './spacing';
export { fontSize, fontWeight, lineHeight, textStyles } from './typography';
export { shadows } from './shadows';
export { borderRadius, radius } from './borderRadius';

// Type definitions for TypeScript
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Typography = typeof textStyles;