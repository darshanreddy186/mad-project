import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { selectUserId, useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { useRequireAuth } from './useRequireAuth';

export function useFavourite(shopId: string) {
  const userId = useAuthStore(selectUserId);
  const isFavourite = useAppStore((s) => s.favouriteIds.includes(shopId));
  const toggleFavourite = useAppStore((s) => s.toggleFavourite);
  const requireAuth = useRequireAuth();

  const toggle = useCallback(async () => {
    if (!requireAuth('Sign in to save your favourite shops.') || !userId) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const error = await toggleFavourite(userId, shopId);
    if (error) toast.error(error);
  }, [requireAuth, userId, toggleFavourite, shopId]);

  return { isFavourite, toggle };
}
