-- =============================================================================
-- Storage buckets and policies
--
--  avatars     public read, path: {user_id}/{file}
--  shop-media  public read, path: {shop_id}/{gallery|portfolio|branding}/{file}
--
-- Buckets are public so images load through CDN URLs without signed URLs.
-- Public buckets serve files without consulting RLS, so no broad SELECT policy
-- is created (that would let anyone list every object). The scoped SELECT
-- policies below exist because Storage needs them for delete/overwrite.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('shop-media', 'shop-media', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- avatars ---------------------------------------------------------------------
create policy "avatars: owner can view own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

create policy "avatars: owner can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

create policy "avatars: owner can update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

create policy "avatars: owner can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

-- shop-media ------------------------------------------------------------------
create policy "shop-media: shop owner can view own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'shop-media' and public.can_manage_shop_media(name));

create policy "shop-media: shop owner can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-media' and public.can_manage_shop_media(name));

create policy "shop-media: shop owner can update"
  on storage.objects for update to authenticated
  using (bucket_id = 'shop-media' and public.can_manage_shop_media(name))
  with check (bucket_id = 'shop-media' and public.can_manage_shop_media(name));

create policy "shop-media: shop owner or admin can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'shop-media' and public.can_manage_shop_media(name));
