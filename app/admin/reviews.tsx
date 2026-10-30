import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { REVIEW_STATUS } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { RatingStars } from '@/components/RatingStars';
import { Segments } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ModalSheet } from '@/components/ModalSheet';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { deleteReview, listReviewsForModeration, setReviewStatus } from '@/api/reviews';
import { useQuery } from '@/hooks/useQuery';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import type { Review, ReviewStatus } from '@/types';

export default function AdminReviewsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('published');
  const [hiding, setHiding] = useState<Review | null>(null);
  const [note, setNote] = useState('');

  const { data, loading, error, refresh, refreshing, refetch } = useQuery(() => listReviewsForModeration(filter), [filter], {
    refetchOnFocus: true,
  });

  const act = async (fn: () => Promise<void>, message: string) => {
    try {
      await fn();
      toast.success(message);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (r: Review) => {
    if (!(await confirm('Delete review', 'Permanently delete this review?', { confirmText: 'Delete', destructive: true }))) return;
    act(() => deleteReview(r.id), 'Review deleted.');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Review moderation" />
      <View className="px-5 pb-3">
        <Segments
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'published', label: 'Published' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {loading ? (
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
          ListEmptyComponent={<EmptyState icon={MessageSquare} title="No reviews" />}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-2xl p-4" style={{ backgroundColor: Colors.charcoal[800] }}>
              <Pressable onPress={() => router.push(`/shop/${item.shop_id}`)}>
                <Text className="text-sm font-semibold text-white">{item.shop?.name ?? 'Shop'}</Text>
              </Pressable>
              <View className="mt-1 flex-row items-center gap-2">
                <RatingStars rating={item.rating} size={12} />
                <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                  {item.author?.full_name ?? 'User'} · {formatDate(item.created_at)}
                </Text>
              </View>
              {!!item.comment && <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[200] }}>{item.comment}</Text>}
              {item.moderation_note && (
                <Text className="mt-2 text-xs" style={{ color: Colors.warning[500] }}>Moderator note: {item.moderation_note}</Text>
              )}
              <View className="mt-3 flex-row items-center gap-2">
                <StatusBadge label={REVIEW_STATUS[item.status].label} color={REVIEW_STATUS[item.status].color} />
                <View className="flex-1" />
                {item.status === 'published' ? (
                  <Button label="Hide" size="sm" variant="outline" onPress={() => { setNote(''); setHiding(item); }} />
                ) : (
                  <Button label="Restore" size="sm" variant="secondary" onPress={() => act(() => setReviewStatus(item.id, 'published'), 'Review restored.')} />
                )}
                <Button label="Delete" size="sm" variant="danger" onPress={() => remove(item)} />
              </View>
            </View>
          )}
        />
      )}

      <ModalSheet visible={Boolean(hiding)} onClose={() => setHiding(null)} title="Hide review">
        <View className="gap-4">
          <Input label="Moderation note (shown to the author)" value={note} onChangeText={setNote} multiline numberOfLines={3} autoCapitalize="sentences" placeholder="e.g. Contains offensive language" />
          <Button
            label="Hide review"
            variant="danger"
            fullWidth
            onPress={() => {
              const target = hiding;
              setHiding(null);
              if (target) act(() => setReviewStatus(target.id, 'hidden', note), 'Review hidden.');
            }}
          />
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
