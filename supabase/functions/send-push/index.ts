// Sends an Expo push notification for every new row in public.notifications.
// Wire it up with a Database Webhook (Dashboard -> Database -> Webhooks):
//   table: public.notifications, events: INSERT, type: Supabase Edge Function,
//   function: send-push, HTTP header  x-webhook-secret: <PUSH_WEBHOOK_SECRET>
import { createClient } from 'npm:@supabase/supabase-js@2';

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const record = payload?.record as NotificationRecord | undefined;
  if (payload?.type !== 'INSERT' || !record?.user_id) {
    return new Response('Ignored', { status: 200 });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await admin
    .from('profiles')
    .select('expo_push_token')
    .eq('id', record.user_id)
    .single();
  const token = profile?.expo_push_token;
  if (!token) return new Response('No device registered', { status: 200 });

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: token,
      title: record.title,
      body: record.body,
      sound: 'default',
      channelId: 'default',
      data: { ...(record.data ?? {}), type: record.type, notification_id: record.id },
    }),
  });
  const result = await response.json().catch(() => null);

  // Forget tokens for uninstalled apps so we stop sending to them.
  if (result?.data?.details?.error === 'DeviceNotRegistered') {
    await admin.from('profiles').update({ expo_push_token: null }).eq('id', record.user_id);
  }

  return new Response(JSON.stringify(result), {
    status: response.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
});
