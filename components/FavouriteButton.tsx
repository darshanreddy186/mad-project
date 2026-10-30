import { Pressable, View, Text } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface FavouriteButtonProps {
  shopId: string;
  size?: number;
}

export function FavouriteButton({ shopId, size = 22 }: FavouriteButtonProps) {
  const isFav = useAppStore((s) => s.favourites.includes(shopId));
  const toggleFavourite = useAppStore((s) => s.toggleFavourite);

  return (
    <Pressable
      onPress={() => toggleFavourite(shopId)}
      className="h-10 w-10 items-center justify-center rounded-full"
      style={{ backgroundColor: Colors.charcoal[700] }}>
      <Heart
        size={size}
        color={isFav ? Colors.accent[500] : Colors.charcoal[200]}
        fill={isFav ? Colors.accent[500] : 'none'}
      />
    </Pressable>
  );
}
