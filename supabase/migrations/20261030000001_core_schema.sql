-- =============================================================================
-- AutoMod core schema
-- Tables, enums and indexes. Behaviour (triggers/functions), RLS and storage
-- live in the following migrations.
-- =============================================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'shop_owner', 'admin');
create type public.shop_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.booking_status as enum (
  'pending', 'confirmed', 'rejected', 'in_progress', 'completed', 'cancelled'
);
create type public.enquiry_type as enum ('general', 'quote');
create type public.enquiry_status as enum ('open', 'responded', 'closed');
create type public.review_status as enum ('published', 'hidden');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
create type public.notification_type as enum ('booking', 'enquiry', 'review', 'shop', 'system');

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on auth.users
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text,
  phone text check (phone is null or char_length(phone) <= 30),
  avatar_url text,
  role public.user_role not null default 'customer',
  is_suspended boolean not null default false,
  expo_push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create index profiles_created_at_idx on public.profiles (created_at desc);

-- -----------------------------------------------------------------------------
-- service_categories: modification categories (admin managed)
-- -----------------------------------------------------------------------------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 300),
  icon_name text not null default 'Wrench',
  color text not null default '#ff7d12' check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index service_categories_sort_idx on public.service_categories (sort_order, name);

-- -----------------------------------------------------------------------------
-- shops: one shop per owner; requires admin approval before it is listed
-- -----------------------------------------------------------------------------
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  address text not null check (char_length(address) between 3 and 200),
  city text not null check (char_length(city) between 2 and 80),
  postcode text check (postcode is null or char_length(postcode) <= 20),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(point, 4326),
  phone text not null check (char_length(phone) between 5 and 30),
  email text check (email is null or char_length(email) <= 120),
  website text check (website is null or char_length(website) <= 200),
  price_level smallint not null default 2 check (price_level between 1 and 4),
  opening_hours jsonb not null default '[]'::jsonb check (jsonb_typeof(opening_hours) = 'array'),
  vehicle_brands text[] not null default '{}',
  cover_image_url text,
  logo_url text,
  rating numeric(2, 1) not null default 0,
  review_count int not null default 0,
  status public.shop_status not null default 'pending',
  is_verified boolean not null default false,
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shops_location_idx on public.shops using gist (location);
create index shops_status_idx on public.shops (status);
create index shops_rating_idx on public.shops (rating desc, review_count desc);
create index shops_name_trgm_idx on public.shops using gin (name extensions.gin_trgm_ops);
create index shops_city_trgm_idx on public.shops using gin (city extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- shop_services: priced services offered by a shop
-- -----------------------------------------------------------------------------
create table public.shop_services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid references public.service_categories (id) on delete set null,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  price_from numeric(10, 2) not null check (price_from >= 0),
  price_to numeric(10, 2) check (price_to is null or price_to >= price_from),
  unit text not null default 'per vehicle' check (char_length(unit) <= 40),
  duration_minutes int check (duration_minutes is null or duration_minutes between 5 and 20160),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shop_services_shop_idx on public.shop_services (shop_id);
create index shop_services_category_idx on public.shop_services (category_id);
create index shop_services_name_trgm_idx on public.shop_services using gin (name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- shop_images: gallery photos (files live in the shop-media bucket)
-- -----------------------------------------------------------------------------
create table public.shop_images (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  image_url text not null,
  storage_path text,
  caption text check (caption is null or char_length(caption) <= 200),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index shop_images_shop_idx on public.shop_images (shop_id, sort_order);

-- -----------------------------------------------------------------------------
-- shop_portfolio: before-and-after modification projects
-- -----------------------------------------------------------------------------
create table public.shop_portfolio (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid references public.service_categories (id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  vehicle_make text not null check (char_length(vehicle_make) between 1 and 60),
  vehicle_model text not null check (char_length(vehicle_model) between 1 and 60),
  vehicle_year smallint check (vehicle_year is null or vehicle_year between 1900 and 2100),
  before_image_url text not null,
  before_image_path text,
  after_image_url text not null,
  after_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shop_portfolio_shop_idx on public.shop_portfolio (shop_id, created_at desc);

-- -----------------------------------------------------------------------------
-- reviews: one review per customer per shop
-- -----------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  status public.review_status not null default 'published',
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);
create index reviews_shop_idx on public.reviews (shop_id, status, created_at desc);
create index reviews_user_idx on public.reviews (user_id);

-- -----------------------------------------------------------------------------
-- favorites
-- -----------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);
create index favorites_shop_idx on public.favorites (shop_id);

-- -----------------------------------------------------------------------------
-- bookings: appointment requests; status is a guarded state machine
-- -----------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid references public.shop_services (id) on delete set null,
  service_name text not null check (char_length(service_name) between 2 and 100),
  booking_date date not null,
  booking_time time not null,
  vehicle_make text check (vehicle_make is null or char_length(vehicle_make) <= 60),
  vehicle_model text check (vehicle_model is null or char_length(vehicle_model) <= 60),
  vehicle_year smallint check (vehicle_year is null or vehicle_year between 1900 and 2100),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (char_length(customer_phone) between 5 and 30),
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.booking_status not null default 'pending',
  shop_response text check (shop_response is null or char_length(shop_response) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_user_idx on public.bookings (user_id, booking_date desc);
create index bookings_shop_idx on public.bookings (shop_id, status, booking_date);
create index bookings_service_idx on public.bookings (service_id);

-- -----------------------------------------------------------------------------
-- enquiries: general questions and quotation requests
-- -----------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.enquiry_type not null default 'general',
  service_id uuid references public.shop_services (id) on delete set null,
  subject text not null check (char_length(subject) between 2 and 150),
  message text not null check (char_length(message) between 2 and 2000),
  vehicle_make text check (vehicle_make is null or char_length(vehicle_make) <= 60),
  vehicle_model text check (vehicle_model is null or char_length(vehicle_model) <= 60),
  vehicle_year smallint check (vehicle_year is null or vehicle_year between 1900 and 2100),
  budget numeric(10, 2) check (budget is null or budget >= 0),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text check (customer_phone is null or char_length(customer_phone) <= 30),
  customer_email text check (customer_email is null or char_length(customer_email) <= 120),
  status public.enquiry_status not null default 'open',
  response text check (response is null or char_length(response) <= 2000),
  quoted_price numeric(10, 2) check (quoted_price is null or quoted_price >= 0),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_user_idx on public.enquiries (user_id, created_at desc);
create index enquiries_shop_idx on public.enquiries (shop_id, status, created_at desc);
create index enquiries_service_idx on public.enquiries (service_id);

-- -----------------------------------------------------------------------------
-- notifications: written only by triggers (security definer)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- -----------------------------------------------------------------------------
-- reports: user reports against reviews or shops, handled by admins
-- -----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  reason text not null check (char_length(reason) between 2 and 200),
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(review_id, shop_id) = 1)
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_review_idx on public.reports (review_id);
create index reports_shop_idx on public.reports (shop_id);
create index reports_reporter_idx on public.reports (reporter_id);
create index reports_resolved_by_idx on public.reports (resolved_by);
