create extension if not exists pgcrypto;

do $$ begin
  create type app_role as enum ('admin', 'bd');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type quote_status as enum (
    'submitted',
    'contacted',
    'negotiating',
    'confirmed',
    'ready',
    'shipped',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role app_role not null default 'bd',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'SodaSplash',
  description text,
  image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists flavours (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  note text,
  price_per_case integer not null check (price_per_case >= 0),
  color text not null default '#2e6fb8',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  customer_name text not null,
  email text not null,
  phone text not null,
  business_name text,
  business_type text not null,
  referral_source text not null,
  referral_name text,
  bd_id uuid references profiles(id),
  assigned_to uuid references profiles(id),
  note text,
  internal_note text,
  status quote_status not null default 'submitted',
  subtotal integer not null default 0,
  discount_type text check (discount_type in ('percentage', 'flat') or discount_type is null),
  discount_value integer not null default 0,
  discount_amount integer not null default 0,
  tax_amount integer not null default 0,
  additional_charges integer not null default 0,
  total integer not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid', 'refunded')),
  invoice_version integer not null default 0,
  latest_invoice_number text,
  finalized_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quotes add column if not exists subtotal integer not null default 0;
alter table quotes add column if not exists discount_type text check (discount_type in ('percentage', 'flat') or discount_type is null);
alter table quotes add column if not exists discount_value integer not null default 0;
alter table quotes add column if not exists discount_amount integer not null default 0;
alter table quotes add column if not exists tax_amount integer not null default 0;
alter table quotes add column if not exists additional_charges integer not null default 0;
alter table quotes add column if not exists total integer not null default 0;
alter table quotes add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid', 'refunded'));
alter table quotes add column if not exists invoice_version integer not null default 0;
alter table quotes add column if not exists latest_invoice_number text;
alter table quotes add column if not exists finalized_at timestamptz;
alter table quotes add column if not exists cancelled_at timestamptz;

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  flavour_id uuid references flavours(id),
  flavour_name text not null,
  quantity integer not null check (quantity > 0),
  price_per_case integer not null check (price_per_case >= 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists quote_status_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  from_status quote_status,
  to_status quote_status not null,
  actor_id uuid references profiles(id),
  actor_role text not null default 'system',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists tracking_otps (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists discount_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('percentage', 'flat')),
  value integer not null check (value >= 0),
  min_cases integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  invoice_number text not null unique,
  version integer not null default 1,
  storage_path text,
  pdf_url text,
  is_latest boolean not null default true,
  emailed_to text,
  emailed_at timestamptz,
  pricing_snapshot jsonb not null,
  generated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table products enable row level security;
alter table flavours enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table quote_status_events enable row level security;
alter table tracking_otps enable row level security;
alter table discount_rules enable row level security;
alter table invoices enable row level security;

create policy "Public can read active products" on products for select using (is_active = true);
create policy "Public can read active flavours" on flavours for select using (is_active = true);

create policy "Staff can read own profile" on profiles for select using (auth.uid() = id);
create policy "Admin can read all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "Admin can manage products" on products for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Admin can manage flavours" on flavours for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "Admin can read all quotes" on quotes for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "BD can read assigned quotes" on quotes for select using (
  bd_id = auth.uid() or assigned_to = auth.uid()
);

create policy "Admin can read quote items" on quote_items for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "BD can read quote items" on quote_items for select using (
  exists (select 1 from quotes q where q.id = quote_id and (q.bd_id = auth.uid() or q.assigned_to = auth.uid()))
);

insert into products (name, description, display_order)
select 'Goli Soda', 'Classic marble soda bottles supplied by the case.', 1
where not exists (select 1 from products where name = 'Goli Soda');

insert into products (name, description, display_order)
select 'Cup Soda', 'Ready-to-serve cup format for counters and events.', 2
where not exists (select 1 from products where name = 'Cup Soda');

insert into products (name, description, display_order)
select 'More', 'Seasonal and custom flavours for larger requirements.', 3
where not exists (select 1 from products where name = 'More');

insert into storage.buckets (id, name, public)
select 'invoices', 'invoices', false
where not exists (select 1 from storage.buckets where id = 'invoices');

with product as (
  select id from products where name = 'Goli Soda' order by created_at limit 1
)
insert into flavours (product_id, name, note, price_per_case, color, display_order)
select product.id, flavour.name, flavour.note, flavour.price, flavour.color, flavour.display_order
from product,
(values
  ('Mango', 'Ripe and tropical', 1200, '#d49a3a', 1),
  ('Lemon', 'Clean and citrus-forward', 1100, '#b8b94b', 2),
  ('Orange', 'Bright and balanced', 1100, '#cf7045', 3),
  ('Mixed Berry', 'Rich and fruit-led', 1300, '#855b82', 4)
) as flavour(name, note, price, color, display_order)
where not exists (select 1 from flavours f where f.name = flavour.name);

with product as (
  select id from products where name = 'Cup Soda' order by created_at limit 1
)
insert into flavours (product_id, name, note, price_per_case, color, display_order)
select product.id, flavour.name, flavour.note, flavour.price, flavour.color, flavour.display_order
from product,
(values
  ('Cola', 'Familiar and fast moving', 900, '#7b4f42', 1),
  ('Lime', 'Sharp and refreshing', 850, '#7aa957', 2)
) as flavour(name, note, price, color, display_order)
where not exists (select 1 from flavours f where f.product_id = product.id and f.name = flavour.name);

with product as (
  select id from products where name = 'More' order by created_at limit 1
)
insert into flavours (product_id, name, note, price_per_case, color, display_order)
select product.id, flavour.name, flavour.note, flavour.price, flavour.color, flavour.display_order
from product,
(values
  ('Ginger', 'Warm and punchy', 1300, '#b77742', 1),
  ('Jeera', 'Spiced and savoury', 1250, '#8d7650', 2)
) as flavour(name, note, price, color, display_order)
where not exists (select 1 from flavours f where f.product_id = product.id and f.name = flavour.name);
