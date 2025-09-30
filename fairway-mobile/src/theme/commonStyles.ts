/**
 * Reusable style utilities and common component styles
 */

import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing, padding, margin } from './spacing';
import { fontSize, fontWeight, textStyles } from './typography';
import { shadows } from './shadows';
import { borderRadius, radius } from './borderRadius';

/**
 * Common container styles
 */
export const containers = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  contentContainer: {
    padding: padding.screen,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

/**
 * Common card styles
 */
export const cards = StyleSheet.create({
  baseCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.card,
    padding: padding.card,
    ...shadows.md,
  },

  statCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.card,
    padding: padding.cardVertical,
    alignItems: 'center',
  },

  sectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.card,
    padding: padding.card,
    marginBottom: margin.cardBottom,
    ...shadows.md,
  },
});

/**
 * Common button styles
 */
export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.button,
    padding: padding.button,
    alignItems: 'center',
  },

  secondary: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.button,
    padding: padding.button,
    alignItems: 'center',
    ...shadows.sm,
  },

  danger: {
    backgroundColor: colors.status.error,
    borderRadius: radius.button,
    padding: padding.button,
    alignItems: 'center',
  },

  outline: {
    backgroundColor: 'transparent',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary.main,
    padding: padding.button,
    alignItems: 'center',
  },
});

/**
 * Common text styles
 */
export const text = StyleSheet.create({
  // Headers
  h1: {
    ...textStyles.h1,
    color: colors.text.primary,
  },

  h2: {
    ...textStyles.h2,
    color: colors.text.primary,
  },

  h3: {
    ...textStyles.h3,
    color: colors.text.primary,
  },

  h4: {
    ...textStyles.h4,
    color: colors.text.primary,
  },

  // Body text
  body: {
    ...textStyles.body,
    color: colors.text.primary,
  },

  bodySecondary: {
    ...textStyles.body,
    color: colors.text.secondary,
  },

  bodySmall: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
  },

  caption: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },

  captionSmall: {
    ...textStyles.tiny,
    color: colors.text.tertiary,
  },

  // Section titles
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  // Stat values
  statValue: {
    ...textStyles.statMedium,
    color: colors.primary.main,
  },

  statLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Button text
  buttonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },

  buttonTextLarge: {
    ...textStyles.buttonLarge,
    color: colors.text.inverse,
  },

  // Status text
  errorText: {
    ...textStyles.body,
    color: colors.status.error,
  },

  successText: {
    ...textStyles.body,
    color: colors.status.success,
  },
});

/**
 * Common input styles
 */
export const inputs = StyleSheet.create({
  base: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.input,
    padding: padding.input,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.ui.border,
    color: colors.text.primary,
  },

  label: {
    ...textStyles.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
});

/**
 * Common layout utilities
 */
export const layout = StyleSheet.create({
  flex1: {
    flex: 1,
  },

  row: {
    flexDirection: 'row',
  },

  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Common gaps
  gap4: {
    gap: spacing.xs,
  },

  gap8: {
    gap: spacing.sm,
  },

  gap12: {
    gap: spacing.md,
  },

  gap16: {
    gap: spacing.lg,
  },

  // Common margins
  mb8: {
    marginBottom: spacing.sm,
  },

  mb12: {
    marginBottom: spacing.md,
  },

  mb16: {
    marginBottom: spacing.lg,
  },

  mb20: {
    marginBottom: spacing.xl,
  },
});

/**
 * Common badge/chip styles
 */
export const badges = StyleSheet.create({
  success: {
    backgroundColor: colors.status.success,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  successText: {
    ...textStyles.captionBold,
    color: colors.text.inverse,
  },

  verified: {
    backgroundColor: colors.functional.verified,
    borderRadius: borderRadius.round,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  verifiedText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: fontWeight.bold,
  },
});