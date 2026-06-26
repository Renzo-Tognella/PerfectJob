import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';

export interface StickyBottomBarProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}


export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: spacing[5] + insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
});

export default StickyBottomBar;
