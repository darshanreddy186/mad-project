import { Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface CardProps {
  title?: string;
  icon?: LucideIcon;
  right?: React.ReactNode;
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Card({ title, icon: Icon, right, children, onPress, className = '' }: CardProps) {
  const content = (
    <>
      {(title || right) && (
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {Icon && <Icon size={16} color={Colors.charcoal[400]} />}
            {title && <Text className="text-sm font-semibold text-white">{title}</Text>}
          </View>
          {right}
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`rounded-2xl p-4 ${className}`}
        style={{ backgroundColor: Colors.charcoal[800] }}>
        {content}
      </Pressable>
    );
  }
  return (
    <View className={`rounded-2xl p-4 ${className}`} style={{ backgroundColor: Colors.charcoal[800] }}>
      {content}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon: Icon, color = Colors.accent[500], onPress }: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-1 rounded-2xl p-4"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      {Icon && (
        <View
          className="mb-2 h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20` }}>
          <Icon size={16} color={color} />
        </View>
      )}
      <Text className="text-xl font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-[11px]" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  color?: string;
  onPress: () => void;
  last?: boolean;
  badge?: number;
}

export function MenuRow({ icon: Icon, label, value, color = Colors.charcoal[300], onPress, last, badge }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center px-4 py-3.5"
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: Colors.charcoal[700] }}>
      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}20` }}>
        <Icon size={18} color={color} />
      </View>
      <Text className="ml-3 flex-1 text-sm font-medium text-white">{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View className="mr-2 min-w-[20px] items-center rounded-full px-1.5 py-0.5" style={{ backgroundColor: Colors.accent[600] }}>
          <Text className="text-[10px] font-bold text-white">{badge}</Text>
        </View>
      )}
      {value && (
        <Text className="mr-1 text-xs" style={{ color: Colors.charcoal[400] }}>
          {value}
        </Text>
      )}
      <Text style={{ color: Colors.charcoal[600], fontSize: 18 }}>›</Text>
    </Pressable>
  );
}
