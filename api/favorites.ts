import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';

export async function listFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('shop_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map((f) => f.shop_id);
}

export async function addFavorite(userId: string, shopId: string) {
  const { error } = await supabase.from('favorites').insert({ user_id: userId, shop_id: shopId });
  // Already saved (e.g. from another device) counts as success.
  if (error && error.code !== '23505') throw toAppError(error);
}

export async function removeFavorite(userId: string, shopId: string) {
  check(await supabase.from('favorites').delete().eq('user_id', userId).eq('shop_id', shopId));
}
