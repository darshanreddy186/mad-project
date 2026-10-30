import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { CategoryCard } from '@/components/CategoryCard';
import { LoadingView } from '@/components/StateViews';

export default function CategoriesScreen() {
  const categories = useAppStore((s) => s.categories);
  const loaded = useAppStore((s) => s.categoriesLoaded);
  const loadCategories = useAppStore((s) => s.loadCategories);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories(true);
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent[500]} />}>
        <Text className="text-xl font-bold text-white">Browse Categories</Text>
        <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
          Find specialists for any type of car modification
        </Text>

        {!loaded && categories.length === 0 ? (
          <LoadingView />
        ) : (
          <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
            {categories.map((cat) => (
              <View key={cat.id} className="w-[48%]">
                <CategoryCard category={cat} variant="grid" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
