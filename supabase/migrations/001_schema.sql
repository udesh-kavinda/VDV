-- updated_at trigger function
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- vehicles
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plate text not null,
  icon text not null default '🚗',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();

-- documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'insurance','licence','emission','fuel_pass','roadworthy','custom'
  )),
  label text,
  expires_at date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger documents_updated_at before update on documents
  for each row execute function set_updated_at();

-- document_links
create table document_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  label text not null,
  url text not null,
  is_preset boolean not null default false
);

-- push_subscriptions
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  device_id uuid not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique(user_id, device_id)
);

-- notification_log
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  threshold_days int not null check (threshold_days in (1,7,14,30)),
  expires_at_snapshot date not null,
  sent_at timestamptz not null default now(),
  unique(document_id, threshold_days, expires_at_snapshot)
);
