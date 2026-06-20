import { forwardRef } from 'react';
import { View, Text, TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, required, style, ...props }, ref) => (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        ref={ref}
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.neutral[400]}
        accessibilityLabel={label ?? props.placeholder}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing[4] },
  label: { fontSize: 14, fontWeight: '500', color: colors.neutral[700], marginBottom: spacing[2] },
  required: { color: colors.error.DEFAULT },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.error.DEFAULT },
  error: { fontSize: 12, color: colors.error.DEFAULT, marginTop: spacing[1] },
  hint: { fontSize: 12, color: colors.neutral[500], marginTop: spacing[1] },
});
