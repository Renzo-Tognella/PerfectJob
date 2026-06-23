import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { useResumes } from '@/hooks/useResumes';
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

  const resumes: ResumeView[] =
    data?.pages.flatMap((page) => page.content.map(toResume)) ?? [];

  const handleViewPdf = useCallback(
    (item: ResumeView) => {
      navigation.navigate('ResumePreview', { resumeId: item.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: ResumeView }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => handleViewPdf(item)}
        accessibilityRole="button"
        accessibilityLabel={`Ver currículo para ${item.jobTitle}`}
      >
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
          style={styles.viewPdfBtn}
          onPress={() => handleViewPdf(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.viewPdfBtnText}>Ver PDF</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleViewPdf]
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
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
          <Text style={styles.emptySubtitle}>
            Verifique sua conexão e tente novamente.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (resumes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Currículos</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon
              family="Ionicons"
              name="document-text"
              size={64}
              color={colors.neutral[300]}
            />
          </View>
          <Text style={styles.emptyTitle}>Nenhum currículo gerado</Text>
          <Text style={styles.emptySubtitle}>
            Explore as vagas e gere seu primeiro currículo!
          </Text>
        </View>
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
  card: {
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing[5], marginBottom: spacing[3],
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
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
    borderRadius: 10,
    alignItems: 'center',
  },
  viewPdfBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIcon: { marginBottom: spacing[4] },
  emptyTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[800], marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body, color: colors.neutral[500],
    textAlign: 'center', marginBottom: spacing[4],
  },
  retryBtn: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
});

export default ResumesScreen;
