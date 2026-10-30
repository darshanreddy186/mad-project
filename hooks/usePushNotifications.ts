import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { savePushToken } from '@/api/profiles';
import { routeForNotification } from '@/lib/notifications';

// Remote push requires a development/production build (not Expo Go) and an
// EAS project id. Everything here degrades to a no-op otherwise; in-app
// realtime notifications keep working regardless.
const pushSupported =
  Platform.OS !== 'web' &&
  Device.isDevice &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

if (pushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export function usePushNotifications(userId: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!userId || !pushSupported) return;
    const projectId = getProjectId();
    let cancelled = false;

    (async () => {
      if (!projectId) return;
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Bookings & enquiries',
            importance: Notifications.AndroidImportance.HIGH,
          });
        }
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== 'granted' || cancelled) return;
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!cancelled) await savePushToken(userId, token);
      } catch (err) {
        console.warn('[push] registration failed', err);
      }
    })();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;
      const target = routeForNotification(data?.type as string | undefined, data);
      if (target) router.push(target);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId, router]);
}
