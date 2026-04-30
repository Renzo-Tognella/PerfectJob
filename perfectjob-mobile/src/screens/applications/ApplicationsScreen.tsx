import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import Icon from '@/components/ui/Icon';

export type ApplicationStatus = 'pending' | 'reviewed' | 'rejected' | 'hired';

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedAt: string;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pendente', bg: colors.warning.light, text: colors.warning.dark },
  reviewed: { label: 'Em análise', bg: colors.info.light, text: colors.info.dark },
  rejected: { label: 'Recusado', bg: colors.error.light, text: colors.error.dark },
  hired: { label: 'Contratado', bg: colors.success.light, text: colors.success.dark },
};

const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1', jobTitle: 'Desenvolvedor React Native', company: 'TechCorp',
    status: 'pending', appliedAt: '2025-04-20',
  },
  {
    id: '2', jobTitle: 'Engenheiro de Software', company: 'InovaLabs',
    status: 'reviewed', appliedAt: '2025-04-18',
  },
  {
    id: '3', jobTitle: 'Fullstack Developer', company: 'StartupXYZ',
    status: 'rejected', appliedAt: '2025-04-10',
  },
  {
    id: '4', jobTitle: 'Tech Lead Mobile', company: 'BigTech',
    status: 'hired', appliedAt: '2025-03-28',
  },
];

interface ApplicationsScreenProps {
  applications?: Application[];
}

const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  applications = MOCK_APPLICATIONS,
}) => {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: Application }) => {
    const config = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('JobDetail', { slug: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {item.jobTitle}
              </Text>
              <Text style={styles.company}>{item.company}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: config.bg }]}>
              <Text style={[styles.badgeText, { color: config.text }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>Candidatado em {item.appliedAt}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (applications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas Candidaturas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon family="Ionicons" name="document-text" size={48} color={colors.neutral[300]} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma candidatura</Text>
          <Text style={styles.emptySubtitle}>
            Você ainda não se candidatou a nenhuma vaga. Explore as vagas e
            candidate-se!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Candidaturas</Text>
      </View>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[3],
  },
  headerTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900],
  },
  listContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[6] },
  card: {
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing[5], marginBottom: spacing[3],
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing[3],
  },
  cardInfo: { flex: 1, marginRight: spacing[3] },
  jobTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900], marginBottom: spacing[1],
  },
  company: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500] },
  badge: { paddingVertical: spacing[1], paddingHorizontal: spacing[3], borderRadius: 9999 },
  badgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold as any,
  },
  date: { fontSize: typography.fontSize.caption, color: colors.neutral[400] },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIcon: { marginBottom: spacing[4] },
  emptyTitle: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[800], marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body, color: colors.neutral[500],
    textAlign: 'center',
  },
});

export default ApplicationsScreen;
