import { Pressable, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import type { ServiceCategory } from '@/types';

interface CategoryCardProps {
  category: ServiceCategory;
  variant?: 'grid' | 'row';
}

export function CategoryCard({ category, variant = 'grid' }: CategoryCardProps) {
  const router = useRouter();
  const setFilters = useAppStore((s) => s.setFilters);
  const open = () => {
    setFilters({ categories: [category.slug] });
    router.push('/shops');
  };

  const IconComponent = (
    LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
    >
  )[category.icon_name] ?? LucideIcons.Wrench;

  if (variant === 'row') {
    return (
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={category.name}
        className="mr-3 w-32 items-center rounded-2xl p-4"
        style={{ backgroundColor: Colors.charcoal[800] }}>
        <View
          className="mb-3 h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${category.color}20` }}>
          <IconComponent size={22} color={category.color} strokeWidth={2} />
        </View>
        <Text
          className="text-center text-xs font-semibold text-white"
          numberOfLines={2}>
          {category.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
        accessibilityRole="button"
        accessibilityLabel={category.name}
      className="flex-1 items-center rounded-2xl p-5"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View
        className="mb-3 h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${category.color}20` }}>
        <IconComponent size={26} color={category.color} strokeWidth={2} />
      </View>
      <Text
        className="text-center text-sm font-semibold text-white"
        numberOfLines={1}>
        {category.name}
      </Text>
      <Text
        className="mt-1 text-center text-[10px]"
        style={{ color: Colors.charcoal[400] }}
        numberOfLines={2}>
        {category.description}
      </Text>
    </Pressable>
  );
}
