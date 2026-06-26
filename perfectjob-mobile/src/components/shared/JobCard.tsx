import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ViewStyle,
} from 'react-native';
import { Job } from '../../types';
import { colors, typography, spacing, radius } from '../../design-system/tokens';
import { Card } from '../../design-system/components/Card';
import { Chip } from '../../design-system/components/Chip';
import Icon from '../../components/ui/Icon';

interface JobCardProps {
  job: Job;
  onPress?: (job: Job) => void;
  style?: ViewStyle;
  isSaved: boolean;
  onToggleSave?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job, onPress, style, isSaved, onToggleSave,
}) => {
  const isEnhanced = !!job.workModel || !!job.level || !!job.contractType || !!job.salary;

  if (isEnhanced) {
    return (
      <Card
        variant="outlined-elevated"
        style={styles.cardOuter}
      >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onPress?.(job)}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={`Vaga: ${job.title} na empresa ${job.company}`}
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
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remover vaga dos salvos' : 'Salvar vaga'}
            >
              <Icon
                name={isSaved ? 'bookmark' : 'bookmark-border'}
                size={22}
                color={isSaved ? colors.accent[500] : colors.neutral[400]}
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
            <Chip
              size="sm"
              label={job.level}
              textStyle={{ color: colors.neutral[700] }}
              style={{ backgroundColor: colors.neutral[100] }}
            />
          )}
          {job.contractType && (
            <Chip
              size="sm"
              label={job.contractType}
              textStyle={{ color: colors.neutral[700] }}
              style={{ backgroundColor: colors.neutral[100] }}
            />
          )}
          {job.salary && (
            <Chip
              size="sm"
              label={job.salary}
              textStyle={{ color: colors.success.dark }}
              style={{ backgroundColor: colors.success.light }}
            />
          )}
        </View>
      </TouchableOpacity>
      </Card>
    );
  }

  return (
    <Card variant="outlined-elevated" style={styles.cardOuter}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onPress?.(job)}
        style={style}
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
                <Chip
                  key={index}
                  size="sm"
                  label={skill}
                  style={{ paddingVertical: 2, paddingHorizontal: spacing[2] }}
                />
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
    </Card>
  );
};

const styles = StyleSheet.create({
  cardOuter: { marginBottom: spacing[3] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] },
  logo: {
    width: 44, height: 44, borderRadius: radius.lg,
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
  legacyRow: { flexDirection: 'row' },
  legacyLogo: {
    width: 44, height: 44, borderRadius: radius.sm2,
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
  legacyBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  legacyTimeAgo: { fontSize: typography.fontSize.caption, color: colors.neutral[500] },
  legacyMatchBadge: {
    backgroundColor: colors.success.light, borderRadius: radius.pill,
    paddingVertical: 2, paddingHorizontal: spacing[2],
  },
  legacyMatchText: {
    fontSize: typography.fontSize.caption, color: colors.success.dark,
    fontWeight: typography.fontWeight.semibold as any,
  },
});

export default JobCard;
