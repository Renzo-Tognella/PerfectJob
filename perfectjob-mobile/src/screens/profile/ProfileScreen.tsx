import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { colors } from '@/design-system/tokens/colors'
import { typography } from '@/design-system/tokens/typography'
import { spacing } from '@/design-system/tokens/spacing'
import { useAuthStore } from '@/store/useAuthStore'
import { useProfile, useUploadResume } from '@/hooks/useProfile'
import { extractErrorMessage } from '@/services/api/client'
import {
  formatLocation, formatExperiencePeriod, formatEducationTitle,
  formatEducationYears, formatYearsExperience, formatLanguage, summarizeResumeAnalysis,
} from '@/services/profile/profileFormat'
import Icon from '@/components/ui/Icon'

const ProfileScreen = () => {
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const navigation = useNavigation<any>()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const uploadResume = useUploadResume()

  const displayName = profile?.fullName || user?.fullName || 'Usuário'
  const displayEmail = profile?.email || user?.email || ''
  const location = formatLocation(profile?.locationCity, profile?.locationState)
  const yearsLabel = formatYearsExperience(profile?.yearsExperience)

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.length) return
      const asset = result.assets[0]
      uploadResume.mutate(
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
        {
          onSuccess: (analysis) => {
            Alert.alert(
              'Currículo analisado',
              `Extraímos: ${summarizeResumeAnalysis(analysis)}.\nSeu perfil foi atualizado.`,
            )
          },
          onError: (err) => Alert.alert('Erro ao analisar', extractErrorMessage(err)),
        },
      )
    } catch (err) {
      Alert.alert('Erro', extractErrorMessage(err))
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {profile?.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
        <Text style={styles.email}>{displayEmail}</Text>
        {(location || yearsLabel) ? (
          <Text style={styles.metaLine}>
            {[location, yearsLabel].filter(Boolean).join('  ·  ')}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <Icon family="Ionicons" name="create-outline" size={18} color={colors.primary[500]} />
          <Text style={styles.editText}>Editar perfil</Text>
        </TouchableOpacity>

        {isError ? (
          <TouchableOpacity style={styles.errorBox} onPress={() => refetch()}>
            <Text style={styles.errorText}>Não foi possível carregar o perfil. Toque para tentar novamente.</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.applicationsCount ?? '-'}</Text>
            <Text style={styles.statLabel}>Candidaturas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.savedJobsCount ?? '-'}</Text>
            <Text style={styles.statLabel}>Vagas salvas</Text>
          </View>
        </View>

        {/* Currículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meu Currículo</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleUploadResume}
            activeOpacity={0.8}
            disabled={uploadResume.isPending}
          >
            {uploadResume.isPending ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Icon family="Ionicons" name="document-text" size={22} color={colors.primary[500]} />
            )}
            <Text style={styles.uploadText}>
              {uploadResume.isPending ? 'Analisando currículo...' : 'Enviar currículo (PDF) e preencher perfil'}
            </Text>
          </TouchableOpacity>
          {profile?.resumeUpdatedAt ? (
            <Text style={styles.resumeHint}>
              Último currículo analisado em {new Date(profile.resumeUpdatedAt).toLocaleDateString('pt-BR')}
            </Text>
          ) : null}
        </View>

        {/* Competências */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competências</Text>
          {profile?.skills?.length ? (
            <View style={styles.chipsWrap}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhuma competência ainda. Envie seu currículo ou edite o perfil.</Text>
          )}
        </View>

        {/* Experiências */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiência Profissional</Text>
          {profile?.experiences?.length ? (
            profile.experiences.map((exp, idx) => (
              <View key={`${exp.title}-${idx}`} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{exp.title}</Text>
                {exp.company ? <Text style={styles.itemSubtitle}>{exp.company}</Text> : null}
                {formatExperiencePeriod(exp) ? (
                  <Text style={styles.itemPeriod}>{formatExperiencePeriod(exp)}</Text>
                ) : null}
                {exp.description ? <Text style={styles.itemDesc} numberOfLines={3}>{exp.description}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma experiência cadastrada.</Text>
          )}
        </View>

        {/* Formação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formação Acadêmica</Text>
          {profile?.education?.length ? (
            profile.education.map((edu, idx) => (
              <View key={`${edu.institution}-${idx}`} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{edu.institution}</Text>
                {formatEducationTitle(edu) ? <Text style={styles.itemSubtitle}>{formatEducationTitle(edu)}</Text> : null}
                {formatEducationYears(edu) ? <Text style={styles.itemPeriod}>{formatEducationYears(edu)}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma formação cadastrada.</Text>
          )}
        </View>

        {/* Idiomas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idiomas</Text>
          {profile?.languages?.length ? (
            <View style={styles.chipsWrap}>
              {profile.languages.map((lang, idx) => (
                <View key={`${lang.name}-${idx}`} style={styles.chip}>
                  <Text style={styles.chipText}>{formatLanguage(lang)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhum idioma cadastrado.</Text>
          )}
        </View>

        {/* Links */}
        {(profile?.linkedinUrl || profile?.githubUrl) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>
            {profile?.linkedinUrl ? <Text style={styles.linkText}>{profile.linkedinUrl}</Text> : null}
            {profile?.githubUrl ? <Text style={styles.linkText}>{profile.githubUrl}</Text> : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout()
            await queryClient.clear()
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[10] },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary[100],
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing[4],
    shadowColor: colors.primary[500], shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontSize: 36, fontWeight: typography.fontWeight.bold as any, color: colors.primary[500] },
  name: {
    fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900], textAlign: 'center', marginBottom: spacing[1],
  },
  headline: {
    fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.medium as any,
    color: colors.primary[600], textAlign: 'center', marginBottom: spacing[1],
  },
  email: { fontSize: typography.fontSize.bodySm, color: colors.neutral[600], textAlign: 'center' },
  metaLine: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500], textAlign: 'center', marginTop: spacing[1] },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: spacing[1],
    marginTop: spacing[3], marginBottom: spacing[5], paddingVertical: spacing[2], paddingHorizontal: spacing[4],
    borderRadius: 9999, borderWidth: 1.5, borderColor: colors.primary[200], backgroundColor: colors.primary[50],
  },
  editText: { color: colors.primary[600], fontWeight: typography.fontWeight.semibold as any, fontSize: typography.fontSize.bodySm },
  errorBox: { backgroundColor: colors.error.light, borderRadius: 10, padding: spacing[3], marginBottom: spacing[4] },
  errorText: { color: colors.error.dark, fontSize: typography.fontSize.bodySm, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing[6],
    backgroundColor: colors.white, borderRadius: 14, padding: spacing[4],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  statBox: { alignItems: 'center', paddingHorizontal: spacing[6] },
  statDivider: { width: 1, height: 32, backgroundColor: colors.neutral[200] },
  statValue: { fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.bold as any, color: colors.neutral[900] },
  statLabel: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500], marginTop: spacing[1] },
  section: { marginBottom: spacing[6] },
  sectionTitle: {
    fontSize: typography.fontSize.h5, fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900], marginBottom: spacing[3],
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1.5,
    borderColor: colors.neutral[300], borderRadius: 12, paddingVertical: spacing[4], paddingHorizontal: spacing[4],
    borderStyle: 'dashed', gap: spacing[3],
  },
  uploadText: { fontSize: typography.fontSize.body, color: colors.neutral[600], flexShrink: 1 },
  resumeHint: { fontSize: typography.fontSize.caption, color: colors.neutral[500], marginTop: spacing[2] },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { backgroundColor: colors.primary[50], borderRadius: 9999, paddingVertical: spacing[2], paddingHorizontal: spacing[3] },
  chipText: { fontSize: typography.fontSize.bodySm, color: colors.primary[700], fontWeight: typography.fontWeight.medium as any },
  itemCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: spacing[4], marginBottom: spacing[2],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  itemTitle: { fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold as any, color: colors.neutral[900] },
  itemSubtitle: { fontSize: typography.fontSize.bodySm, color: colors.neutral[700], marginTop: spacing[1] },
  itemPeriod: { fontSize: typography.fontSize.caption, color: colors.neutral[500], marginTop: spacing[1] },
  itemDesc: { fontSize: typography.fontSize.bodySm, color: colors.neutral[600], marginTop: spacing[2] },
  emptyText: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500] },
  linkText: { fontSize: typography.fontSize.bodySm, color: colors.primary[600], marginBottom: spacing[1] },
  logoutBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[4], marginTop: spacing[2] },
  logoutText: { fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold as any, color: colors.error.DEFAULT },
})

export default ProfileScreen
