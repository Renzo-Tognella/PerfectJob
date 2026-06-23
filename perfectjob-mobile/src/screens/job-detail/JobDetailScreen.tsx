import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, ActivityIndicator, Linking, Modal,
} from 'react-native'
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native'
import { colors, typography, spacing, radius } from '@/design-system/tokens'
import { Chip } from '@/design-system/components/Chip'
import { IconButton } from '@/design-system/components/IconButton'
import { StickyBottomBar } from '@/design-system/components/StickyBottomBar'
import { useJobDetail } from '@/hooks/useJobs'
import { useIsJobSaved, useToggleSavedJob } from '@/hooks/useSavedJobs'
import { useGenerateResume } from '@/hooks/useResumes'
import { useIsBackendReachable } from '@/hooks/useHealthCheck'
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
  const isBackendReachable = useIsBackendReachable()

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
    if (!isBackendReachable) {
      Alert.alert('Sem conexão', 'Verifique sua conexão com o servidor e tente novamente.')
      return
    }

    generateResume.mutate(
      { jobId },
      {
        onSuccess: (resume) => {
          const state = navigation.getState?.() as any
          const currentRoute = state?.routes?.[state.index]?.name
          if (currentRoute === 'ResumePreview') return
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
          <IconButton
            icon={{ family: 'MaterialIcons', name: 'arrow-back', size: 22 }}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Voltar"
          />
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
          <IconButton
            icon={{ family: 'MaterialIcons', name: 'arrow-back', size: 22 }}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Voltar"
          />
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
        <IconButton
          icon={{ family: 'MaterialIcons', name: 'arrow-back', size: 22 }}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Voltar"
        />
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
            <Chip
              size="sm"
              label={job.salary}
              textStyle={{ color: colors.neutral[700] }}
              style={{ backgroundColor: colors.neutral[100] }}
            />
          )}
          {job.workModel && (
            <Chip
              size="sm"
              label={job.workModel}
              textStyle={{ color: colors.neutral[700] }}
              style={{ backgroundColor: colors.neutral[100] }}
            />
          )}
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
                <Chip
                  key={i}
                  size="sm"
                  label={skill}
                  style={{ borderWidth: 1, borderColor: colors.primary[200] }}
                />
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

      <StickyBottomBar>
        <TouchableOpacity
          style={[
            styles.applyBtn,
            (generateResume.isPending || !isBackendReachable) && styles.applyBtnDisabled,
          ]}
          onPress={handleGenerate}
          activeOpacity={0.9}
          disabled={generateResume.isPending || !isBackendReachable}
          accessibilityRole="button"
          accessibilityLabel="Gerar currículo para esta vaga"
        >
          {!isBackendReachable ? (
            <Text style={styles.applyBtnText}>Sem conexão com o servidor</Text>
          ) : generateResume.isPending ? (
            <View style={styles.btnContent}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.applyBtnText}>Gerando currículo...</Text>
            </View>
          ) : (
            <Text style={styles.applyBtnText}>Gerar Currículo</Text>
          )}
        </TouchableOpacity>
      </StickyBottomBar>

      <Modal
        transparent
        visible={generateResume.isPending}
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.overlayTitle}>Gerando currículo...</Text>
            <Text style={styles.overlaySubtitle}>Isso pode levar até 2 minutos</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[2],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  saveBtn: {
    width: 40, height: 40, borderRadius: 20, // half of width — perfect 40×40 circle
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  logo: {
    width: 64, height: 64, borderRadius: radius.xxl,
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
  externalLinkBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingVertical: spacing[2], paddingHorizontal: spacing[3],
    marginBottom: spacing[4], borderRadius: radius.md,
    backgroundColor: colors.primary[50],
  },
  externalLinkText: {
    marginLeft: spacing[2],
    fontSize: typography.fontSize.body,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold as any,
  },
  bottomSpacer: { height: spacing[8] },
  applyBtn: {
    backgroundColor: colors.primary[500], borderRadius: radius.lg,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.7,
  },
  applyBtnText: {
    color: colors.white, fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  overlayBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6],
  },
  overlayCard: {
    backgroundColor: colors.white, borderRadius: radius.xxl,
    paddingVertical: spacing[6], paddingHorizontal: spacing[6],
    alignItems: 'center', gap: spacing[3], minWidth: 220,
  },
  overlayTitle: {
    fontSize: typography.fontSize.h5,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.neutral[900],
  },
  overlaySubtitle: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[600],
    textAlign: 'center',
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
