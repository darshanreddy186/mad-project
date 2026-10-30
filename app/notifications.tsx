import { useEffect } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Calendar, Mail, Info, Star, Store, CheckCheck } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { deleteNotification, listNotifications, markAllRead, markRead } from '@/api/notifications';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { timeAgo } from '@/lib/format';
import { routeForNotification } from '@/lib/notifications';
import type { AppNotification, NotificationType } from '@/types';

const ICON_MAP: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  booking: { icon: Calendar, color: Colors.electric[500] },
  enquiry: { icon: Mail, color: Colors.success[500] },
  review: { icon: Star, color: Colors.accent[500] },
  shop: { icon: Store, color: Colors.warning[500] },
  system: { icon: Info, color: Colors.charcoal[400] },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const latest = useNotificationStore((s) => s.latest);
  const setUnread = useNotificationStore((s) => s.setUnread);

  const { data, loading, error, refresh, refreshing, setData, refetch } = useQuery(
    () => listNotifications(userId!),
    [userId],
    { enabled: Boolean(userId) }
  );

  // Show realtime arrivals while the screen is open.
  useEffect(() => {
    if (latest) refetch();
  }, [latest, refetch]);

  useEffect(() => {
    if (data) setUnread(data.filter((n) => !n.is_read).length);
  }, [data, setUnread]);

  const open = async (n: AppNotification) => {
    if (!n.is_read) {
      setData((prev) => prev?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      markRead(n.id).catch(() => {});
    }
    const target = routeForNotification(n.type, n.data);
    if (target) router.push(target);
  };

  const readAll = async () => {
    if (!userId) return;
    setData((prev) => prev?.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllRead(userId);
    } catch (err) {
      toast.error(getErrorMessage(err));
      refetch();
    }
  };

  const remove = async (n: AppNotification) => {
    if (!(await confirm('Delete notification', n.title, { confirmText: 'Delete', destructive: true }))) return;
    setData((prev) => prev?.filter((x) => x.id !== n.id));
    deleteNotification(n.id).catch((err) => toast.error(getErrorMessage(err)));
  };

  const hasUnread = (data ?? []).some((n) => !n.is_read);

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader
        title="Notifications"
        right={
          hasUnread ? (
            <Pressable onPress={readAll} className="flex-row items-center gap-1" hitSlop={8}>
              <CheckCheck size={16} color={Colors.accent[500]} />
              <Text className="text-xs font-semibold" style={{ color: Colors.accent[500] }}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {!userId ? (
        <SignInPrompt icon={Bell} message="Sign in to receive booking and enquiry updates." />
      ) : loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => n.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState icon={Bell} title="You're all caught up" message="Booking updates, replies and shop news will appear here." />
          }
          renderItem={({ item: n }) => {
            const config = ICON_MAP[n.type] ?? ICON_MAP.system;
            const Icon = config.icon;
            return (
              <Pressable
                onPress={() => open(n)}
                onLongPress={() => remove(n)}
                accessibilityRole="button"
                accessibilityHint="Long press to delete"
                className="mb-3 flex-row rounded-2xl p-4"
                style={{
                  backgroundColor: Colors.charcoal[800],
                  borderWidth: n.is_read ? 0 : 1,
                  borderColor: n.is_read ? 'transparent' : `${config.color}40`,
                }}>
                <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${config.color}20` }}>
                  <Icon size={18} color={config.color} />
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm font-semibold text-white">{n.title}</Text>
                    {!n.is_read && <View className="h-2 w-2 rounded-full" style={{ backgroundColor: Colors.accent[500] }} />}
                  </View>
                  <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[300] }}>
                    {n.body}
                  </Text>
                  <Text className="mt-2 text-[10px]" style={{ color: Colors.charcoal[500] }}>
                    {timeAgo(n.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
