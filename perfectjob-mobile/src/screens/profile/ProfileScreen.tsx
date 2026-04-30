import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import Icon from '@/components/ui/Icon';

const DEFAULT_USER = {
  name: 'João Silva',
  email: 'joao.silva@email.com',
  skills: ['React Native', 'TypeScript', 'Node.js', 'Python'],
  applicationsCount: 12,
  savedJobsCount: 8,
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((s) => s.logout);
  const user = DEFAULT_USER;
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.applicationsCount}</Text>
            <Text style={styles.statLabel}>Candidaturas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.savedJobsCount}</Text>
            <Text style={styles.statLabel}>Vagas salvas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Habilidades</Text>
          <View style={styles.skillRow}>
            {skills.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{skill}</Text>
                <TouchableOpacity
                  onPress={() => removeSkill(skill)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Icon family="MaterialIcons" name="close" size={14} color={colors.primary[400]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meu Currículo</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Icon family="Ionicons" name="document-text" size={22} color={colors.primary[500]} />
            <Text style={styles.uploadText}>Enviar currículo (PDF)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Tema escuro</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notificações</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scrollContent: {
    paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[10],
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary[100],
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing[4],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  avatarText: {
    fontSize: 36, fontWeight: typography.fontWeight.bold as any,
    color: colors.primary[500],
  },
  name: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900], textAlign: 'center', marginBottom: spacing[1],
  },
  email: {
    fontSize: typography.fontSize.body, color: colors.neutral[600],
    textAlign: 'center', marginBottom: spacing[6],
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: spacing[6],
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing[4],
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  statBox: { alignItems: 'center', paddingHorizontal: spacing[6] },
  statDivider: { width: 1, height: 32, backgroundColor: colors.neutral[200] },
  statValue: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[500], marginTop: spacing[1],
  },
  section: { marginBottom: spacing[6] },
  sectionTitle: {
    fontSize: typography.fontSize.h5,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.neutral[900], marginBottom: spacing[4],
  },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  skillChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1, borderColor: colors.primary[200],
    paddingVertical: spacing[1], paddingHorizontal: spacing[3],
    borderRadius: 9999, gap: spacing[2],
  },
  skillChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.primary[700],
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 1.5,
    borderColor: colors.neutral[300], borderRadius: 12,
    paddingVertical: spacing[4], paddingHorizontal: spacing[4],
    borderStyle: 'dashed', gap: spacing[3],
  },
  uploadText: { fontSize: typography.fontSize.body, color: colors.neutral[600] },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: 12,
    paddingVertical: spacing[3], paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  settingLabel: { fontSize: typography.fontSize.body, color: colors.neutral[800] },
  logoutBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing[4], marginTop: spacing[4],
  },
  logoutText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.error.DEFAULT,
  },
});

export default ProfileScreen;
