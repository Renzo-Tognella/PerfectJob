import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { radius } from '@/design-system/tokens/radius';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}


export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>{icon}</View>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {action ? (
      <TouchableOpacity style={styles.actionBtn} onPress={action.onPress} activeOpacity={0.8}>
        <Text style={styles.actionBtnText}>{action.label}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { marginBottom: spacing[4] },
  title: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  actionBtn: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  actionBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
  },
});

export default EmptyState;
