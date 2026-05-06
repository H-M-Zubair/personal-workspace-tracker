-- Workspace Tracker MVP schema + RLS
create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'Work' check (category in ('Work','Personal','Learning','Health','Other')),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  planned_hours int not null default 0 check (planned_hours >= 0),
  planned_minutes int not null default 0 check (planned_minutes between 0 and 59),
  work_days text[] not null default array['Mon'],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  resumed_at timestamptz,
  ended_at timestamptz,
  total_seconds int not null default 0,
  status text not null default 'running' check (status in ('running','paused','completed')),
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
alter table public.attendance enable row level security;
alter table public.timer_sessions enable row level security;

drop policy if exists "tasks_owner" on public.tasks;
create policy "tasks_owner" on public.tasks
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "attendance_owner" on public.attendance;
create policy "attendance_owner" on public.attendance
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "timer_sessions_owner" on public.timer_sessions;
create policy "timer_sessions_owner" on public.timer_sessions
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();
