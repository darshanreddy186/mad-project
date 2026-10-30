import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { CATEGORIES } from '@/data/mockData';
import { CategoryCard } from '@/components/CategoryCard';

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 }}>
        <Text className="text-xl font-bold text-white">Browse Categories</Text>
        <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
          Find specialists for any type of car modification
        </Text>

        <View className="mt-5 flex-row flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <View key={cat.id} className="w-[48%]">
              <CategoryCard category={cat} variant="grid" />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
