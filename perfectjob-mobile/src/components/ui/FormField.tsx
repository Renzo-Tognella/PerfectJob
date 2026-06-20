import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input, type InputProps } from './Input';

interface FormFieldProps<T extends FieldValues> extends Omit<InputProps, 'value' | 'onChangeText' | 'onBlur'> {
  control: Control<T>;
  name: FieldPath<T>;
}

export function FormField<T extends FieldValues>({ control, name, ...inputProps }: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <Input
          {...inputProps}
          value={(field.value as string) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={error?.message}
        />
      )}
    />
  );
}
