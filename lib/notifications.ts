import type { Href } from 'expo-router';
import type { NotificationType } from '@/types';

/** Deep-link target for a notification payload (in-app or push). */
export function routeForNotification(
  type: NotificationType | string | undefined,
  data: Record<string, unknown> | undefined
): Href | null {
  const get = (key: string) => (typeof data?.[key] === 'string' ? (data[key] as string) : undefined);
  const bookingId = get('booking_id');
  const enquiryId = get('enquiry_id');
  const shopId = get('shop_id');

  if (bookingId) return `/booking/${bookingId}`;
  if (enquiryId) return `/enquiry/${enquiryId}`;
  if (type === 'shop') return '/owner';
  if (shopId) return `/shop/${shopId}`;
  return null;
}
