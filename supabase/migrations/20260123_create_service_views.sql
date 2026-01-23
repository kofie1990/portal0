-- Create service_views table
create table if not exists public.service_views (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  service_id uuid references public.services(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete set null
);

-- Enable RLS
alter table public.service_views enable row level security;

-- Policies
-- Everyone can insert (view)
create policy "Everyone can insert views" on public.service_views
  for insert with check (true);

-- Only service owners can select (analytics)
create policy "Service owners can view analytics" on public.service_views
  for select using (
    exists (
      select 1 from public.services
      where services.id = service_views.service_id
      and (
        services.profile_id = auth.uid() or
        exists (
          select 1 from public.businesses
          where businesses.id = services.business_id
          and businesses.owner_id = auth.uid()
        )
      )
    )
  );
