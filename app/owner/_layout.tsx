import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { LoadingView } from '@/components/StateViews';
import { useAuthStore } from '@/store/useAuthStore';
import { useOwnerStore } from '@/store/useOwnerStore';

/** Shop-owner area. Client-side guard for navigation; RLS enforces access. */
export default function OwnerLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loadShop = useOwnerStore((s) => s.load);
  const reset = useOwnerStore((s) => s.reset);

  useEffect(() => {
    if (profile?.role === 'shop_owner') loadShop(profile.id);
    return () => reset();
  }, [profile?.id, profile?.role, loadShop, reset]);

  if (!initialized || (session && !profile)) return <LoadingView />;
  if (!session || !profile) return <Redirect href="/(auth)/login" />;
  if (profile.is_suspended) return <Redirect href="/suspended" />;
  if (profile.role === 'admin') return <Redirect href="/admin" />;
  if (profile.role !== 'shop_owner') return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.charcoal[950] } }} />
  );
}
