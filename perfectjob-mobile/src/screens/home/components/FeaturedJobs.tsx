import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Job } from '../../../types';
import JobCard from '../../../components/shared/JobCard';
import { colors } from '../../../design-system/tokens/colors';
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';

interface FeaturedJobsProps {
  jobs: Job[];
  onJobPress?: (job: Job) => void;
}

const FeaturedJobs: React.FC<FeaturedJobsProps> = ({
  jobs,
  onJobPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Vagas em Destaque</Text>
      <FlatList
        data={jobs}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <JobCard job={item} onPress={onJobPress} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900],
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  listContent: {
    paddingHorizontal: spacing[4],
  },
  cardWrapper: {
    width: 300,
    marginRight: spacing[3],
  },
});

export default FeaturedJobs;
