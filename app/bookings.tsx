import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarX } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BookingCard } from '@/components/BookingCard';
import { Segments } from '@/components/Chip';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { SignInPrompt } from '@/components/SignInPrompt';
import { ACTIVE_BOOKING_STATUSES, listMyBookings } from '@/api/bookings';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toISODate } from '@/lib/format';

type Tab = 'upcoming' | 'past';

export default function MyBookingsScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [tab, setTab] = useState<Tab>('upcoming');

  const { data, loading, error, refresh, refreshing } = useQuery(() => listMyBookings(userId!), [userId], {
    enabled: Boolean(userId),
    refetchOnFocus: true,
  });

  const today = toISODate(new Date());
  const all = data ?? [];
  const upcoming = all
    .filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status) && b.booking_date >= today)
    .sort((a, b) => `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`));
  const past = all.filter((b) => !upcoming.includes(b));
  const items = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="My bookings" />
      {!userId ? (
        <SignInPrompt message="Sign in to view your booking history." />
      ) : loading ? (
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
                { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
                { value: 'past', label: 'History', count: past.length },
              ]}
            />
          </View>
          <FlatList
            data={items}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => <BookingCard booking={item} onPress={() => router.push(`/booking/${item.id}`)} />}
            refreshing={refreshing}
            onRefresh={refresh}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
            ListEmptyComponent={
              <EmptyState
                icon={CalendarX}
                title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
                message="Find a shop and book your next modification."
                actionLabel="Find shops"
                onAction={() => router.push('/shops')}
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}
