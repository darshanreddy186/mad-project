import { Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CalendarClock,
  Camera,
  Eye,
  Images,
  LogOut,
  MessageSquare,
  Repeat,
  Star,
  Store,
  Wrench,
  ClipboardList,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { SHOP_STATUS } from '@/constants/status';
import { Button } from '@/components/Button';
import { MenuRow, StatCard } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { getOwnerStats } from '@/api/shops';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useOwnerStore } from '@/store/useOwnerStore';
import { confirm } from '@/lib/dialog';

export default function OwnerDashboard() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile)!;
  const signOut = useAuthStore((s) => s.signOut);
  const unread = useNotificationStore((s) => s.unreadCount);
  const { shop, loaded, error, load } = useOwnerStore();

  const stats = useQuery(() => getOwnerStats(shop!.id), [shop?.id], {
    enabled: Boolean(shop),
    refetchOnFocus: true,
  });

  const refresh = async () => {
    await load(profile.id);
    stats.refresh();
  };

  if (!loaded) return <LoadingView />;
  if (error && !shop) return <ErrorView message={error} onRetry={() => load(profile.id)} />;

  const header = (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
      <View className="flex-1">
        <Text className="text-xs font-medium" style={{ color: Colors.charcoal[400] }}>
          Welcome back, {profile.full_name.split(' ')[0]}
        </Text>
        <Text className="mt-0.5 text-xl font-bold text-white">Shop dashboard</Text>
      </View>
      <Pressable
        onPress={() => router.push('/notifications')}
        accessibilityLabel="Notifications"
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.charcoal[800] }}>
        <Bell size={20} color={Colors.charcoal[200]} />
        {unread > 0 && <View className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: Colors.accent[500] }} />}
      </Pressable>
    </View>
  );

  const footer = (
    <View className="mt-6 gap-3 px-5">
      <Button label="Browse as customer" variant="outline" icon={<Repeat size={16} color={Colors.white} />} onPress={() => router.push('/(tabs)')} fullWidth />
      <Button
        label="Sign out"
        variant="ghost"
        icon={<LogOut size={16} color={Colors.charcoal[200]} />}
        onPress={async () => {
          if (await confirm('Sign out', 'Are you sure?', { confirmText: 'Sign out', destructive: true })) {
            await signOut();
            router.replace('/(auth)/login');
          }
        }}
        fullWidth
      />
    </View>
  );

  if (!shop) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {header}
          <View className="mx-5 mt-4 items-center rounded-3xl p-6" style={{ backgroundColor: Colors.charcoal[800] }}>
            <View className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${Colors.accent[500]}20` }}>
              <Store size={30} color={Colors.accent[500]} />
            </View>
            <Text className="mt-4 text-center text-lg font-bold text-white">Register your shop</Text>
            <Text className="mt-2 text-center text-sm leading-5" style={{ color: Colors.charcoal[300] }}>
              Add your details, location, services and photos. Our team reviews new shops — usually within one working day — before they appear to customers.
            </Text>
            <View className="mt-5 w-full">
              <Button label="Get started" size="lg" fullWidth onPress={() => router.push('/owner/shop')} />
            </View>
          </View>
          {footer}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const status = SHOP_STATUS[shop.status];
  const s = stats.data;

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={stats.refreshing} onRefresh={refresh} tintColor={Colors.accent[500]} />}>
        {header}

        {/* Shop card */}
        <Pressable onPress={() => router.push(`/shop/${shop.id}`)} className="mx-5 overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
          {shop.cover_image_url ? (
            <Image source={{ uri: shop.cover_image_url }} className="h-28 w-full" resizeMode="cover" />
          ) : (
            <View className="h-28 w-full items-center justify-center" style={{ backgroundColor: Colors.charcoal[700] }}>
              <Camera size={24} color={Colors.charcoal[500]} />
              <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }}>Add a cover photo</Text>
            </View>
          )}
          <View className="p-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-lg font-bold text-white" numberOfLines={1}>{shop.name}</Text>
              <StatusBadge label={status.label} color={status.color} />
            </View>
            <Text className="mt-0.5 text-xs" style={{ color: Colors.charcoal[400] }}>
              {shop.address}, {shop.city}
            </Text>
            <View className="mt-2 flex-row items-center gap-1.5">
              <Eye size={13} color={Colors.electric[400]} />
              <Text className="text-xs font-semibold" style={{ color: Colors.electric[400] }}>View public profile</Text>
            </View>
          </View>
        </Pressable>

        {shop.status !== 'approved' && (
          <View className="mx-5 mt-3 rounded-2xl p-4" style={{ backgroundColor: `${status.color}18`, borderWidth: 1, borderColor: `${status.color}40` }}>
            <View className="flex-row items-start gap-3">
              <AlertTriangle size={18} color={status.color} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">
                  {shop.status === 'pending'
                    ? 'Awaiting approval'
                    : shop.status === 'rejected'
                      ? 'Registration rejected'
                      : 'Shop suspended'}
                </Text>
                <Text className="mt-1 text-xs leading-4" style={{ color: Colors.charcoal[200] }}>
                  {shop.status === 'pending'
                    ? 'Your shop is hidden from customers until an administrator approves it. Meanwhile, add services, photos and portfolio projects.'
                    : shop.status === 'rejected'
                      ? `${shop.rejection_reason ? `Reason: ${shop.rejection_reason}. ` : ''}Update your details and resubmit for review.`
                      : 'Contact support to restore your listing.'}
                </Text>
                {shop.status === 'rejected' && (
                  <View className="mt-3">
                    <Button label="Edit & resubmit" size="sm" onPress={() => router.push('/owner/shop')} />
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Stats */}
        <View className="mt-5 gap-3 px-5">
          <View className="flex-row gap-3">
            <StatCard label="Pending bookings" value={s?.pendingBookings ?? '–'} icon={CalendarClock} color={Colors.warning[500]} onPress={() => router.push('/owner/bookings')} />
            <StatCard label="Upcoming" value={s?.upcomingBookings ?? '–'} icon={Calendar} color={Colors.electric[400]} onPress={() => router.push('/owner/bookings?tab=upcoming')} />
          </View>
          <View className="flex-row gap-3">
            <StatCard label="Open enquiries" value={s?.openEnquiries ?? '–'} icon={MessageSquare} color={Colors.success[500]} onPress={() => router.push('/owner/enquiries')} />
            <StatCard
              label={`${shop.review_count} reviews`}
              value={shop.rating > 0 ? shop.rating.toFixed(1) : 'New'}
              icon={Star}
              color={Colors.accent[500]}
              onPress={() => router.push(`/shop/${shop.id}`)}
            />
          </View>
        </View>

        {/* Manage */}
        <View className="mt-6 px-5">
          <Text className="mb-3 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>MANAGE</Text>
          <View className="overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
            <MenuRow icon={Store} label="Shop details & hours" color={Colors.accent[500]} onPress={() => router.push('/owner/shop')} />
            <MenuRow icon={Wrench} label="Services & pricing" value={s ? `${s.services}` : undefined} color={Colors.electric[400]} onPress={() => router.push('/owner/services')} />
            <MenuRow icon={Images} label="Photos & branding" value={s ? `${s.images}` : undefined} color={Colors.success[500]} onPress={() => router.push('/owner/gallery')} />
            <MenuRow icon={ClipboardList} label="Before & after portfolio" value={s ? `${s.portfolio}` : undefined} color={Colors.warning[500]} onPress={() => router.push('/owner/portfolio')} />
            <MenuRow icon={Calendar} label="Bookings" badge={s?.pendingBookings} color={Colors.electric[500]} onPress={() => router.push('/owner/bookings')} />
            <MenuRow icon={MessageSquare} label="Enquiries & quotes" badge={s?.openEnquiries} color={Colors.success[500]} onPress={() => router.push('/owner/enquiries')} last />
          </View>
        </View>

        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}
