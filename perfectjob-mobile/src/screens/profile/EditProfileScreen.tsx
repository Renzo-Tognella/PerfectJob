import React, { useState } from 'react'
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
import type { UpdateProfilePayload } from '@/types/profile'

const EditProfileScreen = () => {
  const navigation = useNavigation<any>()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [locationCity, setLocationCity] = useState(profile?.locationCity ?? '')
  const [locationState, setLocationState] = useState(profile?.locationState ?? '')
  const [yearsExperience, setYearsExperience] = useState(
    profile?.yearsExperience != null ? String(profile.yearsExperience) : '',
  )
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl ?? '')
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl ?? '')
  const [skills, setSkills] = useState((profile?.skills ?? []).join(', '))

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
    label: string,
    value: string,
    onChange: (t: string) => void,
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Editar perfil</Text>

          {field('Nome completo', fullName, setFullName, { placeholder: 'Seu nome' })}
          {field('Título profissional', headline, setHeadline, { placeholder: 'Ex: Desenvolvedor Full Stack' })}
          {field('Telefone', phone, setPhone, { placeholder: '(11) 99999-9999' })}
          {field('Cidade', locationCity, setLocationCity, { placeholder: 'São Paulo' })}
          {field('Estado', locationState, setLocationState, { placeholder: 'SP' })}
          {field('Anos de experiência', yearsExperience, setYearsExperience, { placeholder: '5', keyboardType: 'numeric' })}
          {field('Competências (separadas por vírgula)', skills, setSkills, { placeholder: 'Java, React, SQL', autoCapitalize: 'none' })}
          {field('LinkedIn', linkedinUrl, setLinkedinUrl, { placeholder: 'https://linkedin.com/in/...', autoCapitalize: 'none' })}
          {field('GitHub', githubUrl, setGithubUrl, { placeholder: 'https://github.com/...', autoCapitalize: 'none' })}
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
  title: {
    fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900], marginBottom: spacing[5],
  },
  field: { marginBottom: spacing[4] },
  label: {
    fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.medium as any,
    color: colors.neutral[700], marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral[300],
    borderRadius: 10, paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: typography.fontSize.body, color: colors.neutral[900],
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primary[500], borderRadius: 12, paddingVertical: spacing[4],
    alignItems: 'center', justifyContent: 'center', marginTop: spacing[4],
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold as any },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing[4] },
  cancelText: { color: colors.neutral[600], fontSize: typography.fontSize.body },
})

export default EditProfileScreen
