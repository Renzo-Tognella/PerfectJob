import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, ActivityIndicator, Linking,
} from 'react-native'
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native'
import { colors } from '@/design-system/tokens/colors'
import { typography } from '@/design-system/tokens/typography'
import { spacing } from '@/design-system/tokens/spacing'
import { useJobDetail } from '@/hooks/useJobs'
import { useIsJobSaved, useToggleSavedJob } from '@/hooks/useSavedJobs'
import { useGenerateResume } from '@/hooks/useResumes'
import { extractErrorMessage } from '@/services/api/client'
import type { MainStackParamList } from '@/navigation/types'
import { useAuthStore } from '@/store/useAuthStore'
import Icon from '@/components/ui/Icon'

const JobDetailScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, 'JobDetail'>>()
  const navigation = useNavigation<any>()
  const { slug } = route.params
  const { data: job, isLoading } = useJobDetail(slug)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [jobId, setJobId] = useState<number | null>(null)

  useEffect(() => {
    if (job) {
      setJobId((job as any).originalId ?? Number(job.id))
    }
  }, [job])

  const { data: isSaved, isLoading: isSavedLoading } = useIsJobSaved(jobId ?? 0)
  const toggleSaved = useToggleSavedJob()
  const generateResume = useGenerateResume()

  const handleGenerate = () => {
    if (!isAuthenticated) {
      Alert.alert('Login necessário', 'Faça login para gerar um currículo.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Login',
          onPress: () => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Auth',
                params: { screen: 'Login' },
              }),
            )
          },
        },
      ])
      return
    }

    if (!job || jobId === null) return

    generateResume.mutate(
      { jobId },
      {
        onSuccess: (resume) => {
          navigation.navigate('ResumePreview', { resumeId: resume.id })
        },
        onError: (error) => {
          Alert.alert('Erro', extractErrorMessage(error))
        },
      }
    )
  }

  const handleToggleSave = () => {
    if (jobId === null) return
    toggleSaved.mutate(
      { jobId, isSaved: !!isSaved },
      {
        onSuccess: () => {
          Alert.alert(
            isSaved ? 'Removida' : 'Salva',
            isSaved
              ? 'Vaga removida dos salvos.'
              : 'Vaga salva com sucesso!'
          )
        },
        onError: (error) =>
          Alert.alert('Erro', extractErrorMessage(error)),
      }
    )
  }

  const handleOpenExternalUrl = () => {
    if (job?.externalUrl) {
      Linking.openURL(job.externalUrl).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o link da vaga.')
      })
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon family="MaterialIcons" name="arrow-back" size={22} color={colors.neutral[800]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    )
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon family="MaterialIcons" name="arrow-back" size={22} color={colors.neutral[800]} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Vaga não encontrada.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon family="MaterialIcons" name="arrow-back" size={22} color={colors.neutral[800]} />
        </TouchableOpacity>
        {jobId !== null && (
          <TouchableOpacity
            onPress={handleToggleSave}
            style={styles.saveBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isSavedLoading}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remover vaga dos salvos' : 'Salvar vaga'}
          >
            <Icon
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isSaved ? colors.accent[500] : colors.neutral[700]}
            />
          </TouchableOpacity>
        )}
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
          {job.salary && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.salary}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.workModel}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.level}</Text>
          </View>
          {job.contractType && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.contractType}</Text>
            </View>
          )}
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
          <Text style={styles.sectionTitle}>Habilidades</Text>
          <View style={styles.skillRow}>
            {(job.skills?.length ?? 0) > 0 ? (
              job.skills!.map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionBody}>Nenhuma habilidade informada.</Text>
            )}
          </View>
        </View>

        {job.externalUrl ? (
          <TouchableOpacity
            style={styles.externalLinkBtn}
            onPress={handleOpenExternalUrl}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="Ver vaga original"
          >
            <Icon
              family="MaterialIcons"
              name="open-in-new"
              size={18}
              color={colors.primary[500]}
            />
            <Text style={styles.externalLinkText}>Ver vaga original</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[
            styles.applyBtn,
            generateResume.isPending && styles.applyBtnDisabled,
          ]}
          onPress={handleGenerate}
          activeOpacity={0.9}
          disabled={generateResume.isPending}
          accessibilityRole="button"
          accessibilityLabel="Gerar currículo para esta vaga"
        >
          {generateResume.isPending ? (
            <View style={styles.btnContent}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.applyBtnText}>Gerando currículo...</Text>
            </View>
          ) : (
            <Text style={styles.applyBtnText}>Gerar Currículo</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[2],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
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
  externalLinkBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingVertical: spacing[2], paddingHorizontal: spacing[3],
    marginBottom: spacing[4], borderRadius: 8,
    backgroundColor: colors.primary[50],
  },
  externalLinkText: {
    marginLeft: spacing[2],
    fontSize: typography.fontSize.body,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold as any,
  },
  bottomSpacer: { height: spacing[8] },
  stickyBar: {
    borderTopWidth: 1, borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[5],
  },
  applyBtn: {
    backgroundColor: colors.primary[500], borderRadius: 12,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.7,
  },
  applyBtnText: {
    color: colors.white, fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
  },
  btnContent: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
  },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.body,
    color: colors.neutral[500],
  },
})

export default JobDetailScreen
