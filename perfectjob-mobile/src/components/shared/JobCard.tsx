import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ViewStyle,
} from 'react-native';
import { Job } from '../../types';
import { colors } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import Icon from '../../components/ui/Icon';

interface JobCardProps {
  job: Job;
  onPress?: (job: Job) => void;
  style?: ViewStyle;
  saved?: boolean;
  onToggleSave?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job, onPress, style, saved, onToggleSave,
}) => {
  const isEnhanced = !!job.workModel || !!job.level || !!job.contractType || !!job.salary;

  if (isEnhanced) {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onPress?.(job)}
        style={[styles.container, style]}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{job.company.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          </View>
          {onToggleSave && (
            <TouchableOpacity
              onPress={() => onToggleSave(job)}
              style={styles.saveBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={saved ? 'favorite' : 'favorite-border'}
                size={22}
                color={saved ? colors.accent[500] : colors.neutral[400]}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.meta}>{job.location}</Text>
          {job.workModel && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.meta}>{job.workModel}</Text>
            </>
          )}
        </View>

        <View style={styles.badgeRow}>
          {job.level && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.level}</Text>
            </View>
          )}
          {job.contractType && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.contractType}</Text>
            </View>
          )}
          {job.salary && (
            <View style={[styles.badge, styles.salaryBadge]}>
              <Text style={[styles.badgeText, styles.salaryBadgeText]}>{job.salary}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Legacy layout
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => onPress?.(job)}
      style={[styles.legacyCard, style]}
    >
      <View style={styles.legacyRow}>
        <View style={styles.legacyLogo}>
          <Text style={styles.legacyLogoText}>{job.company.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.legacyContent}>
          <Text style={styles.legacyTitle}>{job.title}</Text>
          <Text style={styles.legacyCompanyLocation}>
            {job.company} • {job.location}
          </Text>
          {job.salaryRange && (
            <Text style={styles.legacySalary}>{job.salaryRange}</Text>
          )}
          {job.skills && job.skills.length > 0 && (
            <View style={styles.legacySkillsRow}>
              {job.skills.map((skill, index) => (
                <View key={index} style={styles.legacySkillTag}>
                  <Text style={styles.legacySkillText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.legacyBottomRow}>
            {job.postedAt && (
              <Text style={styles.legacyTimeAgo}>{job.postedAt}</Text>
            )}
            {job.matchPercentage && job.matchPercentage > 0 ? (
              <View style={styles.legacyMatchBadge}>
                <Text style={styles.legacyMatchText}>{job.matchPercentage}% compatível</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white, borderRadius: 14, padding: spacing[5],
    marginBottom: spacing[3], borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] },
  logo: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
  },
  logoText: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.primary[500],
  },
  headerInfo: { flex: 1 },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900], marginBottom: spacing[1],
  },
  company: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500] },
  saveBtn: { padding: spacing[1] },
  row: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3],
  },
  meta: { fontSize: typography.fontSize.bodySm, color: colors.neutral[600] },
  dot: {
    fontSize: typography.fontSize.bodySm, color: colors.neutral[400],
    marginHorizontal: spacing[2],
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  badge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing[1], paddingHorizontal: spacing[3],
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.neutral[700],
  },
  salaryBadge: { backgroundColor: colors.success.light },
  salaryBadgeText: { color: colors.success.dark },
  legacyCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: spacing[5],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    marginBottom: spacing[3], borderWidth: 1, borderColor: colors.neutral[100],
  },
  legacyRow: { flexDirection: 'row' },
  legacyLogo: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
  },
  legacyLogoText: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.primary[500],
  },
  legacyContent: { flex: 1 },
  legacyTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900], marginBottom: spacing[1],
  },
  legacyCompanyLocation: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[600], marginBottom: spacing[1],
  },
  legacySalary: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[700], marginBottom: spacing[2],
  },
  legacySkillsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1],
    marginBottom: spacing[2],
  },
  legacySkillTag: {
    backgroundColor: colors.primary[50], borderRadius: 9999,
    paddingVertical: spacing[1] / 2, paddingHorizontal: spacing[2],
  },
  legacySkillText: {
    fontSize: typography.fontSize.caption,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium as any,
  },
  legacyBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  legacyTimeAgo: { fontSize: typography.fontSize.caption, color: colors.neutral[500] },
  legacyMatchBadge: {
    backgroundColor: colors.success.light, borderRadius: 9999,
    paddingVertical: spacing[1] / 2, paddingHorizontal: spacing[2],
  },
  legacyMatchText: {
    fontSize: typography.fontSize.caption, color: colors.success.dark,
    fontWeight: typography.fontWeight.semibold as any,
  },
});

export default JobCard;
