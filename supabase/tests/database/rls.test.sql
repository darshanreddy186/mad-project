-- =============================================================================
-- Security and behaviour tests for the AutoMod schema.
-- Run with:  npx supabase test db
--
-- Each block switches to the API role (anon / authenticated) with a JWT
-- subject, exactly as PostgREST does, so RLS policies and guard triggers are
-- exercised for real. Everything runs in one transaction and is rolled back.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(79);

-- -----------------------------------------------------------------------------
-- Fixtures (as postgres)
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000aa', 'admin@test.dev',     '{"full_name":"Ada Admin","role":"admin"}'),
  ('00000000-0000-0000-0000-000000000001', 'owner1@test.dev',    '{"full_name":"Olly Owner","role":"shop_owner"}'),
  ('00000000-0000-0000-0000-000000000002', 'owner2@test.dev',    '{"full_name":"Orla Owner","role":"shop_owner"}'),
  ('00000000-0000-0000-0000-000000000003', 'cust1@test.dev',     '{"full_name":"Cara Customer"}'),
  ('00000000-0000-0000-0000-000000000004', 'cust2@test.dev',     '{"full_name":"Cody Customer"}'),
  ('00000000-0000-0000-0000-000000000005', 'suspended@test.dev', '{"full_name":"Sam Suspended"}');

select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000aa'),
  'customer',
  'sign-up metadata cannot grant the admin role'
);
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  'shop_owner',
  'sign-up metadata can request the shop_owner role'
);
select is(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-000000000003'),
  'Cara Customer',
  'profile is created from auth metadata'
);

-- Promote the admin and suspend one user as a trusted role.
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000aa';
update public.profiles set is_suspended = true where id = '00000000-0000-0000-0000-000000000005';

-- -----------------------------------------------------------------------------
-- Profiles
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000003' $$,
  '42501', null,
  'customer cannot escalate their own role'
);
select lives_ok(
  $$ update public.profiles set full_name = 'Cara C.', phone = '+44 7000 000000' where id = '00000000-0000-0000-0000-000000000003' $$,
  'customer can update their own name and phone'
);
select is(
  (select count(*)::int from public.profiles),
  1,
  'customer can only read their own profile'
);
select is_empty(
  $$ update public.profiles set full_name = 'hacked' where id = '00000000-0000-0000-0000-000000000004' returning id $$,
  'customer cannot update another profile'
);
select throws_ok(
  $$ select public.admin_stats() $$,
  '42501', null,
  'customer cannot read admin analytics'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}';
select is(
  (select count(*)::int from public.profiles),
  6,
  'admin can read every profile'
);
select ok(
  (public.admin_stats() -> 'users' ->> 'total')::int = 6,
  'admin can read platform analytics'
);

-- -----------------------------------------------------------------------------
-- Shops
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok(
  $$ insert into public.shops (owner_id, name, address, city, latitude, longitude, phone)
     values ('00000000-0000-0000-0000-000000000003', 'Not a shop owner', '1 Road', 'Leeds', 53.8, -1.55, '0113 555 0000') $$,
  '42501', null,
  'customers cannot register a shop'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok(
  $$ insert into public.shops (id, owner_id, name, address, city, latitude, longitude, phone, status, is_verified, rating)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
             'Apex Performance', '4 Riverside', 'Manchester', 53.4808, -2.2426, '0161 555 0142',
             'approved', true, 5) $$,
  'shop owner can register a shop'
);
select results_eq(
  $$ select status::text, is_verified, rating::numeric from public.shops where id = '10000000-0000-0000-0000-000000000001' $$,
  $$ values ('pending'::text, false, 0::numeric) $$,
  'new shops are forced to pending, unverified and unrated'
);
select ok(
  (select location is not null from public.shops where id = '10000000-0000-0000-0000-000000000001'),
  'shop geography point is derived from latitude/longitude'
);
select throws_ok(
  $$ insert into public.shops (owner_id, name, address, city, latitude, longitude, phone)
     values ('00000000-0000-0000-0000-000000000001', 'Second shop', '5 Riverside', 'Manchester', 53.48, -2.24, '0161 555 0143') $$,
  '23505', null,
  'an owner can only register one shop'
);
select throws_ok(
  $$ update public.shops set status = 'approved' where id = '10000000-0000-0000-0000-000000000001' $$,
  '42501', null,
  'owner cannot approve their own shop'
);
select lives_ok(
  $$ insert into public.shop_services (shop_id, category_id, name, price_from, price_to)
     select '10000000-0000-0000-0000-000000000001', id, 'Stage 1 ECU Remap', 350, 450
       from public.service_categories where slug = 'performance-tuning' $$,
  'owner can add services to their shop'
);
select ok(
  public.can_manage_shop_media('10000000-0000-0000-0000-000000000001/gallery/photo.jpg'),
  'owner can manage media in their shop folder'
);
select ok(
  not public.can_manage_shop_media('../etc/passwd'),
  'malformed storage paths are rejected'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is_empty(
  $$ select id from public.shops where id = '10000000-0000-0000-0000-000000000001' $$,
  'pending shops are hidden from the public'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
select lives_ok(
  $$ insert into public.shops (id, owner_id, name, address, city, latitude, longitude, phone)
     values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
             'Velocity Customs', '12 Carr Lane', 'Leeds', 53.8008, -1.5491, '0113 555 0198') $$,
  'second owner can register their own shop'
);
select is_empty(
  $$ update public.shops set name = 'hijacked' where id = '10000000-0000-0000-0000-000000000001' returning id $$,
  'owner cannot edit another owner''s shop'
);
select throws_ok(
  $$ insert into public.shop_services (shop_id, name, price_from)
     values ('10000000-0000-0000-0000-000000000001', 'Rogue service', 1) $$,
  '42501', null,
  'owner cannot add services to another shop'
);
select ok(
  not public.can_manage_shop_media('10000000-0000-0000-0000-000000000001/gallery/photo.jpg'),
  'owner cannot manage another shop''s media'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('shop-media', '10000000-0000-0000-0000-000000000001/gallery/x.jpg') $$,
  '42501', null,
  'storage RLS blocks uploads into another shop''s folder'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}';
select lives_ok(
  $$ update public.shops set status = 'approved', is_verified = true
      where id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002') $$,
  'admin can approve and verify shops'
);
select ok(
  (select approved_at is not null from public.shops where id = '10000000-0000-0000-0000-000000000001'),
  'approval timestamp is recorded'
);

reset role;
select is(
  (select count(*)::int from public.notifications
    where user_id = '00000000-0000-0000-0000-000000000001' and type = 'shop'),
  1,
  'owner is notified when their shop is approved'
);

-- -----------------------------------------------------------------------------
-- Discovery
-- -----------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is(
  (select count(*)::int from public.shops),
  2,
  'approved shops are public'
);
select is(
  (select name from public.search_shops(p_lat => 53.4794, p_lng => -2.2453, p_sort => 'distance') limit 1),
  'Apex Performance',
  'search_shops orders by distance from the user'
);
select ok(
  (select distance_km < 1 from public.search_shops(p_lat => 53.4794, p_lng => -2.2453) where name = 'Apex Performance'),
  'search_shops returns distance in kilometres'
);
select is(
  (select count(*)::int from public.search_shops(p_lat => 53.4794, p_lng => -2.2453, p_radius_km => 10)),
  1,
  'radius filter excludes far-away shops'
);
select is(
  (select count(*)::int from public.search_shops(p_query => 'remap')),
  1,
  'search matches service names'
);
select is(
  (select count(*)::int from public.search_shops(p_category_slugs => array['performance-tuning'])),
  1,
  'category filter uses the services a shop offers'
);
select is(
  (select count(*)::int from public.search_shops(p_query => '100%_')),
  0,
  'search input is escaped for LIKE wildcards'
);
select throws_ok(
  $$ insert into public.favorites (user_id, shop_id) values ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001') $$,
  '42501', null,
  'anonymous users cannot write data'
);

-- -----------------------------------------------------------------------------
-- Bookings
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
select lives_ok(
  format($$ insert into public.bookings (id, shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone, status)
     values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
             'Stage 1 ECU Remap', %L, '10:00', 'Cara Customer', '+44 7000 000000', 'confirmed') $$, current_date + 7),
  'customer can request a booking'
);
select is(
  (select status::text from public.bookings where id = '20000000-0000-0000-0000-000000000001'),
  'pending',
  'new bookings are always pending'
);
select throws_ok(
  format($$ insert into public.bookings (shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
             'Stage 1 ECU Remap', %L, '10:00', 'Cara Customer', '+44 7000 000000') $$, current_date - 1),
  '22023', null,
  'bookings cannot be made in the past'
);
select throws_ok(
  format($$ insert into public.bookings (shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
             'Spoofed', %L, '10:00', 'Someone Else', '+44 7000 000001') $$, current_date + 1),
  '42501', null,
  'customer cannot create a booking for another user'
);
select throws_ok(
  $$ update public.bookings set status = 'confirmed' where id = '20000000-0000-0000-0000-000000000001' $$,
  '42501', null,
  'customer cannot confirm their own booking'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is_empty(
  $$ select id from public.bookings $$,
  'customers cannot see other customers'' bookings'
);
select is(
  (select array_agg(t)::text from public.booked_slots('10000000-0000-0000-0000-000000000001', current_date + 7) t),
  '{10:00:00}',
  'other customers can see which times are taken (times only)'
);
select throws_ok(
  format($$ insert into public.bookings (shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
             'Stage 1 ECU Remap', %L, '10:00', 'Cody Customer', '+44 7000 000004') $$, current_date + 7),
  '23505', null,
  'a time slot cannot be double-booked'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is_empty(
  $$ select id from public.bookings $$,
  'other shop owners cannot see the booking'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(
  (select count(*)::int from public.notifications where type = 'booking'),
  1,
  'shop owner is notified of the new booking'
);
select lives_ok(
  $$ update public.bookings set status = 'confirmed', shop_response = 'See you then', booking_date = '2000-01-01'
      where id = '20000000-0000-0000-0000-000000000001' $$,
  'shop owner can confirm a booking'
);
select results_eq(
  $$ select status::text, shop_response, booking_date > current_date from public.bookings where id = '20000000-0000-0000-0000-000000000001' $$,
  $$ values ('confirmed'::text, 'See you then'::text, true) $$,
  'owner can set status/response but not alter booking details'
);
select throws_ok(
  $$ update public.bookings set status = 'pending' where id = '20000000-0000-0000-0000-000000000001' $$,
  '22023', null,
  'invalid booking transitions are rejected'
);
select throws_ok(
  format($$ insert into public.bookings (shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
             'Self booking', %L, '10:00', 'Olly Owner', '+44 7000 000002') $$, current_date + 1),
  '42501', null,
  'owners cannot book their own shop'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is(
  (select count(*)::int from public.notifications where type = 'booking' and title = 'Booking confirmed'),
  1,
  'customer is notified when the booking is confirmed'
);
select lives_ok(
  $$ update public.bookings set status = 'cancelled' where id = '20000000-0000-0000-0000-000000000001' $$,
  'customer can cancel a confirmed booking'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}';
select lives_ok(
  format($$ insert into public.bookings (shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004',
             'Stage 1 ECU Remap', %L, '10:00', 'Cody Customer', '+44 7000 000004') $$, current_date + 7),
  'a cancelled slot becomes available again'
);
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.booked_slots('10000000-0000-0000-0000-000000000001', current_date + 7) $$,
  '42501', null,
  'anonymous users cannot query booked slots'
);
set local role authenticated;

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok(
  format($$ insert into public.bookings (shop_id, user_id, service_name, booking_date, booking_time, customer_name, customer_phone)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005',
             'Stage 1 ECU Remap', %L, '10:00', 'Sam Suspended', '+44 7000 000003') $$, current_date + 1),
  '42501', null,
  'suspended users cannot create bookings'
);

-- -----------------------------------------------------------------------------
-- Reviews and ratings
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
select lives_ok(
  $$ insert into public.reviews (id, shop_id, user_id, rating, comment, status)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
             '00000000-0000-0000-0000-000000000003', 4, 'Great remap', 'hidden') $$,
  'customer can review a shop'
);
select results_eq(
  $$ select rating::numeric, review_count from public.shops where id = '10000000-0000-0000-0000-000000000001' $$,
  $$ values (4.0::numeric, 1) $$,
  'shop rating is recalculated from reviews'
);
select throws_ok(
  $$ insert into public.reviews (shop_id, user_id, rating) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 5) $$,
  '23505', null,
  'one review per customer per shop'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}';
select lives_ok(
  $$ insert into public.reviews (shop_id, user_id, rating, comment)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 2, 'Slow') $$,
  'second customer can review'
);
select is(
  (select rating::numeric from public.shops where id = '10000000-0000-0000-0000-000000000001'),
  3.0::numeric,
  'rating is the average of published reviews'
);
select lives_ok(
  $$ insert into public.reports (reporter_id, review_id, reason)
     values ('00000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'Fake review') $$,
  'customer can report a review'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $$ insert into public.reviews (shop_id, user_id, rating) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 5) $$,
  '42501', null,
  'owners cannot review their own shop'
);
select is_empty(
  $$ select id from public.reports $$,
  'reports are private to the reporter and admins'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}';
select lives_ok(
  $$ update public.reviews set status = 'hidden', moderation_note = 'Spam' where id = '30000000-0000-0000-0000-000000000001' $$,
  'admin can hide a review'
);
select results_eq(
  $$ select rating::numeric, review_count from public.shops where id = '10000000-0000-0000-0000-000000000001' $$,
  $$ values (2.0::numeric, 1) $$,
  'hidden reviews no longer count towards the rating'
);
select is(
  (select count(*)::int from public.reports where status = 'open'),
  1,
  'admin can see open reports'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is_empty(
  $$ select id from public.reviews where id = '30000000-0000-0000-0000-000000000001' $$,
  'hidden reviews are not public'
);

-- -----------------------------------------------------------------------------
-- Enquiries and quotations
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
select lives_ok(
  $$ insert into public.enquiries (id, shop_id, user_id, type, subject, message, customer_name, quoted_price)
     values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
             '00000000-0000-0000-0000-000000000003', 'quote', 'Stage 2 price?', 'How much for a stage 2 on a Golf R?',
             'Cara Customer', 1) $$,
  'customer can request a quotation'
);
select is(
  (select quoted_price from public.enquiries where id = '40000000-0000-0000-0000-000000000001'),
  null::numeric,
  'customers cannot set the quoted price'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok(
  $$ update public.enquiries set response = 'Around 1500 including mapping', quoted_price = 1500
      where id = '40000000-0000-0000-0000-000000000001' $$,
  'shop owner can respond with a quote'
);
select results_eq(
  $$ select status::text, quoted_price from public.enquiries where id = '40000000-0000-0000-0000-000000000001' $$,
  $$ values ('responded'::text, 1500::numeric) $$,
  'responding marks the enquiry as responded'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is_empty(
  $$ select id from public.enquiries $$,
  'enquiries are private to the participants'
);

-- -----------------------------------------------------------------------------
-- Notifications, favourites, categories
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
select lives_ok(
  $$ update public.notifications set is_read = true, title = 'tampered' $$,
  'user can mark their notifications as read'
);
select is(
  (select count(*)::int from public.notifications where title = 'tampered'),
  0,
  'notification content cannot be modified'
);
select lives_ok(
  $$ insert into public.favorites (user_id, shop_id) values ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001') $$,
  'customer can save a favourite'
);
select throws_ok(
  $$ insert into public.service_categories (name, slug) values ('Rogue', 'rogue') $$,
  '42501', null,
  'only admins can manage categories'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is_empty(
  $$ select shop_id from public.favorites $$,
  'favourites are private'
);
select lives_ok(
  $$ select public.become_shop_owner() $$,
  'customer can upgrade to a shop owner account'
);
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-000000000004'),
  'shop_owner',
  'upgrade sets the shop_owner role'
);

select * from finish();
rollback;
