-- =============================================================================
-- Booking slot availability
-- One active booking per shop per start time. Customers cannot read other
-- customers' bookings (RLS), so taken times are exposed through a narrow
-- function that returns times only, never booking details.
-- =============================================================================

create unique index bookings_active_slot_idx
  on public.bookings (shop_id, booking_date, booking_time)
  where status in ('pending', 'confirmed', 'in_progress');

create or replace function public.booked_slots(p_shop_id uuid, p_date date)
returns setof time
language sql stable security definer set search_path = ''
as $$
  select b.booking_time
    from public.bookings b
    join public.shops s on s.id = b.shop_id
   where b.shop_id = p_shop_id
     and b.booking_date = p_date
     and b.status in ('pending', 'confirmed', 'in_progress')
     and (s.status = 'approved' or s.owner_id = auth.uid() or public.is_admin())
   order by b.booking_time;
$$;

revoke execute on function public.booked_slots(uuid, date) from public, anon;
grant execute on function public.booked_slots(uuid, date) to authenticated;
