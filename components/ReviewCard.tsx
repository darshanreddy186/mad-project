import { View, Text, Image, Pressable } from 'react-native';
import { Star, Quote, Flag, Pencil } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { formatDate, initials } from '@/lib/format';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  isOwn?: boolean;
  onEdit?: () => void;
  onReport?: () => void;
}

export function ReviewCard({ review, isOwn, onEdit, onReport }: ReviewCardProps) {
  const name = review.author?.full_name || 'AutoMod user';
  const avatar = review.author?.avatar_url;

  return (
    <View
      className="mb-3 rounded-2xl p-4"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.electric[700] }}>
              <Text className="text-sm font-bold text-white">{initials(name)}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white" numberOfLines={1}>
              {isOwn ? `${name} (you)` : name}
            </Text>
            <Text
              className="text-xs"
              style={{ color: Colors.charcoal[400] }}>
              {formatDate(review.created_at)}
              {review.updated_at !== review.created_at ? ' · edited' : ''}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <Star size={14} color={Colors.accent[500]} fill={Colors.accent[500]} strokeWidth={0} />
          <Text className="text-sm font-bold text-white">{review.rating}</Text>
        </View>
      </View>
      {!!review.comment && (
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
      )}
      {(onEdit || onReport) && (
        <View className="mt-3 flex-row justify-end gap-4">
          {isOwn && onEdit && (
            <Pressable onPress={onEdit} hitSlop={8} className="flex-row items-center gap-1">
              <Pencil size={12} color={Colors.accent[500]} />
              <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>
                Edit
              </Text>
            </Pressable>
          )}
          {!isOwn && onReport && (
            <Pressable onPress={onReport} hitSlop={8} className="flex-row items-center gap-1">
              <Flag size={12} color={Colors.charcoal[400]} />
              <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                Report
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
