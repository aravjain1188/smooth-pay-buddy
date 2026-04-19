-- Roles enum + table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text not null default 'Founder',
  coins integer not null default 100,
  is_pro boolean not null default false,
  specialization text not null default 'generic',
  high_score integer not null default 0,
  total_runs integer not null default 0,
  reports_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own display fields"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Game runs
create table public.game_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  mode text not null,
  specialization text not null,
  final_cash integer not null default 0,
  months_survived integer not null default 0,
  score integer not null default 0,
  bankrupt boolean not null default false,
  created_at timestamptz not null default now()
);

create index game_runs_score_idx on public.game_runs (score desc);
create index game_runs_user_idx on public.game_runs (user_id);

alter table public.game_runs enable row level security;

create policy "Users can view own runs"
  on public.game_runs for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own runs"
  on public.game_runs for insert to authenticated with check (auth.uid() = user_id);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments for select to authenticated using (auth.uid() = user_id);

-- Rank bonuses
create table public.rank_bonuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bonus_key text not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, bonus_key)
);

alter table public.rank_bonuses enable row level security;

create policy "Users can view own rank bonuses"
  on public.rank_bonuses for select to authenticated using (auth.uid() = user_id);

-- Helpers
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger payments_touch before update on public.payments
for each row execute function public.touch_updated_at();

-- Protect profile fields from client tampering, while allowing rank-bonus increases
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _allowed_increase boolean := false;
begin
  if NEW.coins > OLD.coins then
    select exists (
      select 1 from public.rank_bonuses
      where user_id = OLD.user_id
        and created_at >= now() - interval '5 seconds'
        and amount = (NEW.coins - OLD.coins)
    ) into _allowed_increase;
    if not _allowed_increase then
      NEW.coins := OLD.coins;
    end if;
  end if;
  NEW.is_pro := OLD.is_pro;
  NEW.high_score := OLD.high_score;
  NEW.reports_used := OLD.reports_used;
  NEW.total_runs := OLD.total_runs;
  NEW.updated_at := now();
  return NEW;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row
when (current_setting('role', true) = 'authenticated')
execute function public.protect_profile_fields();

-- Auto-create profile + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Founder')
  ) on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Public leaderboard via security-definer function
create or replace function public.get_leaderboard(_limit int default 50)
returns table (
  display_name text,
  mode text,
  specialization text,
  score int,
  months_survived int,
  final_cash int,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select display_name, mode, specialization, score, months_survived, final_cash, created_at
  from public.game_runs
  order by score desc
  limit greatest(1, least(_limit, 100));
$$;

grant execute on function public.get_leaderboard(int) to anon, authenticated;

-- Spend coins atomically
create or replace function public.spend_coins(_amount integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  _user_id uuid := auth.uid();
  _current integer;
begin
  if _user_id is null then raise exception 'Not authenticated'; end if;
  if _amount <= 0 then raise exception 'Invalid amount'; end if;
  select coins into _current from public.profiles where user_id = _user_id;
  if _current is null or _current < _amount then return false; end if;
  update public.profiles set coins = coins - _amount, updated_at = now() where user_id = _user_id;
  return true;
end;
$$;

-- Claim rank bonus
create or replace function public.claim_rank_bonus(_period text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _rank int;
  _bonus int;
  _key text;
  _exists boolean;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;

  if _period = 'all' then
    select rnk into _rank from (
      select user_id, rank() over (order by max(score) desc) as rnk
      from public.game_runs group by user_id
    ) t where user_id = _uid;
    _key := 'all_' || to_char(now(), 'YYYY-WW');
  elsif _period = 'daily' then
    select rnk into _rank from (
      select user_id, rank() over (order by max(score) desc) as rnk
      from public.game_runs
      where created_at >= date_trunc('day', now())
      group by user_id
    ) t where user_id = _uid;
    _key := 'daily_' || to_char(now(), 'YYYY-MM-DD');
  else
    raise exception 'Invalid period';
  end if;

  if _rank is null or _rank > 3 then
    return jsonb_build_object('success', false, 'reason', 'not_top_3');
  end if;

  select exists (select 1 from public.rank_bonuses where user_id = _uid and bonus_key = _key) into _exists;
  if _exists then
    return jsonb_build_object('success', false, 'reason', 'already_claimed');
  end if;

  _bonus := case _rank when 1 then 100 when 2 then 60 else 30 end;

  insert into public.rank_bonuses (user_id, bonus_key, amount) values (_uid, _key, _bonus);
  update public.profiles set coins = coins + _bonus, updated_at = now() where user_id = _uid;

  return jsonb_build_object('success', true, 'bonus', _bonus, 'rank', _rank);
end;
$$;