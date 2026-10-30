import { Pressable, View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MapPin, BadgeCheck } from 'lucide-react-native';
import { RatingStars } from './RatingStars';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import type { Shop } from '@/types';
import { CATEGORIES } from '@/data/mockData';

interface ShopCardProps {
  shop: Shop;
  variant?: 'default' | 'compact';
}

export function ShopCard({ shop, variant = 'default' }: ShopCardProps) {
  const router = useRouter();
  const toggleFavourite = useAppStore((s) => s.toggleFavourite);

  const shopCategories = shop.categories
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter(Boolean)
    .slice(0, 2);

  const priceSymbols = '£'.repeat(shop.price_level);

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={() => router.push(`/shop/${shop.id}`)}
        className="mr-3 w-64 overflow-hidden rounded-2xl"
        style={{ backgroundColor: Colors.charcoal[800] }}>
        <View className="relative h-32 w-full">
          <Image
            source={{ uri: shop.cover_image_url }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <View
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(15,17,21,0.3)' }}
          />
          <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full px-2 py-1"
            style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
            <BadgeCheck size={12} color={Colors.electric[400]} />
            <Text className="text-[10px] font-medium text-white">Verified</Text>
          </View>
        </View>
        <View className="p-3">
          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
            {shop.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={10} color={Colors.charcoal[400]} />
            <Text className="text-[11px]" style={{ color: Colors.charcoal[400] }}>
              {shop.city} · {shop.distance?.toFixed(1)}mi
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <RatingStars rating={shop.rating} size={11} />
            <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>
              {priceSymbols}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/shop/${shop.id}`)}
      className="mb-4 overflow-hidden rounded-2xl"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View className="relative h-44 w-full">
        <Image
          source={{ uri: shop.cover_image_url }}
          className="h-full w-full"
          resizeMode="cover"
        />
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(15,17,21,0.35)',
          }}
        />
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            toggleFavourite(shop.id);
          }}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(15,17,21,0.6)' }}>
          <Heart
            size={18}
            color={shop.is_favourite ? Colors.accent[500] : Colors.white}
            fill={shop.is_favourite ? Colors.accent[500] : 'none'}
          />
        </Pressable>
        {shop.is_verified && (
          <View
            className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
            <BadgeCheck size={12} color={Colors.electric[400]} />
            <Text className="text-[10px] font-medium text-white">Verified</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-white" numberOfLines={1}>
              {shop.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              <MapPin size={12} color={Colors.charcoal[400]} />
              <Text
                className="text-xs"
                style={{ color: Colors.charcoal[400] }}
                numberOfLines={1}>
                {shop.address}, {shop.city} · {shop.distance?.toFixed(1)}mi
              </Text>
            </View>
          </View>
          <Text
            className="ml-2 text-sm font-bold"
            style={{ color: Colors.accent[500] }}>
            {priceSymbols}
          </Text>
        </View>

        <Text
          className="mt-2 text-xs leading-4"
          style={{ color: Colors.charcoal[300] }}
          numberOfLines={2}>
          {shop.description}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <RatingStars
            rating={shop.rating}
            size={13}
            showValue
            reviewCount={shop.review_count}
          />
          <View className="flex-row gap-1.5">
            {shopCategories.map((cat) =>
              cat ? (
                <View
                  key={cat.id}
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: Colors.charcoal[700] }}>
                  <Text
                    className="text-[10px] font-medium"
                    style={{ color: Colors.charcoal[200] }}>
                    {cat.name}
                  </Text>
                </View>
              ) : null
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
