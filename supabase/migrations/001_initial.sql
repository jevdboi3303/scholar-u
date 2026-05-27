-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Scholarships table
create table if not exists scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scholarship_type text,
  application_required boolean,
  description text,
  quantity text,
  preference text,
  faculty text,
  gender text,
  year text,
  disability boolean,
  indigenous boolean,
  race text,
  nationality text,
  gpa numeric(4, 2),
  amount numeric(12, 2),
  gpa_based boolean,
  medals_prizes boolean,
  deadline date,
  created_at timestamptz default now()
);

-- Full-text search index
create index if not exists scholarships_name_idx on scholarships using gin(to_tsvector('english', name));
create index if not exists scholarships_faculty_idx on scholarships(faculty);
create index if not exists scholarships_type_idx on scholarships(scholarship_type);

-- User profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  faculty text,
  year text,
  gpa numeric(4, 2),
  gender text,
  nationality text,
  indigenous boolean default false,
  disability boolean default false,
  created_at timestamptz default now()
);

-- Saved scholarships table
create table if not exists saved_scholarships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_id uuid not null references scholarships(id) on delete cascade,
  notes text,
  status text default 'saved' check (status in ('saved', 'applied', 'awarded')),
  created_at timestamptz default now(),
  unique(user_id, scholarship_id)
);

-- Row Level Security
alter table scholarships enable row level security;
alter table user_profiles enable row level security;
alter table saved_scholarships enable row level security;

-- Scholarships: public read
create policy "Scholarships are publicly readable"
  on scholarships for select
  using (true);

-- User profiles: users manage their own
create policy "Users can manage their own profile"
  on user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Saved scholarships: users manage their own
create policy "Users can manage their own saved scholarships"
  on saved_scholarships for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
