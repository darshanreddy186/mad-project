import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/config';

interface PriceLevelProps {
  level: 1 | 2 | 3 | 4;
}

export function PriceLevel({ level }: PriceLevelProps) {
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <Text
          key={i}
          className="text-sm font-bold"
          style={{
            color: i <= level ? Colors.accent[500] : Colors.charcoal[600],
          }}>
          {CURRENCY_SYMBOL}
        </Text>
      ))}
    </View>
  );
}

interface BadgeProps {
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

export function Badge({ label, color, icon }: BadgeProps) {
  return (
    <View
      className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color ?? Colors.charcoal[700]}30` }}>
      {icon}
      <Text
        className="text-[10px] font-semibold"
        style={{ color: color ?? Colors.charcoal[200] }}>
        {label}
      </Text>
    </View>
  );
}
