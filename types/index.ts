export type UserRole = 'customer' | 'shop_owner' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  color: string;
}

export interface ShopService {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  description: string;
  price_from: number;
  price_to: number;
  unit: string;
  created_at: string;
}

export interface ShopImage {
  id: string;
  shop_id: string;
  image_url: string;
  caption?: string;
  sort_order: number;
}

export interface PortfolioItem {
  id: string;
  shop_id: string;
  title: string;
  description: string;
  before_image_url: string;
  after_image_url: string;
  vehicle_make: string;
  vehicle_model: string;
  category_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  shop_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  review_count: number;
  price_level: 1 | 2 | 3 | 4;
  is_verified: boolean;
  is_favourite: boolean;
  opening_hours: OpeningHours[];
  categories: string[];
  vehicle_brands: string[];
  cover_image_url: string;
  logo_url: string;
  distance?: number;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Booking {
  id: string;
  shop_id: string;
  shop_name: string;
  user_id: string;
  service_name: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface Enquiry {
  id: string;
  shop_id: string;
  shop_name: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'responded' | 'closed';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'booking' | 'enquiry' | 'review' | 'system';
  read: boolean;
  created_at: string;
}

export interface FilterOptions {
  categories: string[];
  maxDistance: number;
  minRating: number;
  maxPriceLevel: number;
  sortBy: 'distance' | 'rating' | 'name';
}
