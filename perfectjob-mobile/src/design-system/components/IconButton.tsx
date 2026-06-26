import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon, { IconProps } from '@/components/ui/Icon';
import { colors } from '@/design-system/tokens/colors';
import { radius } from '@/design-system/tokens/radius';

export type IconButtonVariant = 'neutral' | 'transparent';

export interface IconButtonProps {
  icon: IconProps;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
}

const ICON_COLOR = colors.neutral[800];


export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'neutral',
  style,
  hitSlop = 8,
}) => {
  const variantStyle = variant === 'neutral' ? styles.neutral : styles.transparent;
  const mergedIcon: IconProps = { color: ICON_COLOR, ...icon };
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
      activeOpacity={0.7}
      style={[styles.base, variantStyle, style]}
    >
      <Icon {...mergedIcon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutral: { backgroundColor: colors.neutral[100] },
  transparent: { backgroundColor: 'transparent' },
});

export default IconButton;
