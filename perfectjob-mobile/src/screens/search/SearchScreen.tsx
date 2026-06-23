import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors } from '@/design-system/tokens/colors'
import { typography } from '@/design-system/tokens/typography'
import { spacing } from '@/design-system/tokens/spacing'
import { radius } from '@/design-system/tokens/radius'
import { Job } from '@/types'
import { useSearchJobs } from '@/hooks/useJobs'
import { useFilterStore } from '@/store/useFilterStore'
import JobList from './components/JobList'
import FilterSheet, { Filters } from './components/FilterSheet'
import Icon from '@/components/ui/Icon'

const FILTERS = [
  'Todas as vagas', 'Remoto', 'Híbrido', 'Presencial',
  'Sênior', 'Pleno', 'Júnior',
]

const WORK_MODEL_MAP: Record<string, string> = {
  'Remoto': 'REMOTE',
  'Híbrido': 'HYBRID',
  'Presencial': 'ON_SITE',
}

const LEVEL_MAP: Record<string, string> = {
  'Júnior': 'JUNIOR',
  'Pleno': 'MID',
  'Sênior': 'SENIOR',
}

const SearchScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const initialQuery: string = route.params?.query ?? route.params?.category ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [activeFilter, setActiveFilter] = useState('Todas as vagas')

  // Pre-fill / update the search when navigated with a query (e.g. from Home).
  useEffect(() => {
    const incoming = route.params?.query ?? route.params?.category
    if (incoming) {
      setQuery(incoming)
    }
  }, [route.params?.query, route.params?.category])
  const [filterVisible, setFilterVisible] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<Filters>({
    workModel: [],
    level: [],
    salaryMin: '',
    salaryMax: '',
    location: '',
  })

  const searchParams = {
    keyword: query || undefined,
    workModel: advancedFilters.workModel.length > 0
      ? advancedFilters.workModel.map((m) => WORK_MODEL_MAP[m] || m).join(',')
      : activeFilter in WORK_MODEL_MAP
        ? WORK_MODEL_MAP[activeFilter]
        : activeFilter in LEVEL_MAP
          ? undefined
          : undefined,
    experienceLevel: advancedFilters.level.length > 0
      ? advancedFilters.level.map((l) => LEVEL_MAP[l] || l).join(',')
      : activeFilter in LEVEL_MAP
        ? LEVEL_MAP[activeFilter]
        : undefined,
    minSalary: advancedFilters.salaryMin ? Number(advancedFilters.salaryMin) : undefined,
    size: 20,
  }

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useSearchJobs(searchParams as any)

  const jobs = data?.pages?.flatMap((p) => p.jobs) || []
  const totalElements = data?.pages?.[0]?.totalElements || 0

  const hasAdvancedFilters =
    advancedFilters.workModel.length > 0 ||
    advancedFilters.level.length > 0 ||
    advancedFilters.salaryMin !== '' ||
    advancedFilters.salaryMax !== '' ||
    advancedFilters.location !== ''

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: (job as any).slug })
  }

  const handleChipPress = (item: string) => {
    setActiveFilter(item)
    setAdvancedFilters({
      workModel: [],
      level: [],
      salaryMin: '',
      salaryMax: '',
      location: '',
    })
  }

  const handleApplyFilters = (filters: Filters) => {
    setAdvancedFilters(filters)
    setActiveFilter('Todas as vagas')
    setFilterVisible(false)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <Icon family="Feather" name="search" size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.input}
            placeholder="O que você procura?"
            placeholderTextColor={colors.neutral[400]}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon family="MaterialIcons" name="close" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasAdvancedFilters && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Icon family="Feather" name="settings" size={20} color={hasAdvancedFilters ? colors.primary[500] : colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => {
          const isActive = activeFilter === item
          return (
            <TouchableOpacity
              onPress={() => handleChipPress(item)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      <Text style={styles.resultsText}>
        {isLoading ? 'Buscando...' : `${totalElements} vaga${totalElements !== 1 ? 's' : ''} encontrada${totalElements !== 1 ? 's' : ''}`}
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <JobList
          jobs={jobs}
          onJobPress={handleJobPress}
          onRefresh={handleRefresh}
          refreshing={isRefetching}
          onEndReached={handleLoadMore}
          loadingMore={isFetchingNextPage}
        />
      )}

      <FilterSheet
        visible={filterVisible}
        initialFilters={advancedFilters}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2],
    gap: spacing[2],
  },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3], height: 48,
    gap: spacing[2],
  },
  input: {
    flex: 1, fontSize: typography.fontSize.body,
    color: colors.neutral[900], height: '100%',
  },
  filterBtn: {
    width: 48, height: 48, borderRadius: radius.lg,
    backgroundColor: colors.white, borderWidth: 1.5,
    borderColor: colors.neutral[200],
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  chipList: { paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  chip: {
    height: 36,
    paddingVertical: 0, paddingHorizontal: spacing[4],
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.neutral[300],
    marginRight: spacing[2],
    alignItems: 'center', justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  chipText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.neutral[700],
  },
  chipTextActive: { color: colors.white },
  resultsText: {
    fontSize: typography.fontSize.bodySm, color: colors.neutral[500],
    paddingHorizontal: spacing[4], marginTop: spacing[4], marginBottom: spacing[2],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
})

export default SearchScreen
