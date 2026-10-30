import { View, Text, TextInput } from 'react-native';
import { Colors } from '@/constants/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  leftIcon,
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
          backgroundColor: Colors.charcoal[800],
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
          className="flex-1 px-4 py-3.5 text-base"
          style={{ color: Colors.white }}
        />
      </View>
      {error && (
        <Text
          className="mt-1.5 text-xs"
          style={{ color: Colors.error[500] }}>
          {error}
        </Text>
      )}
    </View>
  );
}
