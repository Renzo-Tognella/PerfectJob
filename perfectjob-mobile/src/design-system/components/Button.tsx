import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[size],
    styles[variant],
    isDisabled && styles.disabled,
  ];

  const textStyles: TextStyle[] = [
    styles.textBase,
    styles[`${variant}Text` as const],
    isDisabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? colors.primary[500] : colors.white}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  sm: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  md: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  lg: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  primary: {
    backgroundColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  accent: {
    backgroundColor: colors.accent[500],
    borderRadius: 9999,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.neutral[700],
  },
  accentText: {
    color: colors.white,
  },
  ghostText: {
    color: colors.primary[500],
  },
  disabledText: {
    color: colors.neutral[400],
  },
});

export default Button;
