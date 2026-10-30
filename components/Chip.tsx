import { Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  count?: number;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected, onPress, icon, count, size = 'md' }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-1.5 rounded-full ${size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      style={{
        backgroundColor: selected ? Colors.accent[600] : Colors.charcoal[800],
        borderWidth: 1,
        borderColor: selected ? Colors.accent[500] : Colors.charcoal[700],
      }}>
      {icon}
      <Text
        className="text-xs font-semibold"
        style={{ color: selected ? Colors.white : Colors.charcoal[200] }}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View
          className="min-w-[18px] items-center rounded-full px-1"
          style={{ backgroundColor: selected ? 'rgba(255,255,255,0.25)' : Colors.accent[600] }}>
          <Text className="text-[10px] font-bold text-white">{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentsProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Horizontal scrollable pill tabs. */
export function Segments<T extends string>({ options, value, onChange }: SegmentsProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          count={o.count}
          selected={o.value === value}
          onPress={() => onChange(o.value)}
          size="sm"
        />
      ))}
    </View>
  );
}
