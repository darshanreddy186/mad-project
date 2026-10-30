import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import type { AppNotification } from '@/types';
import type { Database } from '@/types/database';
import { mapNotification } from './mappers';

export async function listNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw toAppError(error);
  return (data ?? []).map(mapNotification);
}

export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw toAppError(error);
  return count ?? 0;
}

export async function markRead(id: string) {
  check(await supabase.from('notifications').update({ is_read: true }).eq('id', id));
}

export async function markAllRead(userId: string) {
  check(
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  );
}

export async function deleteNotification(id: string) {
  check(await supabase.from('notifications').delete().eq('id', id));
}

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

/** Realtime feed of new notifications for the user. Returns an unsubscribe fn. */
export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: AppNotification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on<NotificationRow>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(mapNotification(payload.new as NotificationRow))
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
