import { View, Text, Image, Pressable } from 'react-native';
import { Star, Quote } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initials = review.user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const date = new Date(review.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View
      className="mb-3 rounded-2xl p-4"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {review.user_avatar ? (
            <Image
              source={{ uri: review.user_avatar }}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.electric[700] }}>
              <Text className="text-sm font-bold text-white">{initials}</Text>
            </View>
          )}
          <View>
            <Text className="text-sm font-semibold text-white">
              {review.user_name}
            </Text>
            <Text
              className="text-xs"
              style={{ color: Colors.charcoal[400] }}>
              {date}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <Star size={14} color={Colors.accent[500]} fill={Colors.accent[500]} strokeWidth={0} />
          <Text className="text-sm font-bold text-white">{review.rating}</Text>
        </View>
      </View>
      <View
        className="mt-3 flex-row items-start gap-2"
        style={{ paddingLeft: 2 }}>
        <Quote size={14} color={Colors.charcoal[600]} />
        <Text
          className="flex-1 text-sm leading-5"
          style={{ color: Colors.charcoal[200] }}>
          {review.comment}
        </Text>
      </View>
    </View>
  );
}
