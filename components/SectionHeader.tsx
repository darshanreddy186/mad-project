import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  actionText,
  onAction,
}: SectionHeaderProps) {
  return (
    <View className="mb-3 flex-row items-end justify-between">
      <View className="flex-1">
        <Text className="text-lg font-bold text-white">{title}</Text>
        {subtitle && (
          <Text
            className="mt-0.5 text-sm"
            style={{ color: Colors.charcoal[400] }}>
            {subtitle}
          </Text>
        )}
      </View>
      {actionText && (
        <Text
          className="text-sm font-semibold"
          style={{ color: Colors.accent[500] }}
          onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  );
}
