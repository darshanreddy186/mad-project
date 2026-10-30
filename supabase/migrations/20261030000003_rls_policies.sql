-- =============================================================================
-- Row Level Security
-- Every table has RLS enabled. auth.uid() and helper calls that do not depend
-- on the row are wrapped in (select ...) so Postgres evaluates them once per
-- statement instead of once per row.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.shops enable row level security;
alter table public.shop_services enable row level security;
alter table public.shop_images enable row level security;
alter table public.shop_portfolio enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.bookings enable row level security;
alter table public.enquiries enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- -----------------------------------------------------------------------------
-- profiles: private to the owner and admins. Inserted by the auth trigger.
-- -----------------------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own or admin"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- service_categories: public catalogue, admin managed
-- -----------------------------------------------------------------------------
create policy "categories: read active"
  on public.service_categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "categories: admin insert"
  on public.service_categories for insert to authenticated
  with check ((select public.is_admin()));

create policy "categories: admin update"
  on public.service_categories for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "categories: admin delete"
  on public.service_categories for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- shops: approved shops are public; owners see their own; admins see all
-- -----------------------------------------------------------------------------
create policy "shops: read approved, own or admin"
  on public.shops for select to anon, authenticated
  using (
    status = 'approved'
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "shops: owners register their shop"
  on public.shops for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select public.has_role('shop_owner'))
  );

create policy "shops: owner or admin update"
  on public.shops for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "shops: admin delete"
  on public.shops for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Shop child tables. Read access follows shop visibility (the sub-select is
-- itself filtered by the shops policy). Writes require owning the shop.
-- -----------------------------------------------------------------------------
create policy "shop_services: read when shop visible"
  on public.shop_services for select to anon, authenticated
  using (
    exists (select 1 from public.shops s where s.id = shop_id)
    and (is_active or public.owns_shop(shop_id) or (select public.is_admin()))
  );

create policy "shop_services: owner insert"
  on public.shop_services for insert to authenticated
  with check (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_services: owner update"
  on public.shop_services for update to authenticated
  using (public.owns_shop(shop_id) or (select public.is_admin()))
  with check (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_services: owner delete"
  on public.shop_services for delete to authenticated
  using (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_images: read when shop visible"
  on public.shop_images for select to anon, authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id));

create policy "shop_images: owner insert"
  on public.shop_images for insert to authenticated
  with check (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_images: owner update"
  on public.shop_images for update to authenticated
  using (public.owns_shop(shop_id) or (select public.is_admin()))
  with check (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_images: owner delete"
  on public.shop_images for delete to authenticated
  using (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_portfolio: read when shop visible"
  on public.shop_portfolio for select to anon, authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id));

create policy "shop_portfolio: owner insert"
  on public.shop_portfolio for insert to authenticated
  with check (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_portfolio: owner update"
  on public.shop_portfolio for update to authenticated
  using (public.owns_shop(shop_id) or (select public.is_admin()))
  with check (public.owns_shop(shop_id) or (select public.is_admin()));

create policy "shop_portfolio: owner delete"
  on public.shop_portfolio for delete to authenticated
  using (public.owns_shop(shop_id) or (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
create policy "reviews: read published, own or admin"
  on public.reviews for select to anon, authenticated
  using (
    (status = 'published' and exists (select 1 from public.shops s where s.id = shop_id))
    or user_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "reviews: customers create"
  on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (select 1 from public.shops s where s.id = shop_id and s.status = 'approved')
  );

create policy "reviews: author or admin update"
  on public.reviews for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "reviews: author or admin delete"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- favorites: strictly private
-- -----------------------------------------------------------------------------
create policy "favorites: read own"
  on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));

create policy "favorites: add own"
  on public.favorites for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.shops s where s.id = shop_id)
  );

create policy "favorites: remove own"
  on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- bookings: customer, shop owner and admins. Transitions enforced by trigger.
-- -----------------------------------------------------------------------------
create policy "bookings: read own, shop owner or admin"
  on public.bookings for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_shop(shop_id)
    or (select public.is_admin())
  );

create policy "bookings: customers create"
  on public.bookings for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (select 1 from public.shops s where s.id = shop_id and s.status = 'approved')
  );

create policy "bookings: participants update"
  on public.bookings for update to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_shop(shop_id)
    or (select public.is_admin())
  )
  with check (
    user_id = (select auth.uid())
    or public.owns_shop(shop_id)
    or (select public.is_admin())
  );

create policy "bookings: admin delete"
  on public.bookings for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- enquiries: same participants model as bookings
-- -----------------------------------------------------------------------------
create policy "enquiries: read own, shop owner or admin"
  on public.enquiries for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_shop(shop_id)
    or (select public.is_admin())
  );

create policy "enquiries: customers create"
  on public.enquiries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (select 1 from public.shops s where s.id = shop_id and s.status = 'approved')
  );

create policy "enquiries: participants update"
  on public.enquiries for update to authenticated
  using (
    user_id = (select auth.uid())
    or public.owns_shop(shop_id)
    or (select public.is_admin())
  )
  with check (
    user_id = (select auth.uid())
    or public.owns_shop(shop_id)
    or (select public.is_admin())
  );

create policy "enquiries: admin delete"
  on public.enquiries for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- notifications: recipients only; rows are created by triggers
-- -----------------------------------------------------------------------------
create policy "notifications: read own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: mark own read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications: delete own"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- reports: anyone signed in can report; only admins triage
-- -----------------------------------------------------------------------------
create policy "reports: create own"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (select public.is_active_user())
    and status = 'open'
    and resolved_by is null
  );

create policy "reports: read own or admin"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

create policy "reports: admin update"
  on public.reports for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "reports: admin delete"
  on public.reports for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Table privileges: anon only ever reads the public catalogue.
-- -----------------------------------------------------------------------------
revoke insert, update, delete on all tables in schema public from anon;
revoke select on public.profiles, public.favorites, public.bookings, public.enquiries,
  public.notifications, public.reports from anon;

-- -----------------------------------------------------------------------------
-- Realtime: live notification and booking updates
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications, public.bookings, public.enquiries;
  end if;
end;
$$;
