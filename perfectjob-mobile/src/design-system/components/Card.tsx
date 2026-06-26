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
