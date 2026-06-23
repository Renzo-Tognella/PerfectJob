import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { radius } from '@/design-system/tokens/radius';

export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  size?: ChipSize;
  label: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_RECIPES: Record<ChipSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: spacing[1], paddingHorizontal: spacing[3] },
    text: { fontSize: typography.fontSize.caption },
  },
  md: {
    container: { paddingVertical: spacing[2], paddingHorizontal: spacing[3] },
    text: { fontSize: typography.fontSize.caption },
  },
  lg: {
    container: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
    text: { fontSize: typography.fontSize.caption },
  },
};

/**
 * Pill-shaped chip for badges, tags, skill labels.
 *
 * Defaults match the dominant pattern in the codebase: caption font, medium
 * weight, primary[700] text on primary[50] background.
 *
 * @example
 *   <Chip size="sm" label="Remoto" />
 *
 * @example
 *   <Chip size="md" label="Senior" icon={<Icon name="star" size={14} />} />
 */
export const Chip: React.FC<ChipProps> = ({
  size = 'md',
  label,
  icon,
  style,
  textStyle,
}) => {
  const recipe = SIZE_RECIPES[size];
  return (
    <View style={[styles.base, recipe.container, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, recipe.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  icon: { marginRight: spacing[1] },
  label: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium as '500',
  },
});

export default Chip;
