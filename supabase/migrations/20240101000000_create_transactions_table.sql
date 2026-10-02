-- Table: transactions
-- Stores scanned transactions coming from DemoUpload.
-- Each anonymous session owns its rows via user_id.

create table if not exists transactions (
  id bigint,
  user_id uuid references auth.users not null,
  date text,
  description text,
  category text,
  amount numeric,
  "type" text,
  confidence numeric default 0,
  flags text[] default '{}',
  primary key (user_id, id)
);

-- Row Level Security
alter table transactions enable row level security;

create policy "Authenticated users can read own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Authenticated users can write own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
