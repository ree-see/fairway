/**
 * Reusable style utilities and common component styles
 */

import { StyleSheet } from 'react-native';
import { theme } from './index';

/**
 * Common container styles
 */
export const containers = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  contentContainer: {
    padding: theme.padding.screen,
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
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.card,
    padding: theme.padding.card,
    ...theme.shadows.md,
  },

  statCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.card,
    padding: theme.padding.cardVertical,
    alignItems: 'center',
  },

  sectionCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.card,
    padding: theme.padding.card,
    marginBottom: theme.margin.cardBottom,
    ...theme.shadows.md,
  },
});

/**
 * Common button styles
 */
export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.radius.button,
    padding: theme.padding.button,
    alignItems: 'center',
  },

  secondary: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.button,
    padding: theme.padding.button,
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  danger: {
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.radius.button,
    padding: theme.padding.button,
    alignItems: 'center',
  },

  outline: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    padding: theme.padding.button,
    alignItems: 'center',
  },
});

/**
 * Common text styles
 */
export const text = StyleSheet.create({
  // Headers
  h1: {
    ...theme.textStyles.h1,
    color: theme.colors.text.primary,
  },

  h2: {
    ...theme.textStyles.h2,
    color: theme.colors.text.primary,
  },

  h3: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
  },

  h4: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
  },

  // Body text
  body: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
  },

  bodySecondary: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },

  bodySmall: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.primary,
  },

  caption: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
  },

  captionSmall: {
    ...theme.textStyles.tiny,
    color: theme.colors.text.tertiary,
  },

  // Section titles
  sectionTitle: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },

  // Stat values
  statValue: {
    ...theme.textStyles.statMedium,
    color: theme.colors.primary.main,
  },

  statLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Button text
  buttonText: {
    ...theme.textStyles.button,
    color: theme.colors.text.inverse,
  },

  buttonTextLarge: {
    ...theme.textStyles.buttonLarge,
    color: theme.colors.text.inverse,
  },

  // Status text
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.status.error,
  },

  successText: {
    ...theme.textStyles.body,
    color: theme.colors.status.success,
  },
});

/**
 * Common input styles
 */
export const inputs = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius.input,
    padding: theme.padding.input,
    fontSize: theme.fontSize.base,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    color: theme.colors.text.primary,
  },

  label: {
    ...theme.textStyles.bodyBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
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
    gap: theme.spacing.xs,
  },

  gap8: {
    gap: theme.spacing.sm,
  },

  gap12: {
    gap: theme.spacing.md,
  },

  gap16: {
    gap: theme.spacing.lg,
  },

  // Common margins
  mb8: {
    marginBottom: theme.spacing.sm,
  },

  mb12: {
    marginBottom: theme.spacing.md,
  },

  mb16: {
    marginBottom: theme.spacing.lg,
  },

  mb20: {
    marginBottom: theme.spacing.xl,
  },
});

/**
 * Common badge/chip styles
 */
export const badges = StyleSheet.create({
  success: {
    backgroundColor: theme.colors.status.success,
    borderRadius: theme.radius.badge,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },

  successText: {
    ...theme.textStyles.captionBold,
    color: theme.colors.text.inverse,
  },

  verified: {
    backgroundColor: theme.colors.functional.verified,
    borderRadius: theme.borderRadius.round,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  verifiedText: {
    ...theme.textStyles.caption,
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.bold,
  },
});