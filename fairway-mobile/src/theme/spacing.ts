/**
 * Spacing system for consistent layout
 * Based on 4px grid system
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  huge: 40,
  massive: 60,
};

/**
 * Common padding configurations
 */
export const padding = {
  screen: spacing.xl,           // 20px - standard screen padding
  card: spacing.xl,             // 20px - card inner padding
  cardVertical: spacing.lg,     // 16px - card vertical padding
  button: spacing.lg,           // 16px - button padding
  input: spacing.lg,            // 16px - input padding
  section: spacing.xxxl,        // 30px - section spacing
};

/**
 * Common margin configurations
 */
export const margin = {
  cardBottom: spacing.xl,       // 20px - space between cards
  sectionBottom: spacing.xxxl,  // 30px - space between sections
  itemBottom: spacing.sm,       // 8px - space between list items
  elementBottom: spacing.md,    // 12px - space between form elements
};