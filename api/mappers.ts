import type { Database } from '@/types/database';
import type {
  AppNotification,
  Booking,
  Enquiry,
  PortfolioItem,
  PriceLevel,
  Profile,
  Review,
  Shop,
  ShopImage,
  ShopService,
  ShopSummary,
} from '@/types';
import { normalizeOpeningHours } from '@/lib/schedule';

type Tables = Database['public']['Tables'];
type Row<T extends keyof Tables> = Tables[T]['Row'];

export const SHOP_COLUMNS =
  'id, owner_id, name, description, address, city, postcode, latitude, longitude, phone, email, website, price_level, opening_hours, vehicle_brands, cover_image_url, logo_url, rating, review_count, status, is_verified, rejection_reason, created_at';

export const SHOP_SUMMARY_COLUMNS = 'id, name, city, address, phone, cover_image_url, latitude, longitude';

const toNumber = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

function toPriceLevel(v: unknown): PriceLevel {
  const n = Math.round(Number(v));
  return (n >= 1 && n <= 4 ? n : 2) as PriceLevel;
}

type ShopLike = Omit<
  Row<'shops'>,
  'location' | 'approved_at' | 'updated_at' | 'rejection_reason' | 'opening_hours'
> & {
  opening_hours: unknown;
  rejection_reason?: string | null;
  distance_km?: number | null;
  category_slugs?: string[] | null;
  min_price?: number | null;
};

export function mapShop(row: ShopLike): Shop {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description ?? '',
    address: row.address,
    city: row.city,
    postcode: row.postcode ?? null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    phone: row.phone,
    email: row.email ?? null,
    website: row.website ?? null,
    price_level: toPriceLevel(row.price_level),
    opening_hours: normalizeOpeningHours(row.opening_hours),
    vehicle_brands: row.vehicle_brands ?? [],
    cover_image_url: row.cover_image_url ?? null,
    logo_url: row.logo_url ?? null,
    rating: Number(row.rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    status: row.status,
    is_verified: Boolean(row.is_verified),
    rejection_reason: row.rejection_reason ?? null,
    created_at: row.created_at,
    distance_km: toNumber(row.distance_km),
    category_slugs: row.category_slugs ?? [],
    min_price: toNumber(row.min_price),
  };
}

export function mapShopSummary(row: Partial<ShopSummary> | null | undefined): ShopSummary | undefined {
  if (!row?.id) return undefined;
  return {
    id: row.id,
    name: row.name ?? '',
    city: row.city ?? '',
    address: row.address,
    phone: row.phone,
    cover_image_url: row.cover_image_url ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export function mapProfile(row: Omit<Row<'profiles'>, 'expo_push_token'>): Profile {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    avatar_url: row.avatar_url,
    role: row.role,
    is_suspended: row.is_suspended,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapService(row: Row<'shop_services'>): ShopService {
  return {
    ...row,
    price_from: Number(row.price_from),
    price_to: toNumber(row.price_to),
  };
}

export function mapImage(row: Row<'shop_images'>): ShopImage {
  return row;
}

export function mapPortfolio(row: Row<'shop_portfolio'>): PortfolioItem {
  return row;
}

export function mapReview(
  row: Row<'reviews'> & { shop?: Partial<ShopSummary> | null }
): Review {
  const { shop, ...rest } = row;
  return { ...rest, shop: mapShopSummary(shop) };
}

export function mapBooking(row: Row<'bookings'> & { shop?: Partial<ShopSummary> | null }): Booking {
  const { shop, ...rest } = row;
  return { ...rest, shop: mapShopSummary(shop) };
}

export function mapEnquiry(row: Row<'enquiries'> & { shop?: Partial<ShopSummary> | null }): Enquiry {
  const { shop, ...rest } = row;
  return {
    ...rest,
    budget: toNumber(rest.budget),
    quoted_price: toNumber(rest.quoted_price),
    shop: mapShopSummary(shop),
  };
}

export function mapNotification(row: Row<'notifications'>): AppNotification {
  const data =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, string | undefined>)
      : {};
  return { ...row, data };
}
