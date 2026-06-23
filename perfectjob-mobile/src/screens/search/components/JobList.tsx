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
import { EmptyState } from '@/design-system/components/EmptyState';
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
        <EmptyState
          icon={<Icon family="Feather" name="search" size={40} color={colors.neutral[400]} />}
          title="Nenhuma vaga encontrada"
          description="Tente ajustar seus filtros ou buscar por outro termo."
        />
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JobCard job={item} onPress={onJobPress} isSaved={false} />
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
    marginTop: spacing[12],
  },
});

export default JobList;
