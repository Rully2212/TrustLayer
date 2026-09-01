-- TrustLayer initial Supabase schema.
-- This migration stores seller-owned product passports while keeping public
-- passport reads limited to explicitly published records.

create extension if not exists pgcrypto;

create sequence if not exists public.passport_id_seq as integer start with 1 increment by 1;

create or replace function public.generate_passport_id()
returns text
language sql
security definer
set search_path = public
as $$
  select 'TL-' || lpad(nextval('public.passport_id_seq')::text, 6, '0');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  seller_name text not null,
  store_name text not null,
  country text,
  verification_status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passports (
  id uuid primary key default gen_random_uuid(),
  passport_id text not null default public.generate_passport_id(),
  category text not null,
  product_name text not null,
  brand text,
  model text,
  condition text,
  description text,
  identifier_type text,
  masked_identifier text,
  identifier_hash text,
  verification_status text not null default 'Draft',
  warranty_status text not null default 'No Warranty',
  warranty_period text,
  warranty_expiry date,
  seller_name text not null,
  seller_id uuid not null references public.sellers(id) on delete restrict,
  owner_wallet text,
  solana_certificate_status text not null default 'Not Minted',
  solana_mint_address text,
  solana_tx_signature text,
  qr_status text not null default 'Not Ready',
  public_link text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passport_attributes (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete cascade,
  attribute_key text not null,
  attribute_value text,
  attribute_type text not null default 'text',
  is_public boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint passport_attributes_passport_key_unique unique (passport_id, attribute_key)
);

create table if not exists public.passport_history (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  status text not null default 'Completed',
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.passport_reports (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete cascade,
  reporter_profile_id uuid references public.profiles(id) on delete set null,
  reporter_email text,
  report_type text not null default 'Buyer Report',
  message text not null,
  status text not null default 'Open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_passports_passport_id
  on public.passports(passport_id);
create index if not exists idx_passports_seller_id
  on public.passports(seller_id);
create index if not exists idx_passports_category
  on public.passports(category);
create index if not exists idx_passports_verification_status
  on public.passports(verification_status);
create index if not exists idx_passports_created_at
  on public.passports(created_at desc);
create unique index if not exists idx_passports_public_link
  on public.passports(public_link)
  where public_link is not null;

create index if not exists idx_passport_attributes_passport_id
  on public.passport_attributes(passport_id);
create index if not exists idx_passport_history_passport_id_event_at
  on public.passport_history(passport_id, event_at desc);
create index if not exists idx_passport_reports_passport_id_status
  on public.passport_reports(passport_id, status);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_sellers_updated_at on public.sellers;
create trigger set_sellers_updated_at
before update on public.sellers
for each row execute function public.set_updated_at();

drop trigger if exists set_passports_updated_at on public.passports;
create trigger set_passports_updated_at
before update on public.passports
for each row execute function public.set_updated_at();

drop trigger if exists set_passport_attributes_updated_at on public.passport_attributes;
create trigger set_passport_attributes_updated_at
before update on public.passport_attributes
for each row execute function public.set_updated_at();

drop trigger if exists set_passport_reports_updated_at on public.passport_reports;
create trigger set_passport_reports_updated_at
before update on public.passport_reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_seller_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.sellers s
  where s.profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.owns_passport(passport_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.passports p
    where p.id = passport_uuid
      and p.seller_id = public.current_seller_id()
  );
$$;

create or replace function public.is_passport_published(passport_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.passports p
    where p.id = passport_uuid
      and p.is_published = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.passports enable row level security;
alter table public.passport_attributes enable row level security;
alter table public.passport_history enable row level security;
alter table public.passport_reports enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Sellers can read their own seller record" on public.sellers;
create policy "Sellers can read their own seller record"
on public.sellers
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "Sellers can create their own seller record" on public.sellers;
create policy "Sellers can create their own seller record"
on public.sellers
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "Sellers can update their own seller record" on public.sellers;
create policy "Sellers can update their own seller record"
on public.sellers
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "Public users can read published passports" on public.passports;
create policy "Public users can read published passports"
on public.passports
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Sellers can read their own passports" on public.passports;
create policy "Sellers can read their own passports"
on public.passports
for select
to authenticated
using (seller_id = public.current_seller_id());

drop policy if exists "Sellers can create their own passports" on public.passports;
create policy "Sellers can create their own passports"
on public.passports
for insert
to authenticated
with check (seller_id = public.current_seller_id());

drop policy if exists "Sellers can update their own passports" on public.passports;
create policy "Sellers can update their own passports"
on public.passports
for update
to authenticated
using (seller_id = public.current_seller_id())
with check (seller_id = public.current_seller_id());

drop policy if exists "Sellers can delete their own passports" on public.passports;
create policy "Sellers can delete their own passports"
on public.passports
for delete
to authenticated
using (seller_id = public.current_seller_id());

drop policy if exists "Public users can read public attributes for published passports" on public.passport_attributes;
create policy "Public users can read public attributes for published passports"
on public.passport_attributes
for select
to anon, authenticated
using (is_public = true and public.is_passport_published(passport_id));

drop policy if exists "Sellers can manage attributes on their own passports" on public.passport_attributes;
create policy "Sellers can manage attributes on their own passports"
on public.passport_attributes
for all
to authenticated
using (public.owns_passport(passport_id))
with check (public.owns_passport(passport_id));

drop policy if exists "Public users can read history for published passports" on public.passport_history;
create policy "Public users can read history for published passports"
on public.passport_history
for select
to anon, authenticated
using (public.is_passport_published(passport_id));

drop policy if exists "Sellers can manage history on their own passports" on public.passport_history;
create policy "Sellers can manage history on their own passports"
on public.passport_history
for all
to authenticated
using (public.owns_passport(passport_id))
with check (public.owns_passport(passport_id));

drop policy if exists "Public users can create reports for published passports" on public.passport_reports;
create policy "Public users can create reports for published passports"
on public.passport_reports
for insert
to anon, authenticated
with check (
  public.is_passport_published(passport_id)
  and status = 'Open'
  and (reporter_profile_id is null or reporter_profile_id = auth.uid())
);

drop policy if exists "Sellers can read reports on their own passports" on public.passport_reports;
create policy "Sellers can read reports on their own passports"
on public.passport_reports
for select
to authenticated
using (public.owns_passport(passport_id));

drop policy if exists "Sellers can update reports on their own passports" on public.passport_reports;
create policy "Sellers can update reports on their own passports"
on public.passport_reports
for update
to authenticated
using (public.owns_passport(passport_id))
with check (public.owns_passport(passport_id));

grant usage on schema public to anon, authenticated;

revoke all on function public.current_seller_id() from public;
revoke all on function public.owns_passport(uuid) from public;
revoke all on function public.is_passport_published(uuid) from public;
grant execute on function public.current_seller_id() to authenticated;
grant execute on function public.owns_passport(uuid) to authenticated;
grant execute on function public.is_passport_published(uuid) to anon, authenticated;
grant execute on function public.generate_passport_id() to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.sellers to authenticated;

grant select (
  id,
  passport_id,
  category,
  product_name,
  brand,
  model,
  condition,
  description,
  identifier_type,
  masked_identifier,
  verification_status,
  warranty_status,
  warranty_period,
  warranty_expiry,
  seller_name,
  seller_id,
  owner_wallet,
  solana_certificate_status,
  solana_mint_address,
  solana_tx_signature,
  qr_status,
  public_link,
  is_published,
  published_at,
  created_at,
  updated_at
) on public.passports to anon;

grant select (
  id,
  passport_id,
  category,
  product_name,
  brand,
  model,
  condition,
  description,
  identifier_type,
  masked_identifier,
  verification_status,
  warranty_status,
  warranty_period,
  warranty_expiry,
  seller_name,
  seller_id,
  owner_wallet,
  solana_certificate_status,
  solana_mint_address,
  solana_tx_signature,
  qr_status,
  public_link,
  is_published,
  published_at,
  created_at,
  updated_at
) on public.passports to authenticated;

grant insert, update, delete on public.passports to authenticated;
grant select on public.passport_attributes to anon, authenticated;
grant insert, update, delete on public.passport_attributes to authenticated;
grant select on public.passport_history to anon, authenticated;
grant insert, update, delete on public.passport_history to authenticated;
grant insert on public.passport_reports to anon, authenticated;
grant select, update on public.passport_reports to authenticated;

comment on table public.passports is
  'Seller-owned TrustLayer product passports. identifier_hash is intentionally not granted to anon/authenticated select clients.';
comment on column public.passports.is_published is
  'Controls public passport visibility for buyer-facing passport and verification pages.';
comment on table public.passport_attributes is
  'Flexible category-specific key/value attributes. Set is_public=false for seller-only details.';
