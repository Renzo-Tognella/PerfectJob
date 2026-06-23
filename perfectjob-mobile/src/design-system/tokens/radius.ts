export const radius = {
  xs: 2,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 9999,
  avatar: 48,
} as const;

export type RadiusToken = keyof typeof radius;
