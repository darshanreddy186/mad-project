import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { StarRatingInput } from '@/components/StarRatingInput';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { deleteReview, getMyReview, saveReview } from '@/api/reviews';
import { getShopWithServices } from '@/api/shops';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';

export default function WriteReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);

  const { data, loading, error, refresh } = useQuery(
    async () => {
      const [shopData, existing] = await Promise.all([getShopWithServices(id), getMyReview(id, profile!.id)]);
      return { shop: shopData?.shop ?? null, existing };
    },
    [id, profile?.id],
    { enabled: Boolean(id && profile) }
  );

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.existing) {
      setRating(data.existing.rating);
      setComment(data.existing.comment);
    }
  }, [data?.existing]);

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Write a review" />
        <SignInPrompt message="Sign in to review shops." icon={Star} />
      </SafeAreaView>
    );
  }
  if (loading) return <LoadingView />;
  if (error || !data?.shop) return <ErrorView message={error ?? 'Shop not found.'} onRetry={refresh} />;

  const existing = data.existing;

  const submit = async () => {
    if (rating < 1) {
      toast.error('Please choose a star rating.');
      return;
    }
    setSaving(true);
    try {
      await saveReview({ shopId: id, userId: profile.id, rating, comment, existingId: existing?.id });
      toast.success(existing ? 'Review updated.' : 'Thanks for your review!');
      router.back();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    if (!(await confirm('Delete review', 'Remove your review for this shop?', { confirmText: 'Delete', destructive: true }))) return;
    try {
      await deleteReview(existing.id);
      toast.success('Review deleted.');
      router.back();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title={existing ? 'Edit your review' : 'Write a review'} subtitle={data.shop.name} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {existing?.status === 'hidden' && (
            <View className="mb-4 rounded-xl p-3" style={{ backgroundColor: `${Colors.error[500]}18` }}>
              <Text className="text-xs" style={{ color: Colors.error[500] }}>
                Your review was hidden by a moderator{existing.moderation_note ? `: ${existing.moderation_note}` : '.'}
              </Text>
            </View>
          )}
          <View className="items-center rounded-2xl py-6" style={{ backgroundColor: Colors.charcoal[800] }}>
            <Text className="mb-4 text-sm" style={{ color: Colors.charcoal[300] }}>
              How was your experience?
            </Text>
            <StarRatingInput value={rating} onChange={setRating} />
          </View>
          <View className="mt-5">
            <Input
              label="Your review"
              value={comment}
              onChangeText={setComment}
              placeholder="Tell others about the quality of work, communication and value…"
              multiline
              numberOfLines={6}
              maxLength={2000}
              autoCapitalize="sentences"
              hint={`${comment.length}/2000`}
            />
          </View>
          <View className="mt-6 gap-3">
            <Button label={existing ? 'Update review' : 'Submit review'} onPress={submit} loading={saving} fullWidth size="lg" />
            {existing && <Button label="Delete review" variant="danger" onPress={remove} fullWidth />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
