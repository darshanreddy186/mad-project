import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'decimal-pad' | 'number-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoComplete?: TextInputProps['autoComplete'];
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  hint,
  leftIcon,
  rightIcon,
  multiline,
  numberOfLines = 4,
  maxLength,
  editable = true,
  returnKeyType,
  onSubmitEditing,
}: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text
          className="mb-2 text-sm font-medium"
          style={{ color: Colors.charcoal[200] }}>
          {label}
        </Text>
      )}
      <View
        className="flex-row items-center rounded-xl"
        style={{
          backgroundColor: editable ? Colors.charcoal[800] : Colors.charcoal[900],
          borderWidth: 1,
          borderColor: error ? Colors.error[500] : Colors.charcoal[700],
        }}>
        {leftIcon && <View className="pl-3.5">{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.charcoal[500]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          maxLength={maxLength}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label ?? placeholder}
          className="flex-1 px-4 py-3.5 text-base"
          style={{
            color: editable ? Colors.white : Colors.charcoal[400],
            minHeight: multiline ? numberOfLines * 22 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {rightIcon && <View className="pr-3.5">{rightIcon}</View>}
      </View>
      {error ? (
        <Text
          className="mt-1.5 text-xs"
          style={{ color: Colors.error[500] }}>
          {error}
        </Text>
      ) : hint ? (
        <Text className="mt-1.5 text-xs" style={{ color: Colors.charcoal[500] }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
