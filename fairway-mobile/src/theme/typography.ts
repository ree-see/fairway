/**
 * Typography system for consistent text styling
 */

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: 'bold' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

/**
 * Common text style configurations
 */
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
  },

  // Body text
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  bodyBold: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },

  // Special text
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  captionBold: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.normal,
  },
  tiny: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },

  // Stat values
  statLarge: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  statMedium: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },

  // Button text
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.normal,
  },
  buttonLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
  },
};