import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { useHealthCheck } from '@/hooks/useHealthCheck';

interface ConnectionBannerProps {
  topInset?: number;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ topInset = 0 }) => {
  const { isFetching, refetch } = useHealthCheck();
  const { data } = useHealthCheck();
  const reachable = data !== false;

  if (reachable) return null;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { paddingTop: topInset }]}>
      <View style={styles.banner}>
        <Text style={styles.icon}>!</Text>
        <View style={styles.textCol}>
          <Text style={styles.title}>Sem conexão com o servidor</Text>
          <Text style={styles.subtitle}>Tentaremos reconectar automaticamente</Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          disabled={isFetching}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.action}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.actionText}>Tentar novamente</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.error.DEFAULT, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    backgroundColor: colors.error.DEFAULT,
  },
  icon: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.white,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  textCol: { flex: 1 },
  title: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  subtitle: {
    color: colors.white,
    fontSize: typography.fontSize.bodySm,
    opacity: 0.9,
    marginTop: 2,
  },
  action: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    color: colors.white,
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold as '600',
  },
});

export default ConnectionBanner;
