import { Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useFavourite } from '@/hooks/useFavourite';

interface FavouriteButtonProps {
  shopId: string;
  size?: number;
  translucent?: boolean;
}

export function FavouriteButton({ shopId, size = 18, translucent }: FavouriteButtonProps) {
  const { isFavourite, toggle } = useFavourite(shopId);

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
      className="h-10 w-10 items-center justify-center rounded-full"
      style={{ backgroundColor: translucent ? 'rgba(15,17,21,0.7)' : Colors.charcoal[700] }}>
      <Heart
        size={size}
        color={isFavourite ? Colors.accent[500] : Colors.white}
        fill={isFavourite ? Colors.accent[500] : 'none'}
      />
    </Pressable>
  );
}
