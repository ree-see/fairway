/**
 * Border radius system for consistent rounded corners
 */

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 25,
  round: 999, // Fully rounded (pills/circles)
};

/**
 * Common border radius configurations
 */
export const radius = {
  button: borderRadius.md,      // 12px - standard button radius
  card: borderRadius.md,        // 12px - card radius
  input: borderRadius.sm,       // 8px - input field radius
  badge: borderRadius.md,       // 12px - badge/chip radius
  avatar: borderRadius.round,   // Fully round - avatar/profile pics
  tabBar: borderRadius.xxl,     // 25px - tab bar capsule
};