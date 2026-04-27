import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { Job } from '@/types';
import JobCard from '@/components/shared/JobCard';
import Icon from '@/components/ui/Icon';

interface JobListProps {
  jobs: Job[];
  onJobPress?: (job: Job) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  loadingMore?: boolean;
  contentContainerStyle?: ViewStyle;
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  onJobPress,
  onRefresh,
  refreshing,
  onEndReached,
  loadingMore,
  contentContainerStyle,
}) => {
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  }, [loadingMore]);

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Icon family="Feather" name="search" size={40} color={colors.neutral[400]} />
        </View>
        <Text style={styles.emptyTitle}>Nenhuma vaga encontrada</Text>
        <Text style={styles.emptySubtitle}>
          Tente ajustar seus filtros ou buscar por outro termo.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JobCard job={item} onPress={onJobPress} />
      )}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  footer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    marginTop: spacing[12],
  },
  emptyIcon: {
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

export default JobList;
