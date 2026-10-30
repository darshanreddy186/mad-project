import { Text, View } from 'react-native';

interface StatusBadgeProps {
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}22` }}>
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[11px] font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
