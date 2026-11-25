-- =====================================================================
-- Ritan Foods - database schema (Supabase / Postgres 15+)
-- Money is stored as integer paise. The app talks to these tables from
-- the server with the service-role key; RLS below protects direct
-- client access (anon / authenticated keys).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Types
create type public.order_status as enum ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed');
create type public.payment_method as enum ('razorpay', 'cod');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cod');
create type public.coupon_type as enum ('percent', 'flat', 'free_shipping');

-- ---------------------------------------------------------------- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- Catalogue
create table public.categories (
  id text primary key,
  name text not null,
  blurb text not null default '',
  sort int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  alt_name text,
  category_id text not null references public.categories (id),
  tagline text not null default '',
  summary text not null default '',
  description text not null default '',
  key_ingredients text[] not null default '{}',
  ingredients text,
  how_to_use text not null default '',
  pack_type text not null default 'pouch' check (pack_type in ('pouch', 'jar', 'box')),
  image text not null,
  image_width int not null default 1200,
  image_height int not null default 1800,
  scene text,
  palette jsonb not null default '{}'::jsonb,
  sprites text[] not null default '{}',
  featured boolean not null default false,
  is_active boolean not null default true,
  sort int not null default 0,
  rating_avg numeric(3, 1) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  weight_g int not null check (weight_g > 0),
  sku text not null unique,
  price_paise int not null check (price_paise >= 0),
  mrp_paise int check (mrp_paise >= 0),
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  unique (product_id, weight_g)
);
create index product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------- Customers
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  landmark text,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[1-8][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

create table public.wishlists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------- Coupons
create table public.coupons (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  description text not null default '',
  type public.coupon_type not null,
  value int not null default 0 check (value >= 0),
  min_subtotal_paise int not null default 0 check (min_subtotal_paise >= 0),
  max_discount_paise int check (max_discount_paise >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int check (usage_limit > 0),
  per_customer_limit int check (per_customer_limit > 0),
  is_active boolean not null default true,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  phone text not null,
  customer_name text not null,
  shipping_address jsonb not null,
  items_count int not null default 0,
  subtotal_paise int not null check (subtotal_paise >= 0),
  discount_paise int not null default 0 check (discount_paise >= 0),
  shipping_paise int not null default 0 check (shipping_paise >= 0),
  cod_fee_paise int not null default 0 check (cod_fee_paise >= 0),
  total_paise int not null check (total_paise >= 0),
  coupon_code text references public.coupons (code) on delete set null,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  status public.order_status not null default 'pending',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  shipping_zone text,
  courier text check (courier in ('DTDC', 'India Post')),
  tracking_number text,
  notes text,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);
create index orders_email_idx on public.orders (email);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  product_slug text not null,
  weight_g int not null,
  unit_price_paise int not null check (unit_price_paise >= 0),
  quantity int not null check (quantity > 0),
  line_total_paise int not null check (line_total_paise >= 0),
  image text,
  position int not null default 0
);
create index order_items_order_idx on public.order_items (order_id);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_code text not null references public.coupons (code) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  email text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index coupon_redemptions_lookup_idx on public.coupon_redemptions (coupon_code, email);

-- ---------------------------------------------------------------- Reviews, settings, messages
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  location text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  verified_purchase boolean not null default false,
  is_approved boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id, is_approved);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Triggers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating_count = (select count(*) from public.reviews r where r.product_id = pid and r.is_approved),
      rating_avg = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product_id = pid and r.is_approved), 0)
  where p.id = pid;
  return null;
end;
$$;

create trigger reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ---------------------------------------------------------------- Order creation (order + items in one transaction)
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'an order needs at least one item';
  end if;

  insert into public.orders (
    order_number, user_id, email, phone, customer_name, shipping_address, items_count,
    subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, total_paise,
    coupon_code, payment_method, shipping_zone, notes, events
  )
  select r.order_number, r.user_id, lower(r.email), r.phone, r.customer_name, r.shipping_address, r.items_count,
         r.subtotal_paise, r.discount_paise, r.shipping_paise, r.cod_fee_paise, r.total_paise,
         r.coupon_code, r.payment_method, r.shipping_zone, r.notes, coalesce(r.events, '[]'::jsonb)
  from jsonb_populate_record(null::public.orders, p_order) r
  returning id into new_id;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, product_slug, weight_g,
    unit_price_paise, quantity, line_total_paise, image, position
  )
  select new_id, r.product_id, r.variant_id, r.product_name, r.product_slug, r.weight_g,
         r.unit_price_paise, r.quantity, r.line_total_paise, r.image, e.pos::int
  from jsonb_array_elements(p_items) with ordinality as e(item, pos)
  cross join lateral jsonb_populate_record(null::public.order_items, e.item) r;

  return new_id;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------- Order confirmation (atomic, idempotent)
-- Decrements stock, records coupon use and marks the order confirmed in one
-- transaction. Safe to call twice (verify route + webhook race).
create or replace function public.confirm_order(p_order_number text, p_payment_id text, p_method public.payment_method)
returns table (order_id uuid, already_confirmed boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  o public.orders%rowtype;
  it record;
  cur int;
  shortfalls text := '';
  ts timestamptz := now();
begin
  select * into o from public.orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order % not found', p_order_number;
  end if;

  if o.status not in ('pending', 'failed') then
    return query select o.id, true;
    return;
  end if;

  for it in
    select oi.variant_id, oi.quantity, oi.product_name, oi.weight_g
    from public.order_items oi
    where oi.order_id = o.id
    order by oi.variant_id -- consistent lock order between concurrent confirmations
  loop
    if it.variant_id is not null then
      select v.stock into cur from public.product_variants v where v.id = it.variant_id for update;
      if cur is not null then
        if cur < it.quantity then
          shortfalls := shortfalls || case when shortfalls = '' then '' else ', ' end || it.product_name || ' ' || it.weight_g || 'g (had ' || cur || ')';
        end if;
        update public.product_variants v set stock = greatest(0, cur - it.quantity) where v.id = it.variant_id;
      end if;
    end if;
  end loop;

  if o.coupon_code is not null then
    insert into public.coupon_redemptions (coupon_code, order_id, email, user_id)
    values (o.coupon_code, o.id, lower(o.email), o.user_id)
    on conflict on constraint coupon_redemptions_order_id_key do nothing;
    if found then
      update public.coupons set used_count = used_count + 1 where code = o.coupon_code;
    end if;
  end if;

  update public.orders
  set status = 'confirmed',
      payment_status = case when p_method = 'cod' then 'cod'::public.payment_status else 'paid'::public.payment_status end,
      razorpay_payment_id = coalesce(p_payment_id, razorpay_payment_id),
      paid_at = case when p_method = 'cod' then null else ts end,
      notes = case when shortfalls = '' then notes else concat_ws(' · ', notes, 'Stock shortfall: ' || shortfalls) end,
      events = events || jsonb_build_array(jsonb_build_object(
        'status', 'confirmed',
        'note', case when p_method = 'cod' then 'Cash on delivery order confirmed' else 'Payment received' end,
        'createdAt', to_char(ts at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ))
  where id = o.id;

  return query select o.id, false;
end;
$$;

revoke all on function public.confirm_order(text, text, public.payment_method) from public, anon, authenticated;

-- ---------------------------------------------------------------- Row-level security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.contact_messages enable row level security;

-- Public catalogue
create policy "categories are public" on public.categories for select using (true);
create policy "active products are public" on public.products for select using (is_active);
create policy "variants of active products are public" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "approved reviews are public" on public.reviews for select using (is_approved);
create policy "store settings are public" on public.settings for select using (true);

-- Customers see only their own data (writes go through the server)
create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "manage own addresses" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "manage own wishlist" on public.wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read own orders" on public.orders for select using (user_id = auth.uid());
create policy "read own order items" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
-- coupons, coupon_redemptions and contact_messages: no client policies (server only).

-- ---------------------------------------------------------------- Storage (product photos)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
