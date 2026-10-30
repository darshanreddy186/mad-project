import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import type { Review, ReviewAuthor, ReviewStatus } from '@/types';
import { mapReview, SHOP_SUMMARY_COLUMNS } from './mappers';

/** Attaches display names (profiles are private; names come from an RPC). */
async function withAuthors(reviews: Review[]): Promise<Review[]> {
  const ids = [...new Set(reviews.map((r) => r.user_id))];
  if (ids.length === 0) return reviews;
  const { data, error } = await supabase.rpc('get_review_authors', { p_user_ids: ids });
  if (error) {
    console.warn('[reviews] could not load authors', error.message);
    return reviews;
  }
  const byId = new Map<string, ReviewAuthor>(
    (data ?? []).map((a) => [a.id, { full_name: a.full_name, avatar_url: a.avatar_url }])
  );
  return reviews.map((r) => ({ ...r, author: byId.get(r.user_id) }));
}

export async function listShopReviews(shopId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw toAppError(error);
  return withAuthors((data ?? []).map(mapReview));
}

export async function getMyReview(shopId: string, userId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw toAppError(error);
  return data ? mapReview(data) : null;
}

export async function saveReview(input: {
  shopId: string;
  userId: string;
  rating: number;
  comment: string;
  existingId?: string;
}) {
  const payload = { rating: input.rating, comment: input.comment.trim() };
  if (input.existingId) {
    check(await supabase.from('reviews').update(payload).eq('id', input.existingId));
  } else {
    const { error } = await supabase
      .from('reviews')
      .insert({ ...payload, shop_id: input.shopId, user_id: input.userId });
    if (error?.code === '23505') {
      throw toAppError({ message: 'You have already reviewed this shop.' });
    }
    if (error) throw toAppError(error);
  }
}

export async function deleteReview(id: string) {
  check(await supabase.from('reviews').delete().eq('id', id));
}

export async function listMyReviews(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, shop:shops(${SHOP_SUMMARY_COLUMNS})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(mapReview);
}

// Admin moderation -------------------------------------------------------------

export async function listReviewsForModeration(status: ReviewStatus | 'all'): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select(`*, shop:shops(${SHOP_SUMMARY_COLUMNS})`)
    .order('created_at', { ascending: false })
    .limit(100);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return withAuthors((data ?? []).map(mapReview));
}

export async function setReviewStatus(id: string, status: ReviewStatus, note?: string) {
  check(
    await supabase
      .from('reviews')
      .update({ status, moderation_note: note?.trim() || null })
      .eq('id', id)
  );
}
