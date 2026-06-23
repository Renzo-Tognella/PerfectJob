import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { radius } from '@/design-system/tokens/radius';
import { shadows } from '@/design-system/tokens/shadows';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

export interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared surface for card-like containers across the mobile app.
 *
 * @example
 *   <Card variant="elevated">
 *     <Text>Content</Text>
 *   </Card>
 *
 * @example
 *   <Card variant="outlined" style={{ marginHorizontal: spacing[4] }}>
 *     ...
 *   </Card>
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
    borderRadius: radius.lg,
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
  flat: {
    backgroundColor: colors.neutral[50],
  },
});

export default Card;
