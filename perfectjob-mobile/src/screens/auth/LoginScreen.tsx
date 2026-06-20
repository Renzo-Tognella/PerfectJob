import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import Icon from '@/components/ui/Icon';
import { FormField } from '@/components/ui/FormField';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const navigation = useNavigation<any>();

  const { control, handleSubmit, formState: { isValid } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login({ email: data.email.trim(), password: data.password });
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
            <Text style={styles.subtitle}>Bem-vindo de volta</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <FormField
              control={control}
              name="email"
              label="Email"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <FormField
              control={control}
              name="password"
              label="Senha"
              placeholder="Sua senha"
              secureTextEntry={!showPassword}
              required
            />

            <View style={styles.passwordActions}>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.showPasswordBtn}
              >
                <Icon
                  family="Ionicons"
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={16}
                  color={colors.neutral[600]}
                />
                <Text style={styles.showPasswordText}>
                  {showPassword ? 'Ocultar' : 'Mostrar'} senha
                </Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Icon family="MaterialIcons" name="error-outline" size={16} color={colors.error.DEFAULT} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || !isValid}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                onNavigateToRegister ? onNavigateToRegister() : navigation.navigate('Register')
              }
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  logoContainer: { alignItems: 'center', marginBottom: spacing[10] },
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
  form: { width: '100%' },
  passwordActions: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing[2] },
  showPasswordBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  showPasswordText: { fontSize: typography.fontSize.bodySm, color: colors.neutral[600] },
  forgotContainer: { alignItems: 'flex-end', marginBottom: spacing[6] },
  forgotText: {
    fontSize: typography.fontSize.bodySm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium as '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error.light,
    borderRadius: 8,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  errorText: {
    color: colors.error.DEFAULT,
    fontSize: typography.fontSize.bodySm,
    flexShrink: 1,
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[6],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  linkContainer: { alignItems: 'center' },
  linkText: { fontSize: typography.fontSize.bodySm, color: colors.neutral[600] },
  linkBold: { color: colors.primary[500], fontWeight: typography.fontWeight.semibold as '600' },
});

export default LoginScreen;
