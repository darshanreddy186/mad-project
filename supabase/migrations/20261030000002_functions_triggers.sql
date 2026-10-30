-- =============================================================================
-- AutoMod functions and triggers
--
-- Conventions
--  * Every function pins search_path = '' and schema-qualifies all objects.
--  * "Guard" triggers run as SECURITY INVOKER so that current_user is the API
--    role ('authenticated' / 'anon'). Writes made by trusted roles (postgres,
--    service_role, security-definer functions) and by admins skip the guards.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Authorisation helpers (used by RLS policies)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not is_suspended
  );
$$;

create or replace function public.has_role(p_role public.user_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = p_role and not is_suspended
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and not is_suspended
  );
$$;

create or replace function public.owns_shop(p_shop_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.shops s
    join public.profiles p on p.id = s.owner_id
    where s.id = p_shop_id and s.owner_id = auth.uid() and not p.is_suspended
  );
$$;

-- True when the API caller is a trusted role or an admin; guards are bypassed.
create or replace function public.is_privileged_writer()
returns boolean
language sql stable set search_path = ''
as $$
  select current_user not in ('authenticated', 'anon') or public.is_admin();
$$;

-- Storage helper: object paths in the shop-media bucket start with the shop id.
create or replace function public.can_manage_shop_media(p_object_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_folder text := split_part(p_object_name, '/', 1);
begin
  if public.is_admin() then
    return true;
  end if;
  if v_folder !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;
  return public.owns_shop(v_folder::uuid);
end;
$$;

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger shops_set_updated_at before update on public.shops
  for each row execute function public.set_updated_at();
create trigger shop_services_set_updated_at before update on public.shop_services
  for each row execute function public.set_updated_at();
create trigger shop_portfolio_set_updated_at before update on public.shop_portfolio
  for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger enquiries_set_updated_at before update on public.enquiries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auth -> profiles
-- New users may self-select 'customer' or 'shop_owner'. 'admin' can never be
-- requested through sign-up metadata.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
  v_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    left(coalesce(v_name, split_part(coalesce(new.email, ''), '@', 1)), 120),
    left(nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''), 30),
    case when v_role = 'shop_owner' then 'shop_owner' else 'customer' end::public.user_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Users may edit their own name/phone/avatar/push token; role, suspension and
-- email are controlled elsewhere.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;
  if new.role is distinct from old.role or new.is_suspended is distinct from old.is_suspended then
    raise exception 'You are not allowed to change role or account status'
      using errcode = '42501';
  end if;
  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_guard_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Self-service upgrade from customer to shop owner (shops still need approval).
create or replace function public.become_shop_owner()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  update public.profiles
     set role = 'shop_owner'
   where id = auth.uid() and role = 'customer' and not is_suspended;
end;
$$;

-- -----------------------------------------------------------------------------
-- Shops
-- -----------------------------------------------------------------------------
create or replace function public.set_shop_location()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.location := extensions.st_setsrid(
    extensions.st_makepoint(new.longitude, new.latitude), 4326
  )::extensions.geography;
  return new;
end;
$$;

create trigger shops_set_location
  before insert or update of latitude, longitude on public.shops
  for each row execute function public.set_shop_location();

-- Owners can edit listing details but never moderation/aggregate columns.
-- The only status change an owner may make is resubmitting a rejected shop.
create or replace function public.guard_shop_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      if new.status = 'approved' then
        new.approved_at := coalesce(old.approved_at, now());
        new.rejection_reason := null;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.is_verified := false;
    new.rating := 0;
    new.review_count := 0;
    new.rejection_reason := null;
    new.approved_at := null;
    return new;
  end if;

  new.id := old.id;
  new.owner_id := old.owner_id;
  new.is_verified := old.is_verified;
  new.rating := old.rating;
  new.review_count := old.review_count;
  new.approved_at := old.approved_at;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    if old.status = 'rejected' and new.status = 'pending' then
      new.rejection_reason := null;
    else
      raise exception 'Only an administrator can change the shop status'
        using errcode = '42501';
    end if;
  else
    new.rejection_reason := old.rejection_reason;
  end if;
  return new;
end;
$$;

create trigger shops_guard_write before insert or update on public.shops
  for each row execute function public.guard_shop_write();

-- -----------------------------------------------------------------------------
-- Ratings: shops.rating / review_count are derived from published reviews
-- -----------------------------------------------------------------------------
create or replace function public.refresh_shop_rating(p_shop_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.shops s
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1)
             from public.reviews r
            where r.shop_id = p_shop_id and r.status = 'published'), 0),
         review_count = (
           select count(*)
             from public.reviews r
            where r.shop_id = p_shop_id and r.status = 'published')
   where s.id = p_shop_id;
$$;

create or replace function public.on_review_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_shop_rating(new.shop_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.shop_id <> old.shop_id) then
    perform public.refresh_shop_rating(old.shop_id);
  end if;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

-- Authors can edit rating/comment only; status is admin-moderated.
create or replace function public.guard_review_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.owns_shop(new.shop_id) then
      raise exception 'You cannot review your own shop' using errcode = '42501';
    end if;
    new.status := 'published';
    new.moderation_note := null;
    return new;
  end if;

  new.id := old.id;
  new.shop_id := old.shop_id;
  new.user_id := old.user_id;
  new.status := old.status;
  new.moderation_note := old.moderation_note;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger reviews_guard_write before insert or update on public.reviews
  for each row execute function public.guard_review_write();

-- -----------------------------------------------------------------------------
-- Bookings state machine
--   owner:    pending -> confirmed | rejected
--             confirmed -> in_progress | completed | cancelled
--             in_progress -> completed
--   customer: pending | confirmed -> cancelled
-- Booking details are immutable after creation (except via admin).
-- -----------------------------------------------------------------------------
create or replace function public.guard_booking_write()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_is_owner boolean;
  v_status public.booking_status;
  v_response text;
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.owns_shop(new.shop_id) then
      raise exception 'You cannot book your own shop' using errcode = '42501';
    end if;
    if new.booking_date < current_date then
      raise exception 'Booking date must be today or later' using errcode = '22023';
    end if;
    if new.service_id is not null and not exists (
      select 1 from public.shop_services
       where id = new.service_id and shop_id = new.shop_id and is_active
    ) then
      raise exception 'Selected service is not offered by this shop' using errcode = '22023';
    end if;
    new.status := 'pending';
    new.shop_response := null;
    return new;
  end if;

  v_is_owner := public.owns_shop(old.shop_id);
  v_status := new.status;
  v_response := new.shop_response;
  new := old;

  if v_status is distinct from old.status then
    if v_is_owner then
      if not (
        (old.status = 'pending' and v_status in ('confirmed', 'rejected')) or
        (old.status = 'confirmed' and v_status in ('in_progress', 'completed', 'cancelled')) or
        (old.status = 'in_progress' and v_status = 'completed')
      ) then
        raise exception 'Cannot change booking from % to %', old.status, v_status
          using errcode = '22023';
      end if;
    elsif not (old.status in ('pending', 'confirmed') and v_status = 'cancelled') then
      raise exception 'You can only cancel pending or confirmed bookings'
        using errcode = '42501';
    end if;
    new.status := v_status;
  end if;

  if v_is_owner then
    new.shop_response := v_response;
  end if;
  return new;
end;
$$;

create trigger bookings_guard_write before insert or update on public.bookings
  for each row execute function public.guard_booking_write();

-- -----------------------------------------------------------------------------
-- Enquiries
--   owner:    may respond (response/quoted_price) and close
--   customer: may close their own enquiry
-- -----------------------------------------------------------------------------
create or replace function public.guard_enquiry_write()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_is_owner boolean;
  v_status public.enquiry_status;
  v_response text;
  v_price numeric;
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.owns_shop(new.shop_id) then
      raise exception 'You cannot send an enquiry to your own shop' using errcode = '42501';
    end if;
    if new.service_id is not null and not exists (
      select 1 from public.shop_services where id = new.service_id and shop_id = new.shop_id
    ) then
      raise exception 'Selected service is not offered by this shop' using errcode = '22023';
    end if;
    new.status := 'open';
    new.response := null;
    new.quoted_price := null;
    new.responded_at := null;
    return new;
  end if;

  v_is_owner := public.owns_shop(old.shop_id);
  v_status := new.status;
  v_response := nullif(btrim(new.response), '');
  v_price := new.quoted_price;
  new := old;

  if v_is_owner then
    if v_response is distinct from old.response or v_price is distinct from old.quoted_price then
      if old.status = 'closed' then
        raise exception 'This enquiry is closed' using errcode = '22023';
      end if;
      new.response := v_response;
      new.quoted_price := v_price;
      if v_response is not null then
        new.status := 'responded';
        new.responded_at := now();
      end if;
    end if;
    if v_status = 'closed' then
      new.status := 'closed';
    elsif v_status is distinct from old.status and v_status <> new.status then
      raise exception 'Invalid enquiry status change' using errcode = '22023';
    end if;
  else
    if v_status is distinct from old.status then
      if v_status <> 'closed' then
        raise exception 'You can only close your enquiry' using errcode = '42501';
      end if;
      new.status := 'closed';
    end if;
  end if;
  return new;
end;
$$;

create trigger enquiries_guard_write before insert or update on public.enquiries
  for each row execute function public.guard_enquiry_write();

-- -----------------------------------------------------------------------------
-- Notifications (only notification read state is user-editable)
-- -----------------------------------------------------------------------------
create or replace function public.guard_notification_update()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_read boolean := new.is_read;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  new := old;
  new.is_read := v_read;
  return new;
end;
$$;

create trigger notifications_guard_update before update on public.notifications
  for each row execute function public.guard_notification_update();

create or replace function public.notify_user(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, body, data)
  select p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb)
  where p_user_id is not null;
$$;

create or replace function public.on_booking_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop_name text;
  v_owner uuid;
  v_when text := to_char(new.booking_date, 'FMDD Mon YYYY') || ' at ' || to_char(new.booking_time, 'HH24:MI');
  v_data jsonb := jsonb_build_object('booking_id', new.id, 'shop_id', new.shop_id);
begin
  select name, owner_id into v_shop_name, v_owner from public.shops where id = new.shop_id;

  if tg_op = 'INSERT' then
    perform public.notify_user(v_owner, 'booking', 'New booking request',
      format('%s requested %s on %s.', new.customer_name, new.service_name, v_when), v_data);
    return null;
  end if;

  if new.status is not distinct from old.status then
    return null;
  end if;

  if new.status = 'cancelled' and auth.uid() = new.user_id then
    perform public.notify_user(v_owner, 'booking', 'Booking cancelled',
      format('%s cancelled %s on %s.', new.customer_name, new.service_name, v_when), v_data);
    return null;
  end if;

  perform public.notify_user(new.user_id, 'booking',
    case new.status
      when 'confirmed' then 'Booking confirmed'
      when 'rejected' then 'Booking declined'
      when 'in_progress' then 'Work has started'
      when 'completed' then 'Booking completed'
      when 'cancelled' then 'Booking cancelled'
      else 'Booking updated'
    end,
    case new.status
      when 'confirmed' then format('%s confirmed your %s on %s.', v_shop_name, new.service_name, v_when)
      when 'rejected' then format('%s could not accept your %s booking.', v_shop_name, new.service_name)
      when 'in_progress' then format('%s has started work on your %s.', v_shop_name, new.service_name)
      when 'completed' then format('%s marked your %s as complete. Leave a review!', v_shop_name, new.service_name)
      when 'cancelled' then format('%s cancelled your %s on %s.', v_shop_name, new.service_name, v_when)
      else format('Your booking with %s was updated.', v_shop_name)
    end,
    v_data);
  return null;
end;
$$;

create trigger bookings_notify
  after insert or update of status on public.bookings
  for each row execute function public.on_booking_notify();

create or replace function public.on_enquiry_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop_name text;
  v_owner uuid;
  v_data jsonb := jsonb_build_object('enquiry_id', new.id, 'shop_id', new.shop_id);
begin
  select name, owner_id into v_shop_name, v_owner from public.shops where id = new.shop_id;

  if tg_op = 'INSERT' then
    perform public.notify_user(v_owner, 'enquiry',
      case when new.type = 'quote' then 'New quote request' else 'New enquiry' end,
      format('%s: %s', new.customer_name, new.subject), v_data);
  elsif new.response is distinct from old.response and new.response is not null then
    perform public.notify_user(new.user_id, 'enquiry',
      case when new.type = 'quote' then 'Quote received' else 'Shop replied' end,
      case when new.quoted_price is not null
        then format('%s replied to "%s" with a quote of %s.', v_shop_name, new.subject, to_char(new.quoted_price, 'FM999999990.00'))
        else format('%s replied to "%s".', v_shop_name, new.subject)
      end,
      v_data);
  end if;
  return null;
end;
$$;

create trigger enquiries_notify
  after insert or update of response, quoted_price on public.enquiries
  for each row execute function public.on_enquiry_notify();

create or replace function public.on_review_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.shops where id = new.shop_id;
  perform public.notify_user(v_owner, 'review', 'New review',
    format('Your shop received a %s-star review.', new.rating),
    jsonb_build_object('review_id', new.id, 'shop_id', new.shop_id));
  return null;
end;
$$;

create trigger reviews_notify
  after insert on public.reviews
  for each row execute function public.on_review_notify();

create or replace function public.on_shop_status_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_data jsonb := jsonb_build_object('shop_id', new.id);
begin
  if new.status is not distinct from old.status then
    return null;
  end if;
  if new.status = 'approved' then
    perform public.notify_user(new.owner_id, 'shop', 'Shop approved',
      format('%s is now live and visible to customers.', new.name), v_data);
  elsif new.status = 'rejected' then
    perform public.notify_user(new.owner_id, 'shop', 'Shop registration rejected',
      coalesce('Reason: ' || new.rejection_reason, 'Please review your details and resubmit.'), v_data);
  elsif new.status = 'suspended' then
    perform public.notify_user(new.owner_id, 'shop', 'Shop suspended',
      format('%s has been suspended by an administrator.', new.name), v_data);
  end if;
  return null;
end;
$$;

create trigger shops_status_notify
  after update of status on public.shops
  for each row execute function public.on_shop_status_notify();

-- -----------------------------------------------------------------------------
-- Discovery: nearby / filtered shop search backed by PostGIS
-- SECURITY INVOKER, so shops RLS still applies on top of the explicit filter.
-- -----------------------------------------------------------------------------
create or replace function public.search_shops(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default null,
  p_query text default null,
  p_category_slugs text[] default null,
  p_min_rating numeric default 0,
  p_max_price_level int default 4,
  p_sort text default 'distance',
  p_shop_ids uuid[] default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  description text,
  address text,
  city text,
  postcode text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website text,
  price_level smallint,
  opening_hours jsonb,
  vehicle_brands text[],
  cover_image_url text,
  logo_url text,
  rating numeric,
  review_count int,
  status public.shop_status,
  is_verified boolean,
  created_at timestamptz,
  distance_km double precision,
  category_slugs text[],
  min_price numeric
)
language sql stable set search_path = ''
as $$
  with params as (
    select
      case when p_lat is not null and p_lng is not null
        then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
      end as origin,
      case when nullif(btrim(p_query), '') is not null
        then '%' || replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      end as pattern
  ),
  base as (
    select
      s.*,
      case when pr.origin is not null
        then extensions.st_distance(s.location, pr.origin) / 1000.0
      end as distance_km
    from public.shops s
    cross join params pr
    where s.status = 'approved'
      and (p_shop_ids is null or s.id = any (p_shop_ids))
      and (p_radius_km is null or pr.origin is null
           or extensions.st_dwithin(s.location, pr.origin, p_radius_km * 1000.0))
      and s.rating >= coalesce(p_min_rating, 0)
      and s.price_level <= coalesce(p_max_price_level, 4)
      and (
        pr.pattern is null
        or s.name ilike pr.pattern
        or s.city ilike pr.pattern
        or s.description ilike pr.pattern
        or exists (select 1 from unnest(s.vehicle_brands) b where b ilike pr.pattern)
        or exists (
          select 1 from public.shop_services ss
           where ss.shop_id = s.id and ss.is_active
             and (ss.name ilike pr.pattern or ss.description ilike pr.pattern)
        )
        or exists (
          select 1 from public.shop_services ss
          join public.service_categories c on c.id = ss.category_id
           where ss.shop_id = s.id and ss.is_active and c.name ilike pr.pattern
        )
      )
      and (
        p_category_slugs is null or cardinality(p_category_slugs) = 0
        or exists (
          select 1 from public.shop_services ss
          join public.service_categories c on c.id = ss.category_id
           where ss.shop_id = s.id and ss.is_active and c.slug = any (p_category_slugs)
        )
      )
  )
  select
    b.id, b.owner_id, b.name, b.description, b.address, b.city, b.postcode,
    b.latitude, b.longitude, b.phone, b.email, b.website, b.price_level,
    b.opening_hours, b.vehicle_brands, b.cover_image_url, b.logo_url,
    b.rating, b.review_count, b.status, b.is_verified, b.created_at,
    b.distance_km,
    coalesce((
      select array_agg(distinct c.slug)
        from public.shop_services ss
        join public.service_categories c on c.id = ss.category_id
       where ss.shop_id = b.id and ss.is_active
    ), '{}'::text[]) as category_slugs,
    (select min(ss.price_from) from public.shop_services ss
      where ss.shop_id = b.id and ss.is_active) as min_price
  from base b
  order by
    case when p_sort = 'rating' then b.rating end desc nulls last,
    case when p_sort = 'name' then lower(b.name) end asc,
    case when p_sort = 'price' then b.price_level end asc,
    b.distance_km asc nulls last,
    b.rating desc,
    b.review_count desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Public display names for review authors (profiles themselves are private).
create or replace function public.get_review_authors(p_user_ids uuid[])
returns table (id uuid, full_name text, avatar_url text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.full_name, p.avatar_url
    from public.profiles p
   where p.id = any (p_user_ids)
     and exists (
       select 1 from public.reviews r
        where r.user_id = p.id
          and (r.status = 'published' or r.user_id = auth.uid() or public.is_admin())
     );
$$;

-- -----------------------------------------------------------------------------
-- Admin analytics
-- -----------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', (
      select jsonb_build_object(
        'total', count(*),
        'customers', count(*) filter (where role = 'customer'),
        'shop_owners', count(*) filter (where role = 'shop_owner'),
        'admins', count(*) filter (where role = 'admin'),
        'suspended', count(*) filter (where is_suspended),
        'new_30d', count(*) filter (where created_at > now() - interval '30 days'))
      from public.profiles),
    'shops', (
      select jsonb_build_object(
        'total', count(*),
        'pending', count(*) filter (where status = 'pending'),
        'approved', count(*) filter (where status = 'approved'),
        'rejected', count(*) filter (where status = 'rejected'),
        'suspended', count(*) filter (where status = 'suspended'),
        'verified', count(*) filter (where is_verified))
      from public.shops),
    'bookings', (
      select jsonb_build_object(
        'total', count(*),
        'pending', count(*) filter (where status = 'pending'),
        'confirmed', count(*) filter (where status in ('confirmed', 'in_progress')),
        'completed', count(*) filter (where status = 'completed'),
        'cancelled', count(*) filter (where status in ('cancelled', 'rejected')),
        'last_30d', count(*) filter (where created_at > now() - interval '30 days'))
      from public.bookings),
    'enquiries', (
      select jsonb_build_object(
        'total', count(*),
        'open', count(*) filter (where status = 'open'),
        'quotes', count(*) filter (where type = 'quote'))
      from public.enquiries),
    'reviews', (
      select jsonb_build_object(
        'total', count(*),
        'hidden', count(*) filter (where status = 'hidden'),
        'average', coalesce(round(avg(rating) filter (where status = 'published'), 2), 0))
      from public.reviews),
    'reports', (
      select jsonb_build_object('open', count(*) filter (where status = 'open'), 'total', count(*))
      from public.reports),
    'top_categories', (
      select coalesce(jsonb_agg(t order by t.bookings desc), '[]'::jsonb)
      from (
        select c.name, c.color, count(b.id) as bookings
          from public.service_categories c
          join public.shop_services ss on ss.category_id = c.id
          join public.bookings b on b.service_id = ss.id
         group by c.id, c.name, c.color
         order by count(b.id) desc
         limit 5
      ) t),
    'bookings_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'count', d.cnt) order by d.day), '[]'::jsonb)
      from (
        select gs::date as day,
               (select count(*) from public.bookings b where b.created_at::date = gs::date) as cnt
          from generate_series(current_date - 13, current_date, interval '1 day') gs
      ) d)
  ) into v_result;

  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges
-- Internal helpers must not be callable through the API.
-- -----------------------------------------------------------------------------
revoke execute on function public.refresh_shop_rating(uuid) from public, anon, authenticated;
revoke execute on function public.notify_user(uuid, public.notification_type, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

revoke execute on function public.become_shop_owner() from public, anon;
revoke execute on function public.admin_stats() from public, anon;

grant execute on function public.search_shops(double precision, double precision, double precision, text, text[], numeric, int, text, uuid[], int, int) to anon, authenticated;
grant execute on function public.get_review_authors(uuid[]) to anon, authenticated;
grant execute on function public.become_shop_owner() to authenticated;
grant execute on function public.admin_stats() to authenticated;
