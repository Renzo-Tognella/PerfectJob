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
import Icon from '@/components/ui/Icon';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuth();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      // Error is handled in useAuth
    }
  };

  const isFormValid = fullName.trim() && email.trim() && password.trim() && confirmPassword.trim();

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
            <View style={[styles.inputContainer, fullName ? styles.inputFocused : null]}>
              <Icon
                name="person"
                size={20}
                color={fullName ? colors.primary[500] : colors.neutral[400]}
              />
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
            <View style={[styles.inputContainer, email ? styles.inputFocused : null]}>
              <Icon
                name="email"
                size={20}
                color={email ? colors.primary[500] : colors.neutral[400]}
              />
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
            <View style={[styles.inputContainer, password ? styles.inputFocused : null]}>
              <Icon
                name="lock"
                size={20}
                color={password ? colors.primary[500] : colors.neutral[400]}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Senha"
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  family="Ionicons"
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={[styles.inputContainer, confirmPassword ? styles.inputFocused : null]}>
              <Icon
                name="lock"
                size={20}
                color={confirmPassword ? colors.primary[500] : colors.neutral[400]}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirme sua senha"
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  family="Ionicons"
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Icon family="MaterialIcons" name="error-outline" size={16} color={colors.error.DEFAULT} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Register Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, !isFormValid && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
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
              onPress={() =>
                onNavigateToLogin ? onNavigateToLogin() : navigation.navigate('Login')
              }
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Já tem conta? <Text style={styles.linkBold}>Entre</Text>
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
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    height: 52,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: colors.primary[400],
    shadowColor: colors.primary[500],
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    padding: 0,
    marginLeft: spacing[3],
    height: '100%',
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
