// Shop-owner managed content: services, gallery images and portfolio projects.
import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import { removeFiles, uploadImage, type PickedImage } from '@/lib/storage';
import { STORAGE_BUCKETS } from '@/constants/config';
import type { PortfolioItem, ShopImage, ShopService } from '@/types';
import { mapImage, mapPortfolio, mapService } from './mappers';

// Services ---------------------------------------------------------------------

export interface ServiceInput {
  name: string;
  description: string;
  category_id: string | null;
  price_from: number;
  price_to: number | null;
  unit: string;
  duration_minutes: number | null;
  is_active: boolean;
}

export async function listServices(shopId: string, includeInactive = false): Promise<ShopService[]> {
  let query = supabase.from('shop_services').select('*').eq('shop_id', shopId).order('created_at');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []).map(mapService);
}

export async function createService(shopId: string, input: ServiceInput) {
  check(await supabase.from('shop_services').insert({ ...input, shop_id: shopId }));
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  check(await supabase.from('shop_services').update(input).eq('id', id));
}

export async function deleteService(id: string) {
  check(await supabase.from('shop_services').delete().eq('id', id));
}

// Gallery ----------------------------------------------------------------------

export async function listImages(shopId: string): Promise<ShopImage[]> {
  const { data, error } = await supabase
    .from('shop_images')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order')
    .order('created_at');
  if (error) throw toAppError(error);
  return (data ?? []).map(mapImage);
}

export async function addImage(shopId: string, image: PickedImage, caption?: string, sortOrder = 0) {
  const uploaded = await uploadImage(STORAGE_BUCKETS.shopMedia, `${shopId}/gallery`, 'photo', image);
  const { error } = await supabase.from('shop_images').insert({
    shop_id: shopId,
    image_url: uploaded.publicUrl,
    storage_path: uploaded.path,
    caption: caption?.trim() || null,
    sort_order: sortOrder,
  });
  if (error) {
    await removeFiles(STORAGE_BUCKETS.shopMedia, [uploaded.path]);
    throw toAppError(error);
  }
}

export async function deleteImage(image: ShopImage) {
  check(await supabase.from('shop_images').delete().eq('id', image.id));
  await removeFiles(STORAGE_BUCKETS.shopMedia, [image.storage_path]);
}

// Portfolio --------------------------------------------------------------------

export interface PortfolioInput {
  title: string;
  description: string;
  category_id: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
}

export async function listPortfolio(shopId: string): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('shop_portfolio')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(mapPortfolio);
}

export async function createPortfolioItem(
  shopId: string,
  input: PortfolioInput,
  before: PickedImage,
  after: PickedImage
) {
  const folder = `${shopId}/portfolio`;
  const [b, a] = await Promise.all([
    uploadImage(STORAGE_BUCKETS.shopMedia, folder, 'before', before),
    uploadImage(STORAGE_BUCKETS.shopMedia, folder, 'after', after),
  ]);
  const { error } = await supabase.from('shop_portfolio').insert({
    ...input,
    shop_id: shopId,
    before_image_url: b.publicUrl,
    before_image_path: b.path,
    after_image_url: a.publicUrl,
    after_image_path: a.path,
  });
  if (error) {
    await removeFiles(STORAGE_BUCKETS.shopMedia, [b.path, a.path]);
    throw toAppError(error);
  }
}

export async function updatePortfolioItem(id: string, input: PortfolioInput) {
  check(await supabase.from('shop_portfolio').update(input).eq('id', id));
}

export async function deletePortfolioItem(item: PortfolioItem) {
  check(await supabase.from('shop_portfolio').delete().eq('id', item.id));
  await removeFiles(STORAGE_BUCKETS.shopMedia, [item.before_image_path, item.after_image_path]);
}
