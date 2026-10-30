import { Pressable, Text, View } from 'react-native';
import { Calendar, Car, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { BOOKING_STATUS } from '@/constants/status';
import { formatDate, formatTime } from '@/lib/format';
import type { Booking } from '@/types';
import { StatusBadge } from './StatusBadge';

interface BookingCardProps {
  booking: Booking;
  /** Show the customer (shop owner view) instead of the shop name. */
  perspective?: 'customer' | 'owner';
  onPress?: () => void;
}

export function BookingCard({ booking, perspective = 'customer', onPress }: BookingCardProps) {
  const status = BOOKING_STATUS[booking.status];
  const vehicle = [booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mb-3 rounded-2xl p-4"
      style={{ backgroundColor: Colors.charcoal[800] }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
            {booking.service_name}
          </Text>
          <Text className="mt-0.5 text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
            {perspective === 'owner' ? booking.customer_name : (booking.shop?.name ?? 'Shop')}
          </Text>
        </View>
        <StatusBadge label={status.label} color={status.color} />
      </View>
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
        <View className="flex-row items-center gap-1.5">
          <Calendar size={13} color={Colors.charcoal[400]} />
          <Text className="text-xs" style={{ color: Colors.charcoal[200] }}>
            {formatDate(booking.booking_date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Clock size={13} color={Colors.charcoal[400]} />
          <Text className="text-xs" style={{ color: Colors.charcoal[200] }}>
            {formatTime(booking.booking_time)}
          </Text>
        </View>
        {!!vehicle && (
          <View className="flex-row items-center gap-1.5">
            <Car size={13} color={Colors.charcoal[400]} />
            <Text className="text-xs" style={{ color: Colors.charcoal[200] }} numberOfLines={1}>
              {vehicle}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
