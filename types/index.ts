// Domain types used throughout the app. Database row types live in
// types/database.ts (generated); the api/ layer maps rows to these shapes.

export type UserRole = 'customer' | 'shop_owner' | 'admin';
export type ShopStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type EnquiryType = 'general' | 'quote';
export type EnquiryStatus = 'open' | 'responded' | 'closed';
export type ReviewStatus = 'published' | 'hidden';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type NotificationType = 'booking' | 'enquiry' | 'review' | 'shop' | 'system';
export type PriceLevel = 1 | 2 | 3 | 4;
export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface OpeningHours {
  day: DayKey;
  open: string;
  close: string;
  closed: boolean;
}

export interface Shop {
  id: string;
  owner_id: string;
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
  cover_image_url: string | null;
  logo_url: string | null;
  rating: number;
  review_count: number;
  status: ShopStatus;
  is_verified: boolean;
  rejection_reason?: string | null;
  created_at: string;
  /** Kilometres from the user's location, when known. */
  distance_km: number | null;
  /** Category slugs derived from the shop's active services. */
  category_slugs: string[];
  /** Cheapest active service, when known. */
  min_price: number | null;
}

export interface ShopService {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price_from: number;
  price_to: number | null;
  unit: string;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ShopImage {
  id: string;
  shop_id: string;
  image_url: string;
  storage_path: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  shop_id: string;
  category_id: string | null;
  title: string;
  description: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  before_image_url: string;
  before_image_path: string | null;
  after_image_url: string;
  after_image_path: string | null;
  created_at: string;
}

export interface ReviewAuthor {
  full_name: string;
  avatar_url: string | null;
}

export interface Review {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
  author?: ReviewAuthor;
  shop?: ShopSummary;
}

export interface ShopSummary {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  cover_image_url: string | null;
  latitude?: number;
  longitude?: number;
}

export interface Booking {
  id: string;
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
  status: BookingStatus;
  shop_response: string | null;
  created_at: string;
  updated_at: string;
  shop?: ShopSummary;
}

export interface Enquiry {
  id: string;
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
  status: EnquiryStatus;
  response: string | null;
  quoted_price: number | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  shop?: ShopSummary;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string | undefined>;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  review_id: string | null;
  shop_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  review?: Pick<Review, 'id' | 'rating' | 'comment' | 'status' | 'shop_id'> | null;
  shop?: Pick<ShopSummary, 'id' | 'name' | 'city'> | null;
}

export type SortOption = 'distance' | 'rating' | 'name';

export interface FilterOptions {
  categories: string[];
  /** In the display distance unit; null = any distance. */
  maxDistance: number | null;
  minRating: number;
  maxPriceLevel: PriceLevel;
  sortBy: SortOption;
}

export interface AdminStats {
  users: {
    total: number;
    customers: number;
    shop_owners: number;
    admins: number;
    suspended: number;
    new_30d: number;
  };
  shops: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
    verified: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    last_30d: number;
  };
  enquiries: { total: number; open: number; quotes: number };
  reviews: { total: number; hidden: number; average: number };
  reports: { open: number; total: number };
  top_categories: { name: string; color: string; bookings: number }[];
  bookings_by_day: { day: string; count: number }[];
}
