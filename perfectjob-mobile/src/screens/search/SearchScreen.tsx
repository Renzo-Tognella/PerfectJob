import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { Job } from '@/types';
import JobList from './components/JobList';
import FilterSheet from './components/FilterSheet';

const FILTERS = [
  'Todas as vagas',
  'Remoto',
  'Híbrido',
  'Presencial',
  'Sênior',
  'Pleno',
  'Júnior',
];

const MOCK_JOBS: Job[] = Array.from({ length: 20 }).map((_, i) => ({
  id: String(i + 1),
  title: `Vaga de Desenvolvedor ${i + 1}`,
  company: `Empresa ${i + 1}`,
  location: ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Remoto'][i % 3],
  salary: `R$ ${(8 + (i % 5))}.000`,
  workModel: (['Remoto', 'Híbrido', 'Presencial'] as const)[i % 3],
  level: (['Júnior', 'Pleno', 'Sênior'] as const)[i % 3],
  contractType: ['CLT', 'PJ', 'Freelance'][i % 3],
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  requirements: ['React Native', 'TypeScript', 'Node.js'],
  benefits: ['Vale refeição', 'Plano de saúde', 'Horário flexível'],
  skills: ['React Native', 'TypeScript', 'Node.js'],
}));

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas as vagas');
  const [filterVisible, setFilterVisible] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase());

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
    setTimeout(() => {
      const next = Array.from({ length: 10 }).map((_, i) => ({
        id: `${jobs.length + i + 1}`,
        title: `Vaga de Desenvolvedor ${jobs.length + i + 1}`,
        company: `Empresa ${jobs.length + i + 1}`,
        location: ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Remoto'][i % 3],
        salary: `R$ ${(8 + (i % 5))}.000`,
        workModel: (['Remoto', 'Híbrido', 'Presencial'] as const)[i % 3],
        level: (['Júnior', 'Pleno', 'Sênior'] as const)[i % 3],
        contractType: ['CLT', 'PJ', 'Freelance'][i % 3],
        description: 'Nova vaga carregada via infinite scroll.',
        requirements: ['React Native', 'TypeScript', 'Node.js'],
        benefits: ['Vale refeição', 'Plano de saúde', 'Horário flexível'],
        skills: ['React Native', 'TypeScript', 'Node.js'],
      }));
      setJobs((prev) => [...prev, ...next]);
      setLoadingMore(false);
    }, 1000);
  }, [jobs.length, loadingMore]);

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: job.id });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="O que você procura?"
            placeholderTextColor={colors.neutral[400]}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
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
              onPress={() => setActiveFilter(item)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
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
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => {
          console.log('Filtros aplicados:', filters);
          setFilterVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: spacing[3],
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    height: '100%',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  chipList: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 9999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    marginRight: spacing[2],
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.neutral[700],
  },
  chipTextActive: {
    color: colors.white,
  },
  resultsText: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[500],
    paddingHorizontal: spacing[4],
    marginVertical: spacing[3],
  },
});

export default SearchScreen;
