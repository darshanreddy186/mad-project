import { Pressable, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export function StarRatingInput({ value, onChange, size = 36 }: StarRatingInputProps) {
  return (
    <View className="items-center">
      <View className="flex-row gap-2" accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: 5, now: value }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}>
            <Star
              size={size}
              color={Colors.accent[500]}
              fill={i <= value ? Colors.accent[500] : 'none'}
              strokeWidth={1.5}
            />
          </Pressable>
        ))}
      </View>
      <Text className="mt-2 text-sm font-semibold" style={{ color: value ? Colors.accent[500] : Colors.charcoal[500] }}>
        {value ? LABELS[value] : 'Tap to rate'}
      </Text>
    </View>
  );
}
