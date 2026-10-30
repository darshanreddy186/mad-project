import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  Calendar,
  Flag,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Repeat,
  Star,
  Store,
  Users,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card, MenuRow, StatCard } from '@/components/Card';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { getAdminStats } from '@/api/admin';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { confirm } from '@/lib/dialog';
import { formatDate } from '@/lib/format';
import type { AdminStats } from '@/types';

function BookingsChart({ data }: { data: AdminStats['bookings_by_day'] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <View accessible accessibilityLabel={`${total} bookings created in the last ${data.length} days`}>
      <View className="h-28 flex-row items-end gap-1">
        {data.map((d) => (
          <View key={d.day} className="flex-1 items-center justify-end" style={{ height: '100%' }}>
            <View
              className="w-full rounded-t"
              style={{
                height: `${Math.max(4, (d.count / max) * 100)}%`,
                backgroundColor: d.count ? Colors.accent[500] : Colors.charcoal[700],
              }}
            />
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-[10px]" style={{ color: Colors.charcoal[500] }}>
          {data[0] ? formatDate(data[0].day, { day: 'numeric', month: 'short' }) : ''}
        </Text>
        <Text className="text-[10px]" style={{ color: Colors.charcoal[500] }}>Peak {max}/day</Text>
        <Text className="text-[10px]" style={{ color: Colors.charcoal[500] }}>Today</Text>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const { data: stats, loading, error, refresh, refreshing } = useQuery(getAdminStats, [], { refetchOnFocus: true });

  if (loading) return <LoadingView />;
  if (error || !stats) return <ErrorView message={error ?? 'Could not load analytics.'} onRetry={refresh} />;

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent[500]} />}>
        <View className="pb-3 pt-4">
          <Text className="text-xs font-medium" style={{ color: Colors.error[500] }}>ADMINISTRATOR</Text>
          <Text className="mt-0.5 text-xl font-bold text-white">Platform overview</Text>
        </View>

        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatCard label={`Users · +${stats.users.new_30d} in 30d`} value={stats.users.total} icon={Users} color={Colors.electric[400]} onPress={() => router.push('/admin/users')} />
            <StatCard label={`Live shops · ${stats.shops.verified} verified`} value={stats.shops.approved} icon={Store} color={Colors.success[500]} onPress={() => router.push('/admin/shops?status=approved')} />
          </View>
          <View className="flex-row gap-3">
            <StatCard label={`Bookings · ${stats.bookings.last_30d} in 30d`} value={stats.bookings.total} icon={Calendar} color={Colors.accent[500]} />
            <StatCard label={`Reviews · avg ${Number(stats.reviews.average).toFixed(1)}`} value={stats.reviews.total} icon={Star} color={Colors.warning[500]} onPress={() => router.push('/admin/reviews')} />
          </View>
          <View className="flex-row gap-3">
            <StatCard label="Shops awaiting review" value={stats.shops.pending} icon={BadgeCheck} color={Colors.warning[500]} onPress={() => router.push('/admin/shops?status=pending')} />
            <StatCard label="Open reports" value={stats.reports.open} icon={Flag} color={Colors.error[500]} onPress={() => router.push('/admin/reports')} />
          </View>
        </View>

        <Card title="Bookings — last 14 days" className="mt-5">
          <BookingsChart data={stats.bookings_by_day} />
        </Card>

        <View className="mt-4 flex-row gap-3">
          <Card title="Bookings by status" className="flex-1">
            {[
              ['Pending', stats.bookings.pending],
              ['Active', stats.bookings.confirmed],
              ['Completed', stats.bookings.completed],
              ['Cancelled', stats.bookings.cancelled],
            ].map(([label, value]) => (
              <View key={label as string} className="flex-row justify-between py-0.5">
                <Text className="text-xs" style={{ color: Colors.charcoal[300] }}>{label}</Text>
                <Text className="text-xs font-semibold text-white">{value}</Text>
              </View>
            ))}
          </Card>
          <Card title="Users by role" className="flex-1">
            {[
              ['Customers', stats.users.customers],
              ['Shop owners', stats.users.shop_owners],
              ['Admins', stats.users.admins],
              ['Suspended', stats.users.suspended],
            ].map(([label, value]) => (
              <View key={label as string} className="flex-row justify-between py-0.5">
                <Text className="text-xs" style={{ color: Colors.charcoal[300] }}>{label}</Text>
                <Text className="text-xs font-semibold text-white">{value}</Text>
              </View>
            ))}
          </Card>
        </View>

        {stats.top_categories.length > 0 && (
          <Card title="Most booked categories" className="mt-4">
            {stats.top_categories.map((c) => (
              <View key={c.name} className="flex-row items-center gap-2 py-1">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <Text className="flex-1 text-sm" style={{ color: Colors.charcoal[200] }}>{c.name}</Text>
                <Text className="text-sm font-semibold text-white">{c.bookings}</Text>
              </View>
            ))}
          </Card>
        )}

        <Text className="mb-3 mt-6 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>MANAGE</Text>
        <View className="overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
          <MenuRow icon={Store} label="Shop verification" badge={stats.shops.pending} color={Colors.success[500]} onPress={() => router.push('/admin/shops')} />
          <MenuRow icon={Users} label="Users" value={`${stats.users.total}`} color={Colors.electric[400]} onPress={() => router.push('/admin/users')} />
          <MenuRow icon={LayoutGrid} label="Modification categories" color={Colors.accent[500]} onPress={() => router.push('/admin/categories')} />
          <MenuRow icon={MessageSquare} label="Review moderation" value={stats.reviews.hidden ? `${stats.reviews.hidden} hidden` : undefined} color={Colors.warning[500]} onPress={() => router.push('/admin/reviews')} />
          <MenuRow icon={Flag} label="Reports" badge={stats.reports.open} color={Colors.error[500]} onPress={() => router.push('/admin/reports')} last />
        </View>

        <View className="mt-6 gap-3">
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
      </ScrollView>
    </SafeAreaView>
  );
}
