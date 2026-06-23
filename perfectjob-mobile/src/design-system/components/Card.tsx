import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { radius } from '@/design-system/tokens/radius';
import { shadows } from '@/design-system/tokens/shadows';

export type CardVariant = 'elevated' | 'outlined' | 'outlined-elevated' | 'flat';

export interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared surface for card-like containers across the mobile app.
 *
 * Variants:
 *  - `elevated` (default): white bg, xl radius, card shadow
 *  - `outlined`: white bg, xl radius, 1px neutral[200] border, no shadow
 *  - `outlined-elevated`: white bg, xl radius, 1px neutral[100] border, card shadow (hybrid)
 *  - `flat`: neutral[50] bg, xl radius, no shadow
 *
 * All variants apply padding[5] by default. Override via `style={{ padding: spacing[N] }}`.
 *
 * @example
 *   <Card>...</Card>
 *
 * @example
 *   <Card variant="outlined-elevated" style={{ marginBottom: spacing[3] }}>...</Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  children,
  style,
}) => {
  const variantStyle = stylesByVariant[variant];
  return <View style={[styles.base, variantStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing[5],
  },
});

const stylesByVariant = StyleSheet.create({
  elevated: {
    backgroundColor: colors.white,
    ...shadows.card,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  'outlined-elevated': {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.card,
  },
  flat: {
    backgroundColor: colors.neutral[50],
  },
});

export default Card;
