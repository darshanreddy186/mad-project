import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import type { AdminStats, Profile, Report, ReportStatus, UserRole } from '@/types';
import { mapProfile } from './mappers';

export async function getAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_stats');
  if (error) throw toAppError(error);
  return data as unknown as AdminStats;
}

export async function listUsers(search: string, role: UserRole | 'all'): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, role, is_suspended, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (role !== 'all') query = query.eq('role', role);
  const term = search.trim().replace(/[%_,()]/g, '');
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []).map(mapProfile);
}

export async function setUserRole(userId: string, role: UserRole) {
  check(await supabase.from('profiles').update({ role }).eq('id', userId));
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  check(await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', userId));
}

// Reports ------------------------------------------------------------------------

export async function createReport(input: {
  reporterId: string;
  reviewId?: string;
  shopId?: string;
  reason: string;
  details?: string;
}) {
  check(
    await supabase.from('reports').insert({
      reporter_id: input.reporterId,
      review_id: input.reviewId ?? null,
      shop_id: input.reviewId ? null : (input.shopId ?? null),
      reason: input.reason,
      details: input.details?.trim() || null,
    })
  );
}

export async function listReports(status: ReportStatus | 'all'): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select(
      'id, reporter_id, review_id, shop_id, reason, details, status, resolution_note, resolved_at, created_at, review:reviews(id, rating, comment, status, shop_id), shop:shops(id, name, city)'
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []) as Report[];
}

export async function resolveReport(
  id: string,
  adminId: string,
  status: Exclude<ReportStatus, 'open'>,
  note?: string
) {
  check(
    await supabase
      .from('reports')
      .update({
        status,
        resolution_note: note?.trim() || null,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
  );
}
