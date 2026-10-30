#!/usr/bin/env node
/**
 * Seeds a Supabase project with demo users, shops, services, portfolio items
 * and reviews (the data that used to live in data/mockData.ts).
 *
 * Runs on a developer machine only. It needs the SERVICE ROLE key, which must
 * never be shipped in the mobile app or committed to git.
 *
 *   SUPABASE_URL=https://xyz.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SEED_PASSWORD='ChooseAStrongPassword1' \
 *   npm run db:seed
 *
 * Safe to re-run: users are reused, shops are upserted by owner, and each
 * shop's services/portfolio/gallery are replaced.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;

if (!url || !serviceKey || !password) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SEED_PASSWORD to run the seed.');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const img = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
const week = (open, close, sat = ['', ''], sun = ['', '']) =>
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
    const [o, c] = day === 'Sat' ? sat : day === 'Sun' ? sun : [open, close];
    return { day, open: o, close: c, closed: !o };
  });

const USERS = [
  { key: 'admin', email: 'admin@automod.dev', full_name: 'AutoMod Admin', role: 'customer', makeAdmin: true },
  { key: 'james', email: 'james@automod.dev', full_name: 'James Carter', role: 'customer' },
  { key: 'sophie', email: 'sophie@automod.dev', full_name: 'Sophie Turner', role: 'customer' },
  { key: 'daniel', email: 'daniel@automod.dev', full_name: 'Daniel Hughes', role: 'customer' },
  { key: 'emma', email: 'emma@automod.dev', full_name: 'Emma Roberts', role: 'customer' },
  { key: 'michael', email: 'michael@automod.dev', full_name: 'Michael Clarke', role: 'customer' },
  { key: 'owner1', email: 'apex@automod.dev', full_name: 'Alex Morgan', role: 'shop_owner' },
  { key: 'owner2', email: 'velocity@automod.dev', full_name: 'Priya Shah', role: 'shop_owner' },
  { key: 'owner3', email: 'rpm@automod.dev', full_name: 'Tom Walsh', role: 'shop_owner' },
  { key: 'owner4', email: 'carbon@automod.dev', full_name: 'Nina Patel', role: 'shop_owner' },
  { key: 'owner5', email: 'streetworx@automod.dev', full_name: 'Liam Byrne', role: 'shop_owner' },
  { key: 'owner6', email: 'dynotech@automod.dev', full_name: 'Grace Lee', role: 'shop_owner' },
];

const SHOPS = [
  {
    owner: 'owner1', name: 'Apex Performance Garage', city: 'Manchester', address: 'Unit 4, Riverside Industrial Estate', postcode: 'M4 6BF',
    latitude: 53.4808, longitude: -2.2426, phone: '+44 161 555 0142', email: 'info@apexperformance.co.uk', website: 'https://www.apexperformance.co.uk',
    price_level: 3, is_verified: true, cover: img(3806288),
    description: 'Award-winning performance tuning specialists with over 15 years of experience. We handle everything from basic ECU remaps to full turbo conversions and custom exhaust fabrication.',
    brands: ['BMW', 'Audi', 'Volkswagen', 'Mercedes', 'Subaru'], hours: week('08:00', '18:00', ['09:00', '14:00']),
    services: [
      ['performance-tuning', 'Stage 1 ECU Remap', 'Custom dyno-tuned ECU remap for increased power and torque', 350, 450, 'per vehicle', 180],
      ['performance-tuning', 'Stage 2 Turbo Upgrade', 'Hybrid turbo fitting with full pipe work and mapping', 1200, 2500, 'per vehicle', 960],
      ['suspension-handling', 'Coilover Fitting', 'Supply and fit adjustable coilovers, including alignment', 500, 1200, 'per vehicle', 300],
      ['brakes-safety', 'Big Brake Kit Install', '6-pot front calipers with two-piece discs and braided lines', 1400, 2800, 'per axle', 360],
    ],
    portfolio: [['performance-tuning', 'BMW M340i Stage 2 Build', 'Full turbo upgrade, custom exhaust and dyno tune — 480bhp', 'BMW', 'M340i', 2021, img(170811), img(3806288)]],
  },
  {
    owner: 'owner2', name: 'Velocity Customs', city: 'Leeds', address: '12 Carr Lane', postcode: 'LS1 4AP',
    latitude: 53.8008, longitude: -1.5491, phone: '+44 113 555 0198', email: 'hello@velocitycustoms.uk', website: 'https://www.velocitycustoms.uk',
    price_level: 4, is_verified: true, cover: img(3806249),
    description: 'Premier bodywork and styling shop. Widebody kits, carbon fibre aero, custom paint and full restorations. Featured in Performance Car Magazine.',
    brands: ['Nissan', 'Honda', 'Toyota', 'Mazda', 'Mitsubishi'], hours: week('09:00', '17:30', ['10:00', '16:00']),
    services: [
      ['body-kits-aero', 'Full Widebody Kit', 'Supply, fit and paint a complete widebody conversion', 2000, 5000, 'per vehicle', null],
      ['paint-wrapping', 'Full Vehicle Respray', 'Strip down and respray in any colour, including engine bay', 1500, 4000, 'per vehicle', null],
      ['lighting-electrical', 'Custom LED Lighting', 'Sequential indicators, DRL upgrades and underglow', 250, 900, 'per vehicle', 240],
    ],
    portfolio: [['body-kits-aero', 'Nissan 350Z Widebody', 'Rocket Bunny widebody kit, respray and full aero package', 'Nissan', '350Z', 2007, img(159238), img(3806249)]],
  },
  {
    owner: 'owner3', name: 'RPM AutoWorks', city: 'Birmingham', address: '78 Stanley Road', postcode: 'B12 9PL',
    latitude: 52.4862, longitude: -1.8904, phone: '+44 121 555 0177', email: 'service@rpmautoworks.co.uk', website: null,
    price_level: 2, is_verified: true, cover: img(4489702),
    description: 'Family-run garage specialising in suspension, wheels and alignment. State-of-the-art Hunter alignment rig and tyre fitting for all performance vehicles.',
    brands: ['Ford', 'Vauxhall', 'Honda', 'Peugeot', 'Renault'], hours: week('08:30', '17:30', ['08:30', '12:30']),
    services: [
      ['wheels-tyres', 'Wheel Fitment Package', 'Supply and fit a set of alloy wheels with tyres', 600, 2000, 'per set', 120],
      ['wheels-tyres', '4-Wheel Laser Alignment', 'Hunter Hawkeye alignment with printed report', 70, null, 'per vehicle', 60],
      ['suspension-handling', 'Lowering Springs', 'Supply and fit lowering springs with alignment', 300, 550, 'per vehicle', 180],
    ],
    portfolio: [],
  },
  {
    owner: 'owner4', name: 'Carbon Studio UK', city: 'London', address: '5 Newham Road', postcode: 'E16 2QA',
    latitude: 51.5074, longitude: -0.1278, phone: '+44 207 555 0134', email: 'info@carbonstudiouk.com', website: 'https://www.carbonstudiouk.com',
    price_level: 4, is_verified: true, cover: img(3786091),
    description: 'High-end interior and audio specialists. Custom leather retrim, premium sound system installs, infotainment upgrades and ambient lighting.',
    brands: ['Porsche', 'Mercedes', 'BMW', 'Range Rover', 'Bentley'], hours: week('10:00', '19:00', ['11:00', '17:00']),
    services: [
      ['interior-audio', 'Premium Audio Install', 'Full sound system upgrade with amp, speakers and subwoofer', 800, 3500, 'per vehicle', 480],
      ['interior-audio', 'Leather Retrim', 'Full interior retrim in Nappa leather or Alcantara', 2500, 7000, 'per vehicle', null],
      ['paint-wrapping', 'Paint Protection Film', 'Full-front PPF with self-healing film', 1200, 2200, 'per vehicle', 480],
    ],
    portfolio: [['interior-audio', 'Mercedes C63 Interior', 'Full diamond-stitched leather retrim with Alcantara headliner', 'Mercedes', 'C63 AMG', 2019, img(210019), img(3786091)]],
  },
  {
    owner: 'owner5', name: 'Streetworx Garage', city: 'Liverpool', address: '23 Dock Road', postcode: 'L3 4BE',
    latitude: 53.4084, longitude: -2.9916, phone: '+44 151 555 0166', email: 'team@streetworx.co.uk', website: null,
    price_level: 2, is_verified: false, cover: img(2096523),
    description: 'Your one-stop street modification shop. Wraps, decals, coilovers, wheels and more. Friendly service and competitive prices for car enthusiasts.',
    brands: ['Volkswagen', 'Audi', 'Ford', 'BMW', 'Skoda'], hours: week('09:00', '18:00', ['09:00', '15:00']),
    services: [
      ['paint-wrapping', 'Vinyl Wrap', 'Full vehicle colour change vinyl wrap', 900, 1800, 'per vehicle', null],
      ['wheels-tyres', 'Wheel Refurbishment', 'Diamond cut or powder coat refurbishment', 60, 120, 'per wheel', 240],
      ['body-kits-aero', 'Splitter & Diffuser Fit', 'Supply and fit aero styling parts', 250, 700, 'per vehicle', 180],
    ],
    portfolio: [['paint-wrapping', 'VW Golf R Satin Wrap', 'Full satin black vinyl wrap with gloss black accents', 'Volkswagen', 'Golf R', 2020, img(159238), img(2096523)]],
  },
  {
    owner: 'owner6', name: 'DynoTech Racing', city: 'Bristol', address: '100 Industrial Way', postcode: 'BS2 0QX',
    latitude: 51.4545, longitude: -2.5879, phone: '+44 117 555 0189', email: 'racing@dynotechracing.uk', website: 'https://www.dynotechracing.uk',
    price_level: 4, is_verified: true, cover: img(2533092),
    description: 'Professional motorsport preparation and dyno tuning. Rally, track and drag builds. Approved MoTeC dealer with full data logging services.',
    brands: ['Subaru', 'Mitsubishi', 'Nissan', 'Honda', 'Porsche'], hours: week('08:00', '17:30'),
    services: [
      ['performance-tuning', 'Dyno Tuning Session', 'Full dyno run with custom map for maximum performance', 400, 800, 'per session', 240],
      ['brakes-safety', 'Track Day Prep', 'Brake fluid, pads, safety inspection and alignment', 350, 650, 'per vehicle', 300],
    ],
    portfolio: [],
  },
];

const REVIEWS = [
  ['james', 'owner1', 5, 'Absolutely brilliant work on my BMW M340i. Stage 1 map totally transformed the car. Pulls so much harder now and the service was faultless.'],
  ['sophie', 'owner1', 5, 'Had coilovers fitted and a full alignment. Car handles like a go-kart now. Highly recommend these guys — really know their stuff.'],
  ['daniel', 'owner2', 4, 'Widebody kit came out amazing. The paint match was spot on. Took a bit longer than expected but the quality is worth the wait.'],
  ['emma', 'owner4', 5, 'Full leather retrim on my Mercedes C63. The craftsmanship is incredible — looks better than factory. Worth every penny.'],
  ['michael', 'owner6', 5, 'Track car prep and dyno tune for my Subaru STI. The data logging and setup they provide is on another level. Proper race engineering.'],
  ['james', 'owner3', 4, 'Great alignment work and fair prices. Booked in quickly.'],
  ['sophie', 'owner5', 4, 'Wrap looks great, friendly team.'],
];

const GALLERY = [3806288, 3806249, 4489702, 3786091, 2096523, 2533092].map(img);

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function findUserByEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email === email);
    if (user || data.users.length < 200) return user ?? null;
  }
  return null;
}

async function ensureUser(u) {
  const { data, error } = await db.auth.admin.createUser({
    email: u.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name, role: u.role },
  });
  if (!error) return data.user.id;
  const existing = await findUserByEmail(u.email);
  if (!existing) throw new Error(`Could not create ${u.email}: ${error.message}`);
  return existing.id;
}

async function main() {
  console.log(`Seeding ${url}`);
  const ids = {};
  for (const u of USERS) {
    ids[u.key] = await ensureUser(u);
    if (u.makeAdmin) {
      await must(db.from('profiles').update({ role: 'admin' }).eq('id', ids[u.key]), 'promote admin');
    }
  }
  console.log(`  ✓ ${USERS.length} users`);

  const categories = await must(db.from('service_categories').select('id, slug'), 'categories');
  const catId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const shopIds = {};
  for (const s of SHOPS) {
    const row = {
      owner_id: ids[s.owner],
      name: s.name,
      description: s.description,
      address: s.address,
      city: s.city,
      postcode: s.postcode,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      email: s.email,
      website: s.website,
      price_level: s.price_level,
      opening_hours: s.hours,
      vehicle_brands: s.brands,
      cover_image_url: s.cover,
      logo_url: s.cover,
      status: 'approved',
      is_verified: s.is_verified,
    };
    const shop = await must(
      db.from('shops').upsert(row, { onConflict: 'owner_id' }).select('id').single(),
      `shop ${s.name}`
    );
    shopIds[s.owner] = shop.id;

    await must(db.from('shop_services').delete().eq('shop_id', shop.id), 'clear services');
    await must(
      db.from('shop_services').insert(
        s.services.map(([slug, name, description, from, to, unit, duration]) => ({
          shop_id: shop.id,
          category_id: catId[slug] ?? null,
          name,
          description,
          price_from: from,
          price_to: to,
          unit,
          duration_minutes: duration,
        }))
      ),
      `services for ${s.name}`
    );

    await must(db.from('shop_portfolio').delete().eq('shop_id', shop.id), 'clear portfolio');
    if (s.portfolio.length) {
      await must(
        db.from('shop_portfolio').insert(
          s.portfolio.map(([slug, title, description, make, model, year, before, after]) => ({
            shop_id: shop.id,
            category_id: catId[slug] ?? null,
            title,
            description,
            vehicle_make: make,
            vehicle_model: model,
            vehicle_year: year,
            before_image_url: before,
            after_image_url: after,
          }))
        ),
        `portfolio for ${s.name}`
      );
    }

    await must(db.from('shop_images').delete().eq('shop_id', shop.id), 'clear gallery');
    await must(
      db.from('shop_images').insert(
        GALLERY.slice(0, 4).map((image_url, i) => ({ shop_id: shop.id, image_url, sort_order: i }))
      ),
      `gallery for ${s.name}`
    );
  }
  console.log(`  ✓ ${SHOPS.length} shops with services, portfolio and gallery`);

  for (const [user, owner, rating, comment] of REVIEWS) {
    await must(
      db
        .from('reviews')
        .upsert({ shop_id: shopIds[owner], user_id: ids[user], rating, comment }, { onConflict: 'shop_id,user_id' }),
      'review'
    );
  }
  console.log(`  ✓ ${REVIEWS.length} reviews`);

  console.log('\nDemo accounts (password = SEED_PASSWORD):');
  for (const u of USERS) console.log(`  ${u.makeAdmin ? 'admin' : u.role.padEnd(10)}  ${u.email}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
