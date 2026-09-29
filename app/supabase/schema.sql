-- Quadrille: shared leaderboard for multiplayer challenges.
-- Self-contained: only creates quadrille_* tables and functions, and does NOT require
-- changing the project's Auth settings, so it can live inside an existing project.
-- Players have no account: each device keeps a random player id + secret, and scores
-- are written only through quadrille_save_player(), which checks that secret.
-- Run once in the Supabase SQL editor.

create table if not exists public.quadrille_matches (
  code        text primary key check (code ~ '^[2-9A-HJ-NP-Z]{7}$'),
  games       text[] not null check (games <@ array['zip','queens','tango','patches'] and cardinality(games) between 1 and 4),
  rounds      int  not null check (rounds between 1 and 20),
  diff        int  not null check (diff between 0 and 2),
  scoring     text not null check (scoring in ('time','points')),
  host        text check (char_length(host) <= 20),
  created_at  timestamptz not null default now()
);

create table if not exists public.quadrille_players (
  code        text not null check (code ~ '^[2-9A-HJ-NP-Z]{7}$'),
  pid         uuid not null,
  name        text not null check (char_length(name) between 1 and 20),
  times       jsonb not null default '[]'::jsonb
              check (jsonb_typeof(times) = 'array' and jsonb_array_length(times) <= 20),
  updated_at  timestamptz not null default now(),
  primary key (code, pid)
);

-- Secrets live in their own table that no client role can read.
create table if not exists public.quadrille_player_secrets (
  pid          uuid primary key,
  secret_hash  text not null,
  created_at   timestamptz not null default now()
);

alter table public.quadrille_matches        enable row level security;
alter table public.quadrille_players        enable row level security;
alter table public.quadrille_player_secrets enable row level security;

-- Anyone with the app can read challenges and leaderboards; nobody writes the tables directly.
drop policy if exists quadrille_matches_read on public.quadrille_matches;
create policy quadrille_matches_read on public.quadrille_matches
  for select to anon, authenticated using (true);
drop policy if exists quadrille_players_read on public.quadrille_players;
create policy quadrille_players_read on public.quadrille_players
  for select to anon, authenticated using (true);

revoke all on public.quadrille_matches, public.quadrille_players, public.quadrille_player_secrets from anon, authenticated;
grant select on public.quadrille_matches, public.quadrille_players to anon, authenticated;

create or replace function public.quadrille_create_match(
  p_code text, p_games text[], p_rounds int, p_diff int, p_scoring text, p_host text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into quadrille_matches(code, games, rounds, diff, scoring, host)
  values (p_code, p_games, p_rounds, p_diff, p_scoring, left(coalesce(p_host, ''), 20))
  on conflict (code) do nothing;
end $$;

create or replace function public.quadrille_save_player(
  p_code text, p_pid uuid, p_secret text, p_name text, p_times jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  h text;
  stored text;
begin
  if p_secret is null or char_length(p_secret) < 24 or char_length(p_secret) > 128 then
    raise exception 'invalid secret' using errcode = '42501';
  end if;
  h := encode(sha256(convert_to(p_secret, 'UTF8')), 'hex');
  select secret_hash into stored from quadrille_player_secrets where pid = p_pid;
  if stored is null then
    insert into quadrille_player_secrets(pid, secret_hash) values (p_pid, h)
    on conflict (pid) do nothing;
    select secret_hash into stored from quadrille_player_secrets where pid = p_pid;
  end if;
  if stored <> h then
    raise exception 'not your player' using errcode = '42501';
  end if;
  insert into quadrille_players(code, pid, name, times, updated_at)
  values (p_code, p_pid, left(btrim(p_name), 20), coalesce(p_times, '[]'::jsonb), now())
  on conflict (code, pid) do update
    set name = excluded.name, times = excluded.times, updated_at = now();
end $$;

revoke all on function public.quadrille_create_match(text, text[], int, int, text, text) from public;
revoke all on function public.quadrille_save_player(text, uuid, text, text, jsonb) from public;
grant execute on function public.quadrille_create_match(text, text[], int, int, text, text) to anon, authenticated;
grant execute on function public.quadrille_save_player(text, uuid, text, text, jsonb) to anon, authenticated;

-- Live leaderboard updates.
do $$ begin
  alter publication supabase_realtime add table public.quadrille_players;
exception when duplicate_object then null; end $$;
