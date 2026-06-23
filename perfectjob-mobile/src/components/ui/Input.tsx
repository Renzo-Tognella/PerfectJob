import { forwardRef } from 'react';
import { View, Text, TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@/design-system/tokens';

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
  label: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  required: { color: colors.error.DEFAULT },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.body,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.error.DEFAULT },
  error: {
    fontSize: typography.fontSize.caption,
    color: colors.error.DEFAULT,
    marginTop: spacing[1],
  },
  hint: {
    fontSize: typography.fontSize.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});
