import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error } = useAuth();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) return;
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    try {
      await register({ fullName, email, password });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      // Error is handled in useAuth
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>PerfectJob</Text>
            <Text style={styles.subtitle}>Crie sua conta</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor={colors.neutral[400]}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirme sua senha"
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Register Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Criar conta</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigateToLogin ? onNavigateToLogin() : navigation.navigate('Login')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Já tem conta?{' '}
                <Text style={styles.linkBold}>Entre</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.primary[500],
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: typography.fontSize.h4,
    color: colors.neutral[600],
    fontWeight: typography.fontWeight.medium as '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    height: 52,
  },
  inputIcon: {
    fontSize: typography.fontSize.body,
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    padding: 0,
  },
  errorText: {
    color: colors.error.DEFAULT,
    fontSize: typography.fontSize.bodySm,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: typography.fontSize.bodySm,
    color: colors.neutral[600],
  },
  linkBold: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold as '600',
  },
});

export default RegisterScreen;
