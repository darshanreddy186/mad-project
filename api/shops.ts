import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import { distanceKm } from '@/lib/geo';
import { pathFromPublicUrl, removeFiles, uploadImage, type PickedImage } from '@/lib/storage';
import { STORAGE_BUCKETS } from '@/constants/config';
import type {
  Coordinates,
  OpeningHours,
  PortfolioItem,
  PriceLevel,
  Review,
  ServiceCategory,
  Shop,
  ShopImage,
  ShopService,
  ShopStatus,
  SortOption,
} from '@/types';
import { mapImage, mapPortfolio, mapService, mapShop, SHOP_COLUMNS } from './mappers';
import { listShopReviews } from './reviews';

export interface ShopSearchParams {
  coords?: Coordinates | null;
  radiusKm?: number | null;
  query?: string;
  categories?: string[];
  minRating?: number;
  maxPriceLevel?: number;
  sortBy?: SortOption;
  shopIds?: string[];
  limit?: number;
  offset?: number;
}

/** Nearby/filtered discovery via the PostGIS-backed search_shops RPC. */
export async function searchShops(params: ShopSearchParams = {}): Promise<Shop[]> {
  const { data, error } = await supabase.rpc('search_shops', {
    p_lat: params.coords?.latitude,
    p_lng: params.coords?.longitude,
    p_radius_km: params.radiusKm ?? undefined,
    p_query: params.query?.trim() || undefined,
    p_category_slugs: params.categories?.length ? params.categories : undefined,
    p_min_rating: params.minRating || undefined,
    p_max_price_level: params.maxPriceLevel,
    p_sort: params.sortBy ?? 'distance',
    p_shop_ids: params.shopIds,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  });
  if (error) throw toAppError(error);
  return (data ?? []).map((row) => mapShop({ ...row, rejection_reason: null }));
}

export interface ShopDetails {
  shop: Shop;
  services: ShopService[];
  images: ShopImage[];
  portfolio: PortfolioItem[];
  reviews: Review[];
}

/**
 * Loads a full shop profile. RLS decides visibility: approved shops are public,
 * pending/rejected shops are visible only to their owner and admins.
 */
export async function getShopDetails(
  id: string,
  coords: Coordinates | null,
  categories: ServiceCategory[]
): Promise<ShopDetails | null> {
  const [shopRes, servicesRes, imagesRes, portfolioRes, reviews] = await Promise.all([
    supabase.from('shops').select(SHOP_COLUMNS).eq('id', id).maybeSingle(),
    supabase.from('shop_services').select('*').eq('shop_id', id).eq('is_active', true).order('price_from'),
    supabase.from('shop_images').select('*').eq('shop_id', id).order('sort_order').order('created_at'),
    supabase.from('shop_portfolio').select('*').eq('shop_id', id).order('created_at', { ascending: false }),
    listShopReviews(id),
  ]);
  if (shopRes.error) throw toAppError(shopRes.error);
  if (!shopRes.data) return null;
  if (servicesRes.error) throw toAppError(servicesRes.error);
  if (imagesRes.error) throw toAppError(imagesRes.error);
  if (portfolioRes.error) throw toAppError(portfolioRes.error);

  const services = (servicesRes.data ?? []).map(mapService);
  const slugById = new Map(categories.map((c) => [c.id, c.slug]));
  const categorySlugs = [
    ...new Set(services.map((s) => (s.category_id ? slugById.get(s.category_id) : undefined))),
  ].filter((s): s is string => Boolean(s));

  const base = mapShop(shopRes.data);
  const shop: Shop = {
    ...base,
    category_slugs: categorySlugs,
    min_price: services.length ? Math.min(...services.map((s) => s.price_from)) : null,
    distance_km: coords ? distanceKm(coords, base) : null,
  };

  return {
    shop,
    services,
    images: (imagesRes.data ?? []).map(mapImage),
    portfolio: (portfolioRes.data ?? []).map(mapPortfolio),
    reviews,
  };
}

/** Shop plus its active services; used by the booking and enquiry forms. */
export async function getShopWithServices(id: string) {
  const [shopRes, servicesRes] = await Promise.all([
    supabase.from('shops').select(SHOP_COLUMNS).eq('id', id).maybeSingle(),
    supabase.from('shop_services').select('*').eq('shop_id', id).eq('is_active', true).order('price_from'),
  ]);
  if (shopRes.error) throw toAppError(shopRes.error);
  if (servicesRes.error) throw toAppError(servicesRes.error);
  if (!shopRes.data) return null;
  return { shop: mapShop(shopRes.data), services: (servicesRes.data ?? []).map(mapService) };
}

// -----------------------------------------------------------------------------
// Shop owner
// -----------------------------------------------------------------------------

export interface ShopInput {
  name: string;
  description: string;
  address: string;
  city: string;
  postcode: string | null;
  latitude: number;
  longitude: number;
  phone: string;
  email: string | null;
  website: string | null;
  price_level: PriceLevel;
  opening_hours: OpeningHours[];
  vehicle_brands: string[];
}

export async function getMyShop(ownerId: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from('shops')
    .select(SHOP_COLUMNS)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw toAppError(error);
  return data ? mapShop(data) : null;
}

function toRow(input: ShopInput) {
  return { ...input, opening_hours: input.opening_hours as unknown as never };
}

export async function createShop(ownerId: string, input: ShopInput): Promise<Shop> {
  const { data, error } = await supabase
    .from('shops')
    .insert({ ...toRow(input), owner_id: ownerId })
    .select(SHOP_COLUMNS)
    .single();
  if (error) {
    if (error.code === '23505') throw toAppError({ message: 'You have already registered a shop.' });
    throw toAppError(error);
  }
  return mapShop(data);
}

export async function updateShop(id: string, input: Partial<ShopInput>): Promise<Shop> {
  const row = input.opening_hours ? toRow(input as ShopInput) : input;
  const { data, error } = await supabase
    .from('shops')
    .update(row as never)
    .eq('id', id)
    .select(SHOP_COLUMNS)
    .single();
  if (error) throw toAppError(error);
  return mapShop(data);
}

/** Re-submits a rejected shop for review. */
export async function resubmitShop(id: string) {
  check(await supabase.from('shops').update({ status: 'pending' }).eq('id', id));
}

export async function updateShopBranding(
  shop: Shop,
  kind: 'logo' | 'cover',
  image: PickedImage
): Promise<Shop> {
  const uploaded = await uploadImage(STORAGE_BUCKETS.shopMedia, `${shop.id}/branding`, kind, image);
  const previous = kind === 'logo' ? shop.logo_url : shop.cover_image_url;
  const patch =
    kind === 'logo' ? { logo_url: uploaded.publicUrl } : { cover_image_url: uploaded.publicUrl };
  const { data, error } = await supabase
    .from('shops')
    .update(patch)
    .eq('id', shop.id)
    .select(SHOP_COLUMNS)
    .single();
  if (error) {
    await removeFiles(STORAGE_BUCKETS.shopMedia, [uploaded.path]);
    throw toAppError(error);
  }
  await removeFiles(STORAGE_BUCKETS.shopMedia, [pathFromPublicUrl(STORAGE_BUCKETS.shopMedia, previous)]);
  return mapShop(data);
}

export interface OwnerStats {
  pendingBookings: number;
  upcomingBookings: number;
  openEnquiries: number;
  services: number;
  portfolio: number;
  images: number;
}

export async function getOwnerStats(shopId: string): Promise<OwnerStats> {
  const head = { count: 'exact' as const, head: true };
  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.all([
    supabase.from('bookings').select('id', head).eq('shop_id', shopId).eq('status', 'pending'),
    supabase
      .from('bookings')
      .select('id', head)
      .eq('shop_id', shopId)
      .in('status', ['confirmed', 'in_progress'])
      .gte('booking_date', today),
    supabase.from('enquiries').select('id', head).eq('shop_id', shopId).eq('status', 'open'),
    supabase.from('shop_services').select('id', head).eq('shop_id', shopId),
    supabase.from('shop_portfolio').select('id', head).eq('shop_id', shopId),
    supabase.from('shop_images').select('id', head).eq('shop_id', shopId),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw toAppError(failed.error);
  const [pending, upcoming, enquiries, services, portfolio, images] = results.map((r) => r.count ?? 0);
  return {
    pendingBookings: pending!,
    upcomingBookings: upcoming!,
    openEnquiries: enquiries!,
    services: services!,
    portfolio: portfolio!,
    images: images!,
  };
}

// -----------------------------------------------------------------------------
// Admin
// -----------------------------------------------------------------------------

export async function listShopsByStatus(status: ShopStatus | 'all', search = ''): Promise<Shop[]> {
  let query = supabase.from('shops').select(SHOP_COLUMNS).order('created_at', { ascending: false }).limit(100);
  if (status !== 'all') query = query.eq('status', status);
  const term = search.trim().replace(/[%_,()]/g, '');
  if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []).map(mapShop);
}

export async function setShopStatus(id: string, status: ShopStatus, reason?: string) {
  check(
    await supabase
      .from('shops')
      .update({ status, rejection_reason: status === 'rejected' ? reason?.trim() || null : null })
      .eq('id', id)
  );
}

export async function setShopVerified(id: string, verified: boolean) {
  check(await supabase.from('shops').update({ is_verified: verified }).eq('id', id));
}
