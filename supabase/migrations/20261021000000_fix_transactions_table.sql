-- Reconcile the `transactions` table with the canonical schema used by the
-- application.
--
-- Background
-- ----------
-- The table in the live project was created by hand in the Supabase dashboard
-- SQL editor, not by 20240101000000_create_transactions_table.sql. Because
-- that migration uses `create table if not exists`, it was a silent no-op and
-- the two schemas diverged:
--
--   live table                          migration file
--   -------------------------------    -------------------------------
--   id uuid primary key                id bigint, part of a composite pk
--   transaction_date date              date text
--   (no type / confidence / flags)     type / confidence / flags present
--   (no source / created_at)           (no source / created_at)
--
-- The application expects a row to look like this (see src/components/Dashboard.jsx
-- and src/utils/helpers.js):
--
--   { id, date, description, category, amount, type, confidence, flags }
--
-- so the `id` must be numeric (every sample/mock transaction in the app uses
-- numeric ids) and the row must carry `type`/`flags`/`confidence`.
--
-- The table is empty, so it is safe to rebuild it. The rebuild is guarded so
-- that it refuses to run against a table that has data.

do $$
declare
  row_count bigint;
begin
  select count(*) into row_count from public.transactions;

  if row_count > 0 then
    raise exception
      'public.transactions contains % rows -- refusing to rebuild it. Write a data migration first.', row_count;
  end if;

  -- Rebuild onto the canonical shape. Dropping the table also drops the
  -- legacy policies, which are recreated below.
  drop table if exists public.transactions;

  create table public.transactions (
    id          bigint       not null,
    user_id     uuid         not null references auth.users (id) on delete cascade,
    date        text         not null,
    description text         not null,
    category    text,
    amount      numeric      not null,
    type        text         not null default 'debit',
    confidence  numeric      not null default 0,
    flags       text[]       not null default '{}',
    source      text         not null default 'csv',
    created_at  timestamptz  not null default now(),
    primary key (user_id, id)
  );

  comment on table public.transactions is
    'One row per scanned transaction, owned by the authenticated user.';
  comment on column public.transactions.id is
    'Row id. App-generated ids are deterministic 36-bit hashes; the transactions_id_seq sequence supplies a fallback.';
  comment on column public.transactions.amount is
    'Always an absolute value. Direction is carried by the `type` column.';
end $$;

-- ---------------------------------------------------------------------------
-- Fallback id sequence
-- ---------------------------------------------------------------------------
-- App-generated ids are deterministic 36-bit hashes in [1, 2^36) -- see
-- `stableTransactionId` in src/utils/helpers.js and the mirrored helper in
-- supabase/functions/parse-statement/index.ts.
--
-- The sequence starts at 10^15 so sequence-assigned ids can never collide
-- with hash ids (< 6.9e10) or with Date.now()-based ids (~1.8e12).
-- 10^15 is still safely below Number.MAX_SAFE_INTEGER (2^53 ~= 9.0e15).
create sequence if not exists public.transactions_id_seq;

alter table public.transactions
  alter column id set default nextval('public.transactions_id_seq');

select setval('public.transactions_id_seq', 1000000000000000, false);

alter sequence public.transactions_id_seq owned by public.transactions.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Enable RLS (a fresh table has it off).
alter table public.transactions enable row level security;

-- Drop every policy that has existed on this table so far, including the two
-- that were created by hand and the two created by the earlier migration.
-- This keeps the policy set idempotent no matter which migration ran where.
drop policy if exists "Users can only view their own transactions" on public.transactions;
drop policy if exists "Users can insert their own transactions" on public.transactions;
drop policy if exists "Authenticated users can read own transactions" on public.transactions;
drop policy if exists "Authenticated users can write own transactions" on public.transactions;
drop policy if exists "Authenticated users can manage own transactions" on public.transactions;

-- A single FOR ALL policy covers SELECT, INSERT, UPDATE and DELETE, and is
-- scoped to the `authenticated` role so anonymous requests cannot match.
create policy "Authenticated users can manage own transactions"
  on public.transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
