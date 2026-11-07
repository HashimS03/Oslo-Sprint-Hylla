-- Hylla lagrer hele lagerets tilstand som én JSON-rad per lager.
-- Kjør dette i Supabase SQL Editor, og sett SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY.
create table if not exists hylla_state (
  id text primary key,
  data jsonb not null,
  oppdatert timestamptz not null default now()
);

-- Bare serveren (service role) skal lese og skrive.
alter table hylla_state enable row level security;
