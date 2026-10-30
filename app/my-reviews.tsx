import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Star, Pencil, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { REVIEW_STATUS } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { RatingStars } from '@/components/RatingStars';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { deleteReview, listMyReviews } from '@/api/reviews';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';

export default function MyReviewsScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data, loading, error, refresh, refreshing, setData } = useQuery(() => listMyReviews(userId!), [userId], {
    enabled: Boolean(userId),
    refetchOnFocus: true,
  });

  const remove = async (id: string) => {
    if (!(await confirm('Delete review', 'This cannot be undone.', { confirmText: 'Delete', destructive: true }))) return;
    try {
      await deleteReview(id);
      setData((prev) => prev?.filter((r) => r.id !== id));
      toast.success('Review deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="My reviews" />
      {!userId ? (
        <SignInPrompt message="Sign in to manage your reviews." />
      ) : loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(r) => r.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Pressable onPress={() => router.push(`/shop/${item.shop_id}`)}>
                <Text className="text-sm font-semibold text-white">{item.shop?.name ?? 'Shop'}</Text>
                <View className="mt-1 flex-row items-center gap-2">
                  <RatingStars rating={item.rating} size={12} />
                  <Text className="text-xs" style={{ color: Colors.charcoal[500] }}>{formatDate(item.created_at)}</Text>
                </View>
              </Pressable>
              {!!item.comment && (
                <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[200] }}>{item.comment}</Text>
              )}
              <View className="mt-3 flex-row items-center justify-between">
                <StatusBadge label={REVIEW_STATUS[item.status].label} color={REVIEW_STATUS[item.status].color} />
                <View className="flex-row gap-4">
                  <Pressable onPress={() => router.push(`/shop/${item.shop_id}/review`)} hitSlop={8} className="flex-row items-center gap-1">
                    <Pencil size={13} color={Colors.accent[500]} />
                    <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(item.id)} hitSlop={8} className="flex-row items-center gap-1">
                    <Trash2 size={13} color={Colors.error[500]} />
                    <Text className="text-xs font-semibold" style={{ color: Colors.error[500] }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon={Star} title="No reviews yet" message="Reviews you write for shops will appear here." />
          }
        />
      )}
    </SafeAreaView>
  );
}
