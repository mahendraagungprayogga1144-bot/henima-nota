-- Henima internal: jalankan sekali di Supabase → SQL Editor → Run
-- Lalu: Authentication → Providers → Email → matikan "Confirm email"

create table if not exists public.leaders (
  id text primary key,
  name text not null
);

create table if not exists public.sales_people (
  id text primary key,
  name text not null,
  leader_id text references public.leaders(id)
);

create table if not exists public.products (
  id text primary key,
  sku text not null unique,
  name text not null,
  size text not null default '—',
  unit text not null default 'pcs',
  stock integer not null default 0,
  min_stock integer not null default 0,
  price integer not null default 0
);

create table if not exists public.invoices (
  id text primary key,
  number text not null unique,
  at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null default '',
  sales_id text not null references public.sales_people(id),
  discount integer not null default 0,
  paid_amount integer not null default 0,
  status text not null check (status in ('lunas','dp','piutang')),
  note text not null default '',
  cancelled boolean not null default false,
  returned boolean not null default false
);

create table if not exists public.invoice_items (
  invoice_id text not null references public.invoices(id) on delete cascade,
  product_id text not null,
  name text not null,
  sku text not null,
  qty integer not null,
  price integer not null,
  primary key (invoice_id, product_id)
);

create table if not exists public.payments (
  id text primary key,
  invoice_id text not null references public.invoices(id) on delete cascade,
  at timestamptz not null default now(),
  amount integer not null,
  note text not null default ''
);

create table if not exists public.stock_movements (
  id text primary key,
  at timestamptz not null default now(),
  type text not null check (type in ('masuk','keluar','nota','batal','retur')),
  product_id text not null,
  qty integer not null,
  note text not null default '',
  invoice_id text
);

create table if not exists public.activities (
  id text primary key,
  at timestamptz not null default now(),
  actor text not null,
  role text not null,
  action text not null,
  detail text not null default ''
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin','gudang','sales','leader')),
  sales_id text references public.sales_people(id),
  leader_id text references public.leaders(id)
);

alter table public.leaders enable row level security;
alter table public.sales_people enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.activities enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "staff_all_leaders" on public.leaders;
create policy "staff_all_leaders" on public.leaders for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_sales" on public.sales_people;
create policy "staff_all_sales" on public.sales_people for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_products" on public.products;
create policy "staff_all_products" on public.products for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_invoices" on public.invoices;
create policy "staff_all_invoices" on public.invoices for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_items" on public.invoice_items;
create policy "staff_all_items" on public.invoice_items for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_payments" on public.payments;
create policy "staff_all_payments" on public.payments for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_movements" on public.stock_movements;
create policy "staff_all_movements" on public.stock_movements for all to authenticated using (true) with check (true);
drop policy if exists "staff_all_activities" on public.activities;
create policy "staff_all_activities" on public.activities for all to authenticated using (true) with check (true);
drop policy if exists "staff_read_profiles" on public.profiles;
create policy "staff_read_profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "staff_insert_own_profile" on public.profiles;
create policy "staff_insert_own_profile" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "staff_update_profiles" on public.profiles;
create policy "staff_update_profiles" on public.profiles for update to authenticated using (true) with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
  next_name text;
begin
  select case when exists (select 1 from public.profiles) then 'sales' else 'admin' end into next_role;
  next_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  insert into public.profiles (id, name, role)
  values (new.id, next_name, next_role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.leaders (id, name) values
  ('L1', 'Raka Putra'),
  ('L2', 'Sinta Maharani')
on conflict (id) do nothing;

insert into public.sales_people (id, name, leader_id) values
  ('S0', 'Counter Henima', null),
  ('S1', 'Andi Wijaya', 'L1'),
  ('S2', 'Dina Lestari', 'L1'),
  ('S3', 'Bagas Pratama', 'L2'),
  ('S4', 'Maya Kusuma', 'L2')
on conflict (id) do nothing;

insert into public.products (id, sku, name, size, unit, stock, min_stock, price) values
  ('P1', 'HEN-NOIR-50', 'Signature Noir', '50ml', 'botol', 42, 10, 189000),
  ('P2', 'HEN-BLNC-50', 'Signature Blanc', '50ml', 'botol', 35, 10, 189000),
  ('P3', 'HEN-ROSE-50', 'Signature Rose', '50ml', 'botol', 28, 8, 199000),
  ('P4', 'HEN-OUD-50', 'Oud Atelier', '50ml', 'botol', 18, 6, 249000),
  ('P5', 'HEN-DISC', 'Discovery Set', '5×5ml', 'set', 12, 5, 129000),
  ('P6', 'HEN-GIFT', 'Gift Set Duo', '2×30ml', 'set', 8, 4, 279000)
on conflict (id) do nothing;
