import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import type { Enquiry, EnquiryStatus, EnquiryType } from '@/types';
import { mapEnquiry, SHOP_SUMMARY_COLUMNS } from './mappers';

const SELECT = `*, shop:shops(${SHOP_SUMMARY_COLUMNS})`;

export interface EnquiryInput {
  shop_id: string;
  user_id: string;
  type: EnquiryType;
  service_id: string | null;
  subject: string;
  message: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  budget: number | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const { data, error } = await supabase.from('enquiries').insert(input).select(SELECT).single();
  if (error) throw toAppError(error);
  return mapEnquiry(data);
}

export async function listMyEnquiries(userId: string): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select(SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(mapEnquiry);
}

export async function listShopEnquiries(shopId: string, status?: EnquiryStatus): Promise<Enquiry[]> {
  let query = supabase
    .from('enquiries')
    .select(SELECT)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []).map(mapEnquiry);
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  const { data, error } = await supabase.from('enquiries').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw toAppError(error);
  return data ? mapEnquiry(data) : null;
}

/** Shop owner reply; a reply marks the enquiry as responded. */
export async function respondToEnquiry(id: string, response: string, quotedPrice: number | null) {
  check(
    await supabase
      .from('enquiries')
      .update({ response: response.trim(), quoted_price: quotedPrice })
      .eq('id', id)
  );
}

export async function closeEnquiry(id: string) {
  check(await supabase.from('enquiries').update({ status: 'closed' }).eq('id', id));
}
