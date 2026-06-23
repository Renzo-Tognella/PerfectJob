import React, { useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, typography, spacing } from '@/design-system/tokens'
import { EmptyState } from '@/design-system/components/EmptyState'
import { Job } from '@/types'
import JobCard from '@/components/shared/JobCard'
import Icon from '@/components/ui/Icon'
import { useSavedJobs, useToggleSavedJob } from '@/hooks/useSavedJobs'
import { toJob } from '@/services/api/mappers'

const SavedJobsScreen = () => {
  const navigation = useNavigation<any>()
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSavedJobs()
  const toggleSaved = useToggleSavedJob()

  const savedJobs: Job[] =
    data?.pages.flatMap((page) => page.content.map(toJob)) ?? []

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: (job as any).slug })
  }

  const handleUnsave = useCallback(
    (job: Job) => {
      Alert.alert(
        'Remover vaga',
        `Deseja remover "${job.title}" das vagas salvas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => {
              toggleSaved.mutate({ jobId: (job as any).originalId, isSaved: true })
            },
          },
        ]
      )
    },
    [toggleSaved]
  )

  const handleToggleSave = useCallback(
    (job: Job) => {
      toggleSaved.mutate({ jobId: (job as any).originalId, isSaved: true })
    },
    [toggleSaved]
  )

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <TouchableOpacity onLongPress={() => handleUnsave(item)} activeOpacity={0.9}>
        <JobCard
          job={item}
          onPress={handleJobPress}
          isSaved
          onToggleSave={handleToggleSave}
        />
      </TouchableOpacity>
    ),
    [handleUnsave, handleToggleSave]
  )

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    )
  }, [isFetchingNextPage])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vagas Salvas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <EmptyState
            icon={<ActivityIndicator size="large" color={colors.primary[500]} />}
            title="Carregando vagas..."
          />
        </View>
      </SafeAreaView>
    )
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vagas Salvas</Text>
        </View>
        <EmptyState
          icon={<Icon family="Ionicons" name="cloud-offline-outline" size={48} color={colors.neutral[400]} />}
          title="Não foi possível carregar"
          description="Verifique sua conexão e tente novamente."
          action={{ label: 'Tentar novamente', onPress: () => refetch() }}
        />
      </SafeAreaView>
    )
  }

  if (savedJobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vagas Salvas</Text>
        </View>
        <EmptyState
          icon={<Icon family="Ionicons" name="bookmark-outline" size={48} color={colors.neutral[400]} />}
          title="Nenhuma vaga salva"
          description="Toque no ícone de favorito nas vagas para salvá-las aqui."
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vagas Salvas</Text>
      </View>
      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.id}
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[3] },
  headerTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900],
  },
  listContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[6] },
  footer: { paddingVertical: spacing[4], alignItems: 'center' },
  loadingContainer: { flex: 1 },
})

export default SavedJobsScreen
