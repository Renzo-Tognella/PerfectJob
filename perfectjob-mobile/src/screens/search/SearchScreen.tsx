import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { Job } from '@/types';
import JobList from './components/JobList';
import FilterSheet, { Filters } from './components/FilterSheet';
import Icon from '@/components/ui/Icon';

const FILTERS = [
  'Todas as vagas', 'Remoto', 'Híbrido', 'Presencial',
  'Sênior', 'Pleno', 'Júnior',
];

const EMPTY_FILTERS: Filters = {
  workModel: [],
  level: [],
  salaryMin: '',
  salaryMax: '',
  location: '',
};

const MOCK_JOBS: Job[] = Array.from({ length: 20 }).map((_, i) => ({
  id: String(i + 1),
  title: `Vaga de Desenvolvedor ${i + 1}`,
  company: `Empresa ${i + 1}`,
  location: ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Remoto'][i % 3],
  salary: `R$ ${(8 + (i % 5))}.000`,
  workModel: (['Remoto', 'Híbrido', 'Presencial'] as const)[i % 3],
  level: (['Júnior', 'Pleno', 'Sênior'] as const)[i % 3],
  contractType: ['CLT', 'PJ', 'Freelance'][i % 3],
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  requirements: ['React Native', 'TypeScript', 'Node.js'],
  benefits: ['Vale refeição', 'Plano de saúde', 'Horário flexível'],
  skills: ['React Native', 'TypeScript', 'Node.js'],
}));

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas as vagas');
  const [filterVisible, setFilterVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [jobs] = useState<Job[]>(MOCK_JOBS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasAdvancedFilters =
    advancedFilters.workModel.length > 0 ||
    advancedFilters.level.length > 0 ||
    advancedFilters.salaryMin !== '' ||
    advancedFilters.salaryMax !== '' ||
    advancedFilters.location !== '';

  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase());

    if (hasAdvancedFilters) {
      let matches = matchesQuery;

      if (advancedFilters.workModel.length > 0) {
        matches = matches && !!job.workModel && advancedFilters.workModel.includes(job.workModel);
      }
      if (advancedFilters.level.length > 0) {
        matches = matches && !!job.level && advancedFilters.level.includes(job.level);
      }
      if (advancedFilters.salaryMin && job.salary) {
        const jobSalaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''), 10);
        const minNum = parseInt(advancedFilters.salaryMin, 10);
        if (!isNaN(jobSalaryNum) && !isNaN(minNum)) {
          matches = matches && jobSalaryNum >= minNum;
        }
      }
      if (advancedFilters.salaryMax && job.salary) {
        const jobSalaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''), 10);
        const maxNum = parseInt(advancedFilters.salaryMax, 10);
        if (!isNaN(jobSalaryNum) && !isNaN(maxNum)) {
          matches = matches && jobSalaryNum <= maxNum;
        }
      }
      if (advancedFilters.location) {
        matches =
          matches &&
          job.location.toLowerCase().includes(advancedFilters.location.toLowerCase());
      }
      return matches;
    }

    if (activeFilter === 'Todas as vagas') return matchesQuery;
    if (['Remoto', 'Híbrido', 'Presencial'].includes(activeFilter)) {
      return matchesQuery && job.workModel === activeFilter;
    }
    if (['Júnior', 'Pleno', 'Sênior'].includes(activeFilter)) {
      return matchesQuery && job.level === activeFilter;
    }
    return matchesQuery;
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => setLoadingMore(false), 1000);
  }, [loadingMore]);

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: job.id });
  };

  const handleChipPress = (item: string) => {
    setActiveFilter(item);
    setAdvancedFilters(EMPTY_FILTERS);
  };

  const handleApplyFilters = (filters: Filters) => {
    setAdvancedFilters(filters);
    setActiveFilter('Todas as vagas');
    setFilterVisible(false);
  };

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
          const isActive = activeFilter === item;
          return (
            <TouchableOpacity
              onPress={() => handleChipPress(item)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={styles.resultsText}>
        {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} encontrada
        {filteredJobs.length !== 1 ? 's' : ''}
      </Text>

      <JobList
        jobs={filteredJobs}
        onJobPress={handleJobPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        loadingMore={loadingMore}
      />

      <FilterSheet
        visible={filterVisible}
        initialFilters={advancedFilters}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    backgroundColor: colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3], height: 48,
    gap: spacing[2],
  },
  input: {
    flex: 1, fontSize: typography.fontSize.body,
    color: colors.neutral[900], height: '100%',
  },
  filterBtn: {
    width: 48, height: 48, borderRadius: 12,
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
    borderRadius: 9999, backgroundColor: colors.white,
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
});

export default SearchScreen;
