-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'business', 'admin')),
  onboarding_completed boolean default false,
  interests text[] default '{}',
  phone text,
  bio text,
  email text -- Copied from auth.users for easier queries if needed
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- BUSINESSES
create table businesses (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references profiles(id) on delete cascade not null,
  
  -- Basic Info
  name text not null,
  category text, -- e.g. "Barber", "Cleaner"
  bio text,
  description text,
  
  -- Location (Required for ALL types)
  location_address text,
  lat double precision,
  lng double precision,
  location_type text check (location_type in ('physical', 'mobile')) default 'physical',
  
  -- Contact & Media
  phone text,
  email text,
  website text,
  iframe_map_url text,
  image_url text,
  cover_image_url text,
  social_links jsonb default '{}', -- { "instagram": "...", "twitter": "..." }
  
  -- Payment (Paystack)
  paystack_subaccount_code text, -- e.g. "ACCT_xxxx"
  
  -- Settings
  deposit_fee numeric default 0,
  open_now boolean default true,
  is_verified boolean default false,
  
  -- Aggregates
  rating numeric default 0,
  review_count integer default 0
);

alter table businesses enable row level security;

create policy "Businesses are viewable by everyone." on businesses
  for select using (true);

create policy "Business owners can update their business." on businesses
  for update using (auth.uid() = owner_id);

create policy "Business owners can insert their business." on businesses
  for insert with check (auth.uid() = owner_id);

-- SERVICES (No products)
create table services (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  business_id uuid references businesses(id) on delete cascade not null,
  
  name text not null,
  description text,
  
  -- Price & Duration
  price_amount numeric not null, -- Stores exact value e.g. 150.00
  price_currency text default 'GHS',
  duration_text text, -- e.g. "1 hr" for display
  duration_minutes integer, -- Optional: for calculation
  
  image_url text
);

alter table services enable row level security;

create policy "Services are viewable by everyone." on services
  for select using (true);

create policy "Business owners can manage their services." on services
  for all using (
    exists (
      select 1 from businesses
      where businesses.id = services.business_id
      and businesses.owner_id = auth.uid()
    )
  );

-- BOOKINGS
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  user_id uuid references profiles(id) on delete cascade not null,
  business_id uuid references businesses(id) on delete cascade not null,
  service_id uuid references services(id) on delete set null,
  
  booking_date timestamp with time zone not null,
  status text default 'pending_payment' check (status in ('pending_payment', 'confirmed', 'completed', 'cancelled')),
  
  -- Payment
  total_amount numeric not null,
  paystack_reference text,
  
  notes text
);

alter table bookings enable row level security;

create policy "Users can view their own bookings." on bookings
  for select using (auth.uid() = user_id);

create policy "Business owners can view bookings for their business." on bookings
  for select using (
    exists (
      select 1 from businesses
      where businesses.id = bookings.business_id
      and businesses.owner_id = auth.uid()
    )
  );

create policy "Users can create bookings." on bookings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own bookings." on bookings
  for update using (auth.uid() = user_id);

-- REVIEWS
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  
  rating integer check (rating >= 1 and rating <= 5),
  comment text
);

alter table reviews enable row level security;

create policy "Reviews are viewable by everyone." on reviews
  for select using (true);

create policy "Users can create reviews." on reviews
  for insert with check (auth.uid() = user_id);

-- TRIGGER for new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  biz_data jsonb;
begin
  -- Insert Profile
  insert into public.profiles (id, full_name, avatar_url, phone, email, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.raw_user_meta_data->>'phone',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );

  -- Insert Business if metadata exists
  biz_data := new.raw_user_meta_data->'business_data';
  
  if biz_data is not null then
      insert into public.businesses (
          owner_id, 
          name, 
          category, 
          description, 
          location_address, 
          location_type, 
          deposit_fee, 
          phone, 
          email
      ) values (
          new.id,
          biz_data->>'name',
          biz_data->>'category',
          biz_data->>'description',
          biz_data->>'location_address',
          biz_data->>'location_type',
          coalesce((biz_data->>'deposit_fee')::numeric, 0),
          biz_data->>'phone',
          biz_data->>'email'
      );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid conflicts during reloading
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
