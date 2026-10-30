import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Car, Clock, MapPin, Phone, StickyNote, Store, User, MessageSquareReply } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { BOOKING_STATUS, OWNER_BOOKING_ACTIONS } from '@/constants/status';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { cancelBooking, getBooking, updateBookingStatus } from '@/api/bookings';
import { subscribeToRow } from '@/api/realtime';
import { useQuery } from '@/hooks/useQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { confirm } from '@/lib/dialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate, formatTime, timeAgo } from '@/lib/format';
import { callPhone, openDirections } from '@/lib/linking';
import type { BookingStatus } from '@/types';

function Row({ icon: Icon, label, value, onPress }: { icon: typeof Calendar; label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="flex-row items-start gap-3 py-2">
      <Icon size={16} color={Colors.charcoal[400]} />
      <View className="flex-1">
        <Text className="text-[11px]" style={{ color: Colors.charcoal[500] }}>{label}</Text>
        <Text className="text-sm" style={{ color: onPress ? Colors.electric[400] : Colors.charcoal[100] }}>{value}</Text>
      </View>
    </Pressable>
  );
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState<BookingStatus | 'cancel' | null>(null);

  const { data: booking, loading, error, refresh, refreshing, refetch } = useQuery(() => getBooking(id), [id], {
    enabled: Boolean(id && userId),
    refetchOnFocus: true,
  });

  useEffect(() => (id ? subscribeToRow('bookings', id, refetch) : undefined), [id, refetch]);
  useEffect(() => setResponse(booking?.shop_response ?? ''), [booking?.shop_response]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;
  if (!booking) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <ScreenHeader title="Booking" />
        <EmptyState title="Booking not found" message="It may have been removed or you no longer have access." />
      </SafeAreaView>
    );
  }

  const isCustomer = booking.user_id === userId;
  const status = BOOKING_STATUS[booking.status];
  const ownerActions = isCustomer ? [] : OWNER_BOOKING_ACTIONS[booking.status];
  const canCancel = isCustomer && (booking.status === 'pending' || booking.status === 'confirmed');
  const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ');

  const changeStatus = async (next: BookingStatus, label: string) => {
    const destructive = next === 'rejected' || next === 'cancelled';
    if (destructive && !(await confirm(`${label} booking`, `Are you sure you want to ${label.toLowerCase()} this booking? The customer will be notified.`, { confirmText: label, destructive }))) {
      return;
    }
    setBusy(next);
    try {
      await updateBookingStatus(booking.id, next, response);
      toast.success(`Booking ${BOOKING_STATUS[next].label.toLowerCase()}.`);
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!(await confirm('Cancel booking', 'Cancel this booking? The shop will be notified.', { confirmText: 'Cancel booking', cancelText: 'Keep', destructive: true }))) return;
    setBusy('cancel');
    try {
      await cancelBooking(booking.id);
      toast.success('Booking cancelled.');
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const saveResponse = async () => {
    setBusy(booking.status);
    try {
      await updateBookingStatus(booking.id, booking.status, response);
      toast.success('Message saved.');
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Booking details" subtitle={`Requested ${timeAgo(booking.created_at)}`} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accent[500]} />}
        keyboardShouldPersistTaps="handled">
        <View className="rounded-2xl p-5" style={{ backgroundColor: Colors.charcoal[800] }}>
          <StatusBadge label={status.label} color={status.color} />
          <Text className="mt-3 text-xl font-bold text-white">{booking.service_name}</Text>
          <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
            {isCustomer ? booking.shop?.name : `Customer: ${booking.customer_name}`}
          </Text>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 flex-row items-center gap-2 rounded-xl p-3" style={{ backgroundColor: Colors.charcoal[700] }}>
              <Calendar size={16} color={Colors.accent[500]} />
              <Text className="text-sm font-semibold text-white">
                {formatDate(booking.booking_date, { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View className="flex-1 flex-row items-center gap-2 rounded-xl p-3" style={{ backgroundColor: Colors.charcoal[700] }}>
              <Clock size={16} color={Colors.accent[500]} />
              <Text className="text-sm font-semibold text-white">{formatTime(booking.booking_time)}</Text>
            </View>
          </View>
        </View>

        {booking.shop_response && isCustomer && (
          <Card title="Message from the shop" icon={MessageSquareReply}>
            <Text className="text-sm leading-5" style={{ color: Colors.charcoal[200] }}>{booking.shop_response}</Text>
          </Card>
        )}

        <Card title="Details">
          {!!vehicle && <Row icon={Car} label="Vehicle" value={vehicle} />}
          {booking.notes && <Row icon={StickyNote} label="Customer notes" value={booking.notes} />}
          {isCustomer ? (
            <>
              <Row icon={Store} label="Shop" value={booking.shop?.name ?? ''} onPress={() => router.push(`/shop/${booking.shop_id}`)} />
              {booking.shop?.address && (
                <Row
                  icon={MapPin}
                  label="Address"
                  value={`${booking.shop.address}, ${booking.shop.city}`}
                  onPress={
                    booking.shop.latitude !== undefined
                      ? () => openDirections(booking.shop!.latitude!, booking.shop!.longitude!, booking.shop!.name).catch(() => {})
                      : undefined
                  }
                />
              )}
              {booking.shop?.phone && (
                <Row icon={Phone} label="Phone" value={booking.shop.phone} onPress={() => callPhone(booking.shop!.phone!).catch(() => {})} />
              )}
            </>
          ) : (
            <>
              <Row icon={User} label="Customer" value={booking.customer_name} />
              <Row icon={Phone} label="Phone" value={booking.customer_phone} onPress={() => callPhone(booking.customer_phone).catch(() => {})} />
            </>
          )}
        </Card>

        {!isCustomer && (ownerActions.length > 0 || booking.shop_response) && (
          <Card title="Respond to customer">
            <Input
              value={response}
              onChangeText={setResponse}
              placeholder="Optional message, e.g. what to bring or a suggested alternative time"
              multiline
              numberOfLines={3}
              maxLength={1000}
              autoCapitalize="sentences"
            />
            {ownerActions.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {ownerActions.map((a) => (
                  <View key={a.status} className="min-w-[30%] flex-1">
                    <Button
                      label={a.label}
                      variant={a.status === 'rejected' || a.status === 'cancelled' ? 'danger' : a.status === 'confirmed' ? 'primary' : 'secondary'}
                      loading={busy === a.status}
                      disabled={busy !== null}
                      onPress={() => changeStatus(a.status, a.label)}
                      fullWidth
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className="mt-3">
                <Button label="Save message" variant="outline" loading={busy !== null} onPress={saveResponse} fullWidth />
              </View>
            )}
          </Card>
        )}

        {isCustomer && (
          <View className="gap-3">
            {booking.status === 'completed' && (
              <Button label="Leave a review" onPress={() => router.push(`/shop/${booking.shop_id}/review`)} fullWidth />
            )}
            {canCancel && <Button label="Cancel booking" variant="danger" loading={busy === 'cancel'} onPress={cancel} fullWidth />}
            {(booking.status === 'cancelled' || booking.status === 'rejected' || booking.status === 'completed') && (
              <Button label="Book again" variant="outline" onPress={() => router.push(`/shop/${booking.shop_id}/book`)} fullWidth />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
