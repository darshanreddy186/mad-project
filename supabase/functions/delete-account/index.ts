// Deletes a user account. Callers may delete themselves; admins may delete any
// user by passing { user_id }. Runs server-side with the service-role key,
// which is injected by Supabase and never shipped to the app.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** Recursively removes every object under `prefix` in a bucket. */
async function removeFolder(admin: SupabaseClient, bucket: string, prefix: string) {
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return;
  const files: string[] = [];
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) await removeFolder(admin, bucket, path);
    else files.push(path);
  }
  if (files.length) await admin.storage.from(bucket).remove(files);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not authenticated' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'Not authenticated' }, 401);
  const caller = auth.user;

  const body = await req.json().catch(() => ({}));
  let targetId = caller.id;
  if (typeof body?.user_id === 'string' && body.user_id !== caller.id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', caller.id)
      .single();
    if (profile?.role !== 'admin' || profile.is_suspended) {
      return json({ error: 'Administrator access required' }, 403);
    }
    targetId = body.user_id;
  }

  try {
    // Remove uploaded files first; database rows cascade from auth.users.
    await removeFolder(admin, 'avatars', targetId);
    const { data: shop } = await admin.from('shops').select('id').eq('owner_id', targetId).maybeSingle();
    if (shop) await removeFolder(admin, 'shop-media', shop.id);
  } catch (err) {
    console.error('storage cleanup failed', err);
  }

  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
