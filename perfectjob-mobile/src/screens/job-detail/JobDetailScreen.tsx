import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { Job } from '@/types';
import { RootStackParamList } from '@/navigation/types';
import Icon from '@/components/ui/Icon';

const MOCK_JOBS: Record<string, Job> = {
  '1': {
    id: '1', title: 'Desenvolvedor React Native', company: 'TechCorp',
    location: 'São Paulo, SP', salary: 'R$ 10.000',
    workModel: 'Híbrido', level: 'Pleno', contractType: 'CLT',
    description: 'Buscamos um desenvolvedor React Native para criar e manter aplicativos móveis de alta qualidade. Você fará parte de uma equipe ágil e colaborativa.',
    requirements: ['React Native', 'TypeScript', 'Node.js'],
    benefits: ['VR', 'Plano de saúde'],
    skills: ['React Native', 'TypeScript'],
  },
  '2': {
    id: '2', title: 'Engenheiro de Software', company: 'InovaLabs',
    location: 'Remoto', salary: 'R$ 14.000',
    workModel: 'Remoto', level: 'Sênior', contractType: 'PJ',
    description: 'Estamos em busca de um Engenheiro de Software Sênior para liderar projetos de backend com Java e Spring Boot.',
    requirements: ['Java', 'Spring Boot'],
    benefits: ['Home office'],
    skills: ['Java', 'Spring'],
  },
  '3': {
    id: '3', title: 'Product Designer', company: 'DesignStudio',
    location: 'Remoto', salary: 'R$ 8.500',
    workModel: 'Remoto', level: 'Pleno', contractType: 'CLT',
    description: 'Procuramos um Product Designer para criar experiências incríveis. Domínio de Figma e UI/UX é essencial.',
    requirements: ['Figma', 'UI/UX'],
    benefits: ['Flexible hours'],
    skills: ['Figma', 'Design'],
  },
};

const JobDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'JobDetail'>>();
  const navigation = useNavigation<any>();
  const { slug } = route.params;
  const job = MOCK_JOBS[slug] || MOCK_JOBS['1'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon family="MaterialIcons" name="arrow-back" size={22} color={colors.neutral[800]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>{job.company.charAt(0).toUpperCase()}</Text>
        </View>

        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.companyLocation}>{job.company} • {job.location}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.salary}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.workModel}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.level}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.contractType}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.sectionBody}>{job.description || 'Descrição não informada.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requisitos</Text>
          {(job.requirements?.length ?? 0) > 0 ? (
            job.requirements!.map((req, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{req}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sectionBody}>Nenhum requisito informado.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefícios</Text>
          {(job.benefits?.length ?? 0) > 0 ? (
            job.benefits!.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sectionBody}>Nenhum benefício informado.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillRow}>
            {(job.skills?.length ?? 0) > 0 ? (
              job.skills!.map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionBody}>Nenhuma skill informada.</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() =>
            Alert.alert(
              'Candidatura',
              `Deseja se candidatar para ${job.title}?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sim',
                  onPress: () => Alert.alert('Sucesso!', 'Candidatura enviada com sucesso!'),
                },
              ]
            )
          }
          activeOpacity={0.9}
        >
          <Text style={styles.applyBtnText}>Candidatar-se</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[2] },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  logo: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing[4],
  },
  logoText: { fontSize: 28, fontWeight: typography.fontWeight.bold as any, color: colors.primary[500] },
  title: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900], textAlign: 'center', marginBottom: spacing[2],
  },
  companyLocation: {
    fontSize: typography.fontSize.body, color: colors.neutral[600],
    textAlign: 'center', marginBottom: spacing[4],
  },
  badgeRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: spacing[2], marginBottom: spacing[6],
  },
  badge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing[1], paddingHorizontal: spacing[3],
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium as any, color: colors.neutral[700],
  },
  section: { marginBottom: spacing[6] },
  sectionTitle: {
    fontSize: typography.fontSize.h5,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900], marginBottom: spacing[3],
  },
  sectionBody: {
    fontSize: typography.fontSize.body, color: colors.neutral[600], lineHeight: 24,
  },
  bulletRow: { flexDirection: 'row', marginBottom: spacing[2] },
  bullet: {
    fontSize: typography.fontSize.body, color: colors.primary[500],
    marginRight: spacing[2], lineHeight: 24,
  },
  bulletText: {
    fontSize: typography.fontSize.body, color: colors.neutral[700],
    flex: 1, lineHeight: 24,
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  skillChip: {
    backgroundColor: colors.primary[50], borderWidth: 1,
    borderColor: colors.primary[200], paddingVertical: spacing[1],
    paddingHorizontal: spacing[3], borderRadius: 9999,
  },
  skillChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium as any, color: colors.primary[700],
  },
  bottomSpacer: { height: spacing[8] },
  stickyBar: {
    borderTopWidth: 1, borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[5],
  },
  applyBtn: {
    backgroundColor: '#2B5FC2', borderRadius: 12,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: {
    color: colors.white, fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
});

export default JobDetailScreen;
