import { Redirect, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { LoadingView } from '@/components/StateViews';
import { useAuthStore } from '@/store/useAuthStore';

/** Admin area. Client-side guard for navigation; every admin action is enforced by RLS/RPC checks. */
export default function AdminLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  if (!initialized || (session && !profile)) return <LoadingView />;
  if (!session || !profile) return <Redirect href="/(auth)/login" />;
  if (profile.is_suspended) return <Redirect href="/suspended" />;
  if (profile.role !== 'admin') return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.charcoal[950] } }} />
  );
}
