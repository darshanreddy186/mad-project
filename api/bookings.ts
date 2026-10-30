import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import type { Booking, BookingStatus } from '@/types';
import { mapBooking, SHOP_SUMMARY_COLUMNS } from './mappers';

const SELECT = `*, shop:shops(${SHOP_SUMMARY_COLUMNS})`;

export interface BookingInput {
  shop_id: string;
  user_id: string;
  service_id: string | null;
  service_name: string;
  booking_date: string;
  booking_time: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const { data, error } = await supabase.from('bookings').insert(input).select(SELECT).single();
  if (error?.code === '23505') {
    throw toAppError({ message: 'That time slot has just been taken. Please choose another.' });
  }
  if (error) throw toAppError(error);
  return mapBooking(data);
}

export async function listMyBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(SELECT)
    .eq('user_id', userId)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(mapBooking);
}

export async function listShopBookings(shopId: string, statuses?: BookingStatus[]): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select(SELECT)
    .eq('shop_id', shopId)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })
    .limit(200);
  if (statuses?.length) query = query.in('status', statuses);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []).map(mapBooking);
}

export async function getBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw toAppError(error);
  return data ? mapBooking(data) : null;
}

/** Shop owner action. Valid transitions are enforced by the database. */
export async function updateBookingStatus(id: string, status: BookingStatus, response?: string) {
  const patch: { status: BookingStatus; shop_response?: string | null } = { status };
  if (response !== undefined) patch.shop_response = response.trim() || null;
  check(await supabase.from('bookings').update(patch).eq('id', id));
}

export async function cancelBooking(id: string) {
  check(await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id));
}

/** Booked times for a shop/date so customers are not offered taken slots. */
export async function listTakenSlots(shopId: string, date: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('booked_slots', { p_shop_id: shopId, p_date: date });
  if (error) {
    console.warn('[bookings] could not load taken slots', error.message);
    return [];
  }
  return (data ?? []).map((t) => String(t).slice(0, 5));
}

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress'];
