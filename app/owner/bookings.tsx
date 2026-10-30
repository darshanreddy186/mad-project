import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarX } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BookingCard } from '@/components/BookingCard';
import { Button } from '@/components/Button';
import { Segments } from '@/components/Chip';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { listShopBookings, updateBookingStatus } from '@/api/bookings';
import { useQuery } from '@/hooks/useQuery';
import { useOwnerStore } from '@/store/useOwnerStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';
import type { Booking, BookingStatus } from '@/types';

type Tab = 'pending' | 'upcoming' | 'history';

export default function OwnerBookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const shop = useOwnerStore((s) => s.shop);
  const [tab, setTab] = useState<Tab>(params.tab ?? 'pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, refresh, refreshing, refetch } = useQuery(() => listShopBookings(shop!.id), [shop?.id], {
    enabled: Boolean(shop),
    refetchOnFocus: true,
  });

  if (!shop) return <EmptyState title="Register your shop first" />;

  const today = toISODate(new Date());
  const all = data ?? [];
  const groups: Record<Tab, Booking[]> = {
    pending: all.filter((b) => b.status === 'pending'),
    upcoming: all.filter((b) => (b.status === 'confirmed' || b.status === 'in_progress') && b.booking_date >= today),
    history: all
      .filter((b) => !['pending', 'confirmed', 'in_progress'].includes(b.status) || b.booking_date < today)
      .reverse(),
  };

  const quick = async (booking: Booking, status: BookingStatus) => {
    if (status === 'rejected' && !(await confirm('Decline booking', `Decline ${booking.customer_name}'s request?`, { confirmText: 'Decline', destructive: true }))) {
      return;
    }
    setBusyId(booking.id);
    try {
      await updateBookingStatus(booking.id, status);
      toast.success(status === 'confirmed' ? 'Booking accepted.' : 'Booking declined.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Bookings" subtitle={shop.name} />
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <>
          <View className="px-5 pb-3">
            <Segments
              value={tab}
              onChange={setTab}
              options={[
                { value: 'pending', label: 'Requests', count: groups.pending.length },
                { value: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
                { value: 'history', label: 'History' },
              ]}
            />
          </View>
          <FlatList
            data={groups[tab]}
            keyExtractor={(b) => b.id}
            refreshing={refreshing}
            onRefresh={refresh}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
            renderItem={({ item }) => (
              <View>
                <BookingCard booking={item} perspective="owner" onPress={() => router.push(`/booking/${item.id}`)} />
                {item.status === 'pending' && (
                  <View className="-mt-1 mb-4 flex-row gap-2">
                    <View className="flex-1">
                      <Button label="Accept" size="sm" loading={busyId === item.id} disabled={busyId !== null} onPress={() => quick(item, 'confirmed')} fullWidth />
                    </View>
                    <View className="flex-1">
                      <Button label="Decline" size="sm" variant="danger" disabled={busyId !== null} onPress={() => quick(item, 'rejected')} fullWidth />
                    </View>
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon={CalendarX}
                title={tab === 'pending' ? 'No new requests' : tab === 'upcoming' ? 'Nothing scheduled' : 'No past bookings'}
                message={tab === 'pending' ? 'New booking requests from customers appear here.' : undefined}
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
