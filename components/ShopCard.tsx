import { memo } from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MapPin, BadgeCheck, Store } from 'lucide-react-native';
import { RatingStars } from './RatingStars';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useFavourite } from '@/hooks/useFavourite';
import { formatDistance, formatPrice, priceLevelSymbols } from '@/lib/format';
import type { Shop } from '@/types';

interface ShopCardProps {
  shop: Shop;
  variant?: 'default' | 'compact';
}

function CoverImage({ uri, className }: { uri: string | null; className: string }) {
  if (uri) {
    return <Image source={{ uri }} className={className} resizeMode="cover" />;
  }
  return (
    <View className={`${className} items-center justify-center`} style={{ backgroundColor: Colors.charcoal[700] }}>
      <Store size={32} color={Colors.charcoal[500]} />
    </View>
  );
}

function ShopCardComponent({ shop, variant = 'default' }: ShopCardProps) {
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);
  const { isFavourite, toggle } = useFavourite(shop.id);

  const shopCategories = shop.category_slugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 2);

  const priceSymbols = priceLevelSymbols(shop.price_level);
  const distance = formatDistance(shop.distance_km);
  const open = () => router.push(`/shop/${shop.id}`);

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${shop.name}, rated ${shop.rating.toFixed(1)}`}
        className="mr-3 w-64 overflow-hidden rounded-2xl"
        style={{ backgroundColor: Colors.charcoal[800] }}>
        <View className="relative h-32 w-full">
          <CoverImage uri={shop.cover_image_url} className="h-full w-full" />
          <View
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(15,17,21,0.3)' }}
          />
          {shop.is_verified && (
            <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full px-2 py-1"
              style={{ backgroundColor: 'rgba(15,17,21,0.7)' }}>
              <BadgeCheck size={12} color={Colors.electric[400]} />
              <Text className="text-[10px] font-medium text-white">Verified</Text>
            </View>
          )}
        </View>
        <View className="p-3">
          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
            {shop.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={10} color={Colors.charcoal[400]} />
            <Text className="text-[11px]" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
              {shop.city}
              {distance ? ` · ${distance}` : ''}
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
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${shop.name}, ${shop.city}, rated ${shop.rating.toFixed(1)}`}
      className="mb-4 overflow-hidden rounded-2xl"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View className="relative h-44 w-full">
        <CoverImage uri={shop.cover_image_url} className="h-full w-full" />
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(15,17,21,0.35)',
          }}
        />
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            toggle();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(15,17,21,0.6)' }}>
          <Heart
            size={18}
            color={isFavourite ? Colors.accent[500] : Colors.white}
            fill={isFavourite ? Colors.accent[500] : 'none'}
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
        {shop.min_price !== null && (
          <View
            className="absolute bottom-3 left-3 rounded-full px-2.5 py-1"
            style={{ backgroundColor: 'rgba(15,17,21,0.75)' }}>
            <Text className="text-[11px] font-semibold text-white">
              From {formatPrice(shop.min_price)}
            </Text>
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
                className="flex-1 text-xs"
                style={{ color: Colors.charcoal[400] }}
                numberOfLines={1}>
                {shop.address}, {shop.city}
                {distance ? ` · ${distance}` : ''}
              </Text>
            </View>
          </View>
          <Text
            className="ml-2 text-sm font-bold"
            style={{ color: Colors.accent[500] }}>
            {priceSymbols}
          </Text>
        </View>

        {!!shop.description && (
          <Text
            className="mt-2 text-xs leading-4"
            style={{ color: Colors.charcoal[300] }}
            numberOfLines={2}>
            {shop.description}
          </Text>
        )}

        <View className="mt-3 flex-row items-center justify-between">
          <RatingStars
            rating={shop.rating}
            size={13}
            showValue
            reviewCount={shop.review_count}
          />
          <View className="flex-row gap-1.5">
            {shopCategories.map((cat) => (
              <View
                key={cat.id}
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: Colors.charcoal[700] }}>
                <Text
                  className="text-[10px] font-medium"
                  style={{ color: Colors.charcoal[200] }}
                  numberOfLines={1}>
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const ShopCard = memo(ShopCardComponent);
