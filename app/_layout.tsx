import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthDeepLinks } from '@/hooks/useAuthDeepLinks';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { isSupabaseConfigured } from '@/constants/config';
import { selectUserId, useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { useLocationStore } from '@/store/useLocationStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { toast } from '@/store/useToastStore';
import '../global.css';

function SetupRequired() {
  return (
    <ScrollView
      style={{ backgroundColor: Colors.charcoal[950] }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <Text className="text-2xl font-bold text-white">Supabase is not configured</Text>
      <Text className="mt-3 text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
        Create a <Text className="font-bold text-white">.env</Text> file in the project root (see
        .env.example) with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then
        restart the dev server with `npx expo start -c`.
      </Text>
    </ScrollView>
  );
}

function AppServices() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const userId = useAuthStore(selectUserId);
  const hydrateLocation = useLocationStore((s) => s.hydrate);
  const loadCategories = useAppStore((s) => s.loadCategories);
  const loadFavourites = useAppStore((s) => s.loadFavourites);
  const clearUserData = useAppStore((s) => s.clearUserData);
  const startNotifications = useNotificationStore((s) => s.start);
  const resetNotifications = useNotificationStore((s) => s.reset);

  useEffect(() => initializeAuth(), [initializeAuth]);

  useEffect(() => {
    hydrateLocation();
    loadCategories();
  }, [hydrateLocation, loadCategories]);

  // User-scoped data: favourites and the realtime notification feed.
  useEffect(() => {
    if (!userId) {
      clearUserData();
      resetNotifications();
      return;
    }
    loadFavourites(userId);
    return startNotifications(userId, (n) => toast.info(n.title));
  }, [userId, loadFavourites, clearUserData, startNotifications, resetNotifications]);

  useAuthDeepLinks();
  usePushNotifications(userId);
  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  if (!isSupabaseConfigured) {
    return (
      <>
        <SetupRequired />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <AppServices />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.charcoal[950] },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="owner" options={{ animation: 'fade' }} />
        <Stack.Screen name="admin" options={{ animation: 'fade' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Toast />
      <StatusBar style="light" />
    </View>
  );
}
