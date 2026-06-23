import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '@/design-system/tokens';
import { Card } from '@/design-system/components/Card';
import { EmptyState } from '@/design-system/components/EmptyState';
import { useResumes } from '@/hooks/useResumes';
import { useIsBackendReachable } from '@/hooks/useHealthCheck';
import { toResume, type ResumeView } from '@/services/api/mappers';
import Icon from '@/components/ui/Icon';

const ResumesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useResumes();
  const isBackendReachable = useIsBackendReachable();

  const resumes: ResumeView[] =
    data?.pages.flatMap((page) => page.content.map(toResume)) ?? [];

  const handleViewPdf = useCallback(
    (item: ResumeView) => {
      if (!isBackendReachable) return;
      navigation.navigate('ResumePreview', { resumeId: item.id });
    },
    [navigation, isBackendReachable]
  );

  const renderItem = useCallback(
    ({ item }: { item: ResumeView }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardTouchable}
        onPress={() => handleViewPdf(item)}
        disabled={!isBackendReachable}
        accessibilityRole="button"
        accessibilityLabel={`Ver currículo para ${item.jobTitle}`}
      >
        <Card>
          <View style={styles.cardHeader}>
            <Icon
              family="Ionicons"
              name="document-text"
              size={36}
              color={colors.primary[500]}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.jobTitle}
              </Text>
              <Text style={styles.date}>Gerado em {item.createdAtLabel}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewPdfBtn, !isBackendReachable && styles.viewPdfBtnDisabled]}
            onPress={() => handleViewPdf(item)}
            activeOpacity={0.85}
            disabled={!isBackendReachable}
          >
            <Text style={styles.viewPdfBtnText}>
              {isBackendReachable ? 'Ver PDF' : 'Sem conexão'}
            </Text>
          </TouchableOpacity>
        </Card>
      </TouchableOpacity>
    ),
    [handleViewPdf, isBackendReachable]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }, [isFetchingNextPage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Currículos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <EmptyState
            icon={<ActivityIndicator size="large" color={colors.primary[500]} />}
            title="Carregando currículos..."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Currículos</Text>
        </View>
        <EmptyState
          icon={<Icon family="Ionicons" name="cloud-offline-outline" size={48} color={colors.neutral[400]} />}
          title="Não foi possível carregar"
          description="Verifique sua conexão e tente novamente."
          action={{ label: 'Tentar novamente', onPress: () => refetch() }}
        />
      </SafeAreaView>
    );
  }

  if (resumes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Currículos</Text>
        </View>
        <EmptyState
          icon={<Icon family="Ionicons" name="document-text-outline" size={48} color={colors.neutral[400]} />}
          title="Nenhum currículo gerado"
          description="Explore as vagas e gere seu primeiro currículo!"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Currículos</Text>
      </View>
      <FlatList
        data={resumes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[3],
  },
  headerTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900],
  },
  listContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[6] },
  footer: { paddingVertical: spacing[4], alignItems: 'center' },
  cardTouchable: {
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing[4],
  },
  cardInfo: { flex: 1, marginLeft: spacing[3] },
  jobTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900], marginBottom: spacing[1],
  },
  date: { fontSize: typography.fontSize.caption, color: colors.neutral[400] },
  viewPdfBtn: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: radius.sm2,
    alignItems: 'center',
  },
  viewPdfBtnDisabled: {
    backgroundColor: colors.neutral[300],
  },
  viewPdfBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
  loadingContainer: { flex: 1 },
});

export default ResumesScreen;
