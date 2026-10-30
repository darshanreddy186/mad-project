import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface RatingStarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function RatingStars({
  rating,
  size = 14,
  showValue = false,
  reviewCount,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const isFull = i <= fullStars;
          const isHalf = i === fullStars + 1 && hasHalf;
          return (
            <Star
              key={i}
              size={size}
              color={Colors.accent[500]}
              fill={isFull || isHalf ? Colors.accent[500] : 'none'}
              strokeWidth={isFull || isHalf ? 0 : 1.5}
            />
          );
        })}
      </View>
      {showValue && (
        <View className="flex-row items-center gap-1">
          <Text
            className="text-sm font-semibold"
            style={{ color: Colors.charcoal[900] }}>
            {rating.toFixed(1)}
          </Text>
          {reviewCount !== undefined && (
            <Text
              className="text-xs"
              style={{ color: Colors.charcoal[400] }}>
              ({reviewCount})
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
