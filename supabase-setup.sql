-- 1) Tables
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    name text,
    is_admin boolean not null default false,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz
);

create table if not exists public.favorites (
    user_id uuid not null references auth.users (id) on delete cascade,
    store_id text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, store_id)
);

-- 2) Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;

-- Helper: Is current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Profiles Policies
drop policy if exists "profiles read own" on public.profiles;
drop policy if exists "profiles admins read" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles admins read" on public.profiles for select using (public.is_admin());

-- Favorites Policies
drop policy if exists "favorites read own" on public.favorites;
drop policy if exists "favorites insert own" on public.favorites;
drop policy if exists "favorites delete own" on public.favorites;
drop policy if exists "favorites admins read" on public.favorites;
create policy "favorites read own" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites insert own" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites delete own" on public.favorites for delete using (auth.uid() = user_id);
create policy "favorites admins read" on public.favorites for select using (public.is_admin());

-- 3) Automatic profile creation on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, name, is_admin)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'name', ''),
        false
    );
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 4) "Last seen" timestamp update function
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
    update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;


-- ==========================================
-- MANUALLY SET YOUR ADMIN ACCOUNT HERE
-- (Run this after you register your account)
-- ==========================================
update public.profiles 
set is_admin = true 
where email = 'ameynair377@gmail.com';

-- 1) Create Stores Table
create table if not exists public.stores (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    url text not null,
    category text default 'Clothing',
    description text,
    is_approved boolean default true,
    created_at timestamptz default now()
);

-- 2) Enable Row Level Security (RLS)
alter table public.stores enable row level security;

-- Public can view stores
drop policy if exists "Public can view approved stores" on public.stores;
create policy "Public can view approved stores" on public.stores 
    for select using (is_approved = true or public.is_admin());

-- Only Admins can Insert, Update, or Delete stores
drop policy if exists "Admins full access on stores" on public.stores;
create policy "Admins full access on stores" on public.stores 
    for all using (public.is_admin());