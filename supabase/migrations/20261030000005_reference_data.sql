-- =============================================================================
-- Reference data: modification categories (admins can edit these in-app)
-- =============================================================================

insert into public.service_categories (name, slug, description, icon_name, color, sort_order)
values
  ('Performance Tuning', 'performance-tuning',
    'ECU remapping, turbo upgrades, exhaust systems and dyno tuning', 'Gauge', '#ff7d12', 10),
  ('Body Kits & Aero', 'body-kits-aero',
    'Body kits, spoilers, diffusers, splitters and widebody conversions', 'Car', '#326bff', 20),
  ('Wheels & Tyres', 'wheels-tyres',
    'Alloy wheels, forged rims, performance tyres and alignment', 'CircleDot', '#10b981', 30),
  ('Suspension & Handling', 'suspension-handling',
    'Coilovers, lowering springs, sway bars and bushings', 'ChevronsUpDown', '#f59e0b', 40),
  ('Interior & Audio', 'interior-audio',
    'Upholstery, infotainment, sound systems and custom interiors', 'Volume2', '#ec4899', 50),
  ('Paint & Wrapping', 'paint-wrapping',
    'Resprays, vinyl wraps, PPF, ceramic coating and detailing', 'Palette', '#8b5cf6', 60),
  ('Lighting & Electrical', 'lighting-electrical',
    'LED conversions, HID kits, wiring and custom lighting', 'Lightbulb', '#06b6d4', 70),
  ('Brakes & Safety', 'brakes-safety',
    'Big brake kits, braided lines, race pads and safety upgrades', 'ShieldCheck', '#ef4444', 80)
on conflict (slug) do nothing;
