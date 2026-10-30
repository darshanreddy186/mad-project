import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/theme';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  icon,
}: ButtonProps) {
  const bgColors: Record<string, string> = {
    primary: Colors.accent[600],
    secondary: Colors.electric[600],
    outline: 'transparent',
    ghost: 'transparent',
    danger: `${Colors.error[500]}20`,
  };

  const textColors: Record<string, string> = {
    primary: Colors.white,
    secondary: Colors.white,
    outline: Colors.white,
    ghost: Colors.charcoal[200],
    danger: Colors.error[500],
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 17 },
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`flex-row items-center justify-center rounded-xl ${fullWidth ? 'w-full' : ''}`}
      style={{
        backgroundColor: variant === 'outline' || variant === 'ghost' ? 'transparent' : bgColors[variant],
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: variant === 'outline' ? Colors.charcoal[600] : 'transparent',
        opacity: isDisabled ? 0.5 : 1,
        ...sizeStyles[size],
      }}>
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className="font-semibold"
            style={{ color: textColors[variant], fontSize: sizeStyles[size].fontSize }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
