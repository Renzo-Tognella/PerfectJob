import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors } from '@/design-system/tokens/colors'
import { typography } from '@/design-system/tokens/typography'
import { spacing } from '@/design-system/tokens/spacing'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { extractErrorMessage } from '@/services/api/client'
import type { UpdateProfilePayload, ExperienceDto, EducationDto, LanguageDto } from '@/types/profile'
import { LANGUAGE_LEVELS } from '@/types/profile'
import Icon from '@/components/ui/Icon'

const EditProfileScreen = () => {
  const navigation = useNavigation<any>()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [phone, setPhone] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationState, setLocationState] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [bio, setBio] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [skills, setSkills] = useState('')
  const [experiences, setExperiences] = useState<ExperienceDto[]>([])
  const [education, setEducation] = useState<EducationDto[]>([])
  const [languages, setLanguages] = useState<LanguageDto[]>([])

  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName ?? '')
    setHeadline(profile.headline ?? '')
    setPhone(profile.phone ?? '')
    setLocationCity(profile.locationCity ?? '')
    setLocationState(profile.locationState ?? '')
    setYearsExperience(profile.yearsExperience != null ? String(profile.yearsExperience) : '')
    setBio(profile.bio ?? '')
    setLinkedinUrl(profile.linkedinUrl ?? '')
    setGithubUrl(profile.githubUrl ?? '')
    setSkills((profile.skills ?? []).join(', '))
    setExperiences(profile.experiences ?? [])
    setEducation(profile.education ?? [])
    setLanguages(profile.languages ?? [])
  }, [profile?.id])

  // ---- list helpers ----
  const updateExp = (i: number, patch: Partial<ExperienceDto>) =>
    setExperiences((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  const addExp = () =>
    setExperiences((prev) => [...prev, { title: '', company: '', startDate: '', endDate: '', description: '' }])
  const removeExp = (i: number) => setExperiences((prev) => prev.filter((_, idx) => idx !== i))

  const updateEdu = (i: number, patch: Partial<EducationDto>) =>
    setEducation((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  const addEdu = () =>
    setEducation((prev) => [...prev, { institution: '', degree: '', fieldOfStudy: '', startYear: null, endYear: null }])
  const removeEdu = (i: number) => setEducation((prev) => prev.filter((_, idx) => idx !== i))

  const updateLang = (i: number, patch: Partial<LanguageDto>) =>
    setLanguages((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLang = () => setLanguages((prev) => [...prev, { name: '', level: null }])
  const removeLang = (i: number) => setLanguages((prev) => prev.filter((_, idx) => idx !== i))

  const yearToText = (y?: number | null) => (y != null ? String(y) : '')
  const textToYear = (t: string): number | null => {
    const digits = t.replace(/\D/g, '')
    return digits ? Number(digits) : null
  }

  const onSave = () => {
    const parsedYears = yearsExperience.trim() ? Number(yearsExperience.trim()) : null
    if (parsedYears != null && (Number.isNaN(parsedYears) || parsedYears < 0)) {
      Alert.alert('Valor inválido', 'Anos de experiência deve ser um número.')
      return
    }
    const payload: UpdateProfilePayload = {
      fullName: fullName.trim() || undefined,
      headline: headline.trim() || null,
      phone: phone.trim() || null,
      locationCity: locationCity.trim() || null,
      locationState: locationState.trim() || null,
      yearsExperience: parsedYears,
      bio: bio.trim() || null,
      linkedinUrl: linkedinUrl.trim() || null,
      githubUrl: githubUrl.trim() || null,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      experiences: experiences
        .filter((e) => (e.title ?? '').trim())
        .map((e) => ({
          title: e.title.trim(),
          company: e.company?.trim() || null,
          startDate: e.startDate?.trim() || null,
          endDate: e.endDate?.trim() || null,
          description: e.description?.trim() || null,
        })),
      education: education
        .filter((e) => (e.institution ?? '').trim())
        .map((e) => ({
          institution: e.institution.trim(),
          degree: e.degree?.trim() || null,
          fieldOfStudy: e.fieldOfStudy?.trim() || null,
          startYear: e.startYear ?? null,
          endYear: e.endYear ?? null,
        })),
      languages: languages
        .filter((l) => (l.name ?? '').trim())
        .map((l) => ({ name: l.name.trim(), level: l.level || null })),
    }
    updateProfile.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Perfil atualizado', 'Suas informações foram salvas.')
        navigation.goBack()
      },
      onError: (err) => Alert.alert('Erro ao salvar', extractErrorMessage(err)),
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    )
  }

  const field = (
    label: string, value: string, onChange: (t: string) => void,
    opts?: { placeholder?: string; multiline?: boolean; keyboardType?: 'default' | 'numeric'; autoCapitalize?: 'none' | 'sentences' },
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, opts?.multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={opts?.placeholder}
        placeholderTextColor={colors.neutral[400]}
        multiline={opts?.multiline}
        keyboardType={opts?.keyboardType ?? 'default'}
        autoCapitalize={opts?.autoCapitalize ?? 'sentences'}
      />
    </View>
  )

  const smallInput = (
    value: string, onChange: (t: string) => void,
    placeholder: string, opts?: { keyboardType?: 'default' | 'numeric'; multiline?: boolean; flex?: number },
  ) => (
    <TextInput
      style={[styles.itemInput, opts?.multiline && styles.inputMultiline, opts?.flex ? { flex: opts.flex } : null]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.neutral[400]}
      keyboardType={opts?.keyboardType ?? 'default'}
      multiline={opts?.multiline}
    />
  )

  const sectionHeader = (title: string, onAdd: () => void) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity style={styles.addInline} onPress={onAdd} activeOpacity={0.8}>
        <Icon family="Ionicons" name="add" size={18} color={colors.primary[600]} />
        <Text style={styles.addInlineText}>Adicionar</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Editar perfil</Text>

          {field('Nome completo', fullName, setFullName, { placeholder: 'Seu nome' })}
          {field('Título profissional', headline, setHeadline, { placeholder: 'Ex: Desenvolvedor Full Stack' })}
          {field('Telefone', phone, setPhone, { placeholder: '(11) 99999-9999' })}
          {field('Cidade', locationCity, setLocationCity, { placeholder: 'São Paulo' })}
          {field('Estado', locationState, setLocationState, { placeholder: 'SP' })}
          {field('Anos de experiência', yearsExperience, setYearsExperience, { placeholder: '5', keyboardType: 'numeric' })}
          {field('Competências (separadas por vírgula)', skills, setSkills, { placeholder: 'Java, React, SQL', autoCapitalize: 'none' })}

          {/* Experiência profissional */}
          {sectionHeader('Experiência profissional', addExp)}
          {experiences.length === 0 ? <Text style={styles.emptyHint}>Nenhuma experiência. Toque em "Adicionar".</Text> : null}
          {experiences.map((exp, i) => (
            <View key={`exp-${i}`} style={styles.itemCard}>
              {smallInput(exp.title ?? '', (t) => updateExp(i, { title: t }), 'Cargo (ex: Desenvolvedor Backend)')}
              {smallInput(exp.company ?? '', (t) => updateExp(i, { company: t }), 'Empresa')}
              <View style={styles.row}>
                {smallInput(exp.startDate ?? '', (t) => updateExp(i, { startDate: t }), 'Início (ex: 2020)', { flex: 1 })}
                {smallInput(exp.endDate ?? '', (t) => updateExp(i, { endDate: t }), 'Fim (ou Atual)', { flex: 1 })}
              </View>
              {smallInput(exp.description ?? '', (t) => updateExp(i, { description: t }), 'Descrição', { multiline: true })}
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeExp(i)}>
                <Icon family="Ionicons" name="trash-outline" size={16} color={colors.error.DEFAULT} />
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Formação acadêmica */}
          {sectionHeader('Formação acadêmica', addEdu)}
          {education.length === 0 ? <Text style={styles.emptyHint}>Nenhuma formação. Toque em "Adicionar".</Text> : null}
          {education.map((edu, i) => (
            <View key={`edu-${i}`} style={styles.itemCard}>
              {smallInput(edu.institution ?? '', (t) => updateEdu(i, { institution: t }), 'Instituição (ex: USP)')}
              {smallInput(edu.degree ?? '', (t) => updateEdu(i, { degree: t }), 'Grau (ex: Bacharelado)')}
              {smallInput(edu.fieldOfStudy ?? '', (t) => updateEdu(i, { fieldOfStudy: t }), 'Curso (ex: Ciência da Computação)')}
              <View style={styles.row}>
                {smallInput(yearToText(edu.startYear), (t) => updateEdu(i, { startYear: textToYear(t) }), 'Ano início', { keyboardType: 'numeric', flex: 1 })}
                {smallInput(yearToText(edu.endYear), (t) => updateEdu(i, { endYear: textToYear(t) }), 'Ano fim', { keyboardType: 'numeric', flex: 1 })}
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeEdu(i)}>
                <Icon family="Ionicons" name="trash-outline" size={16} color={colors.error.DEFAULT} />
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Idiomas */}
          {sectionHeader('Idiomas', addLang)}
          {languages.length === 0 ? <Text style={styles.emptyHint}>Nenhum idioma. Toque em "Adicionar".</Text> : null}
          {languages.map((lang, i) => (
            <View key={`lang-${i}`} style={styles.itemCard}>
              {smallInput(lang.name ?? '', (t) => updateLang(i, { name: t }), 'Idioma (ex: Inglês)')}
              <Text style={styles.levelLabel}>Nível</Text>
              <View style={styles.levelRow}>
                {LANGUAGE_LEVELS.map((lvl) => {
                  const active = lang.level === lvl
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[styles.levelChip, active && styles.levelChipActive]}
                      onPress={() => updateLang(i, { level: active ? null : lvl })}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>{lvl}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeLang(i)}>
                <Icon family="Ionicons" name="trash-outline" size={16} color={colors.error.DEFAULT} />
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}

          {field('Sobre você', bio, setBio, { placeholder: 'Um breve resumo', multiline: true })}

          <TouchableOpacity
            style={[styles.saveBtn, updateProfile.isPending && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={updateProfile.isPending}
            activeOpacity={0.85}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Salvar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing[5], paddingBottom: spacing[10] },
  title: { fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.bold as any, color: colors.neutral[900], marginBottom: spacing[5] },
  field: { marginBottom: spacing[4] },
  label: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.medium as any, color: colors.neutral[700], marginBottom: spacing[2] },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral[300], borderRadius: 10, paddingHorizontal: spacing[4], paddingVertical: spacing[3], fontSize: typography.fontSize.body, color: colors.neutral[900] },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[4], marginBottom: spacing[3] },
  sectionTitle: { fontSize: typography.fontSize.h5, fontWeight: typography.fontWeight.semibold as any, color: colors.neutral[900] },
  addInline: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingVertical: spacing[1], paddingHorizontal: spacing[2], borderRadius: 8, backgroundColor: colors.primary[50] },
  addInlineText: { color: colors.primary[600], fontWeight: typography.fontWeight.semibold as any, fontSize: typography.fontSize.bodySm },
  emptyHint: { fontSize: typography.fontSize.bodySm, color: colors.neutral[500], marginBottom: spacing[2] },
  itemCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing[3], marginBottom: spacing[3], borderWidth: 1, borderColor: colors.neutral[200], gap: spacing[2] },
  itemInput: { backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[300], borderRadius: 8, paddingHorizontal: spacing[3], paddingVertical: spacing[2], fontSize: typography.fontSize.bodySm, color: colors.neutral[900] },
  row: { flexDirection: 'row', gap: spacing[2] },
  removeBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing[1], paddingVertical: spacing[1] },
  removeText: { color: colors.error.DEFAULT, fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.medium as any },
  levelLabel: { fontSize: typography.fontSize.caption, color: colors.neutral[600], marginTop: spacing[1] },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  levelChip: { paddingVertical: spacing[1], paddingHorizontal: spacing[3], borderRadius: 9999, borderWidth: 1, borderColor: colors.neutral[300], backgroundColor: colors.white },
  levelChipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  levelChipText: { fontSize: typography.fontSize.caption, color: colors.neutral[700] },
  levelChipTextActive: { color: colors.white, fontWeight: typography.fontWeight.semibold as any },
  saveBtn: { backgroundColor: colors.primary[500], borderRadius: 12, paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center', marginTop: spacing[5] },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold as any },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing[4] },
  cancelText: { color: colors.neutral[600], fontSize: typography.fontSize.body },
})

export default EditProfileScreen
