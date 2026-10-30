import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { searchShops } from '@/api/shops';
import { useQuery } from '@/hooks/useQuery';
import { ShopCard } from '@/components/ShopCard';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import type { Shop } from '@/types';

export default function FavouritesScreen() {
  const router = useRouter();
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const favouriteIds = useAppStore((s) => s.favouriteIds);
  const coords = useLocationStore((s) => s.coords);

  const { data, loading, error, refresh, refreshing } = useQuery<Shop[]>(
    async () => {
      if (favouriteIds.length === 0) return [];
      const shops = await searchShops({ coords, shopIds: favouriteIds, limit: 200 });
      // Keep the most recently saved first.
      const order = new Map(favouriteIds.map((id, i) => [id, i]));
      return shops.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    },
    [favouriteIds.join(','), coords?.latitude, coords?.longitude],
    { enabled: hasSession }
  );

  // Hide immediately when un-favourited, before the refetch completes.
  const favShops = (data ?? []).filter((s) => favouriteIds.includes(s.id));

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-white">Saved Shops</Text>
        {hasSession && (
          <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
            {favShops.length} {favShops.length === 1 ? 'shop' : 'shops'} in your favourites
          </Text>
        )}
      </View>

      {!hasSession ? (
        <SignInPrompt icon={Heart} title="Save your favourite shops" message="Sign in to save shops and access them on any device." />
      ) : loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={favShops}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <ShopCard shop={item} />}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon={Heart}
              title="No favourites yet"
              message="Tap the heart icon on any shop to save it here for quick access"
              actionLabel="Discover Shops"
              onAction={() => router.push('/shops')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
