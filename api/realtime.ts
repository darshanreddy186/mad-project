import { supabase } from '@/lib/supabase';

/**
 * Calls `onChange` whenever the given row is updated (RLS applies, so users
 * only receive rows they can read). Returns an unsubscribe function.
 */
export function subscribeToRow(
  table: 'bookings' | 'enquiries',
  id: string,
  onChange: () => void
): () => void {
  const channel = supabase
    .channel(`${table}:${id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `id=eq.${id}` }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
