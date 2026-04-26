import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { Job } from '@/types';
import JobCard from '@/components/shared/JobCard';

const MOCK_SAVED: Job[] = [
  {
    id: '1',
    title: 'Desenvolvedor React Native',
    company: 'TechCorp',
    location: 'São Paulo, SP',
    salary: 'R$ 10.000',
    workModel: 'Híbrido',
    level: 'Pleno',
    contractType: 'CLT',
  },
  {
    id: '2',
    title: 'Engenheiro de Software',
    company: 'InovaLabs',
    location: 'Remoto',
    salary: 'R$ 14.000',
    workModel: 'Remoto',
    level: 'Sênior',
    contractType: 'PJ',
  },
];

const SavedJobsScreen = () => {
  const navigation = useNavigation<any>();
  const [savedJobs, setSavedJobs] = useState<Job[]>(MOCK_SAVED);

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { slug: job.id });
  };

  const handleDelete = useCallback(
    (job: Job) => {
      Alert.alert('Remover vaga', `Deseja remover "${job.title}" das vagas salvas?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () =>
            setSavedJobs((prev) => prev.filter((j) => j.id !== job.id)),
        },
      ]);
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Job }) => (
      <TouchableOpacity
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.9}
      >
        <JobCard job={item} onPress={handleJobPress} />
      </TouchableOpacity>
    ),
    [handleDelete]
  );

  if (savedJobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vagas Salvas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyTitle}>Nenhuma vaga salva</Text>
          <Text style={styles.emptySubtitle}>
            Toque no ícone de favorito nas vagas para salvá-las aqui.
          </Text>
        </View>
      </SafeAreaView>
    );
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  headerTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[800],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

export default SavedJobsScreen;
