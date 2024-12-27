-- Create savings accounts table
create table if not exists savings_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  type text not null, -- 'bank', 'crypto', etc.
  currency text not null default 'EUR',
  balance decimal not null default 0,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Create savings goals table
create table if not exists savings_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  target_amount decimal not null,
  current_amount decimal not null default 0,
  target_date date,
  category text not null, -- 'wedding', 'travel', etc.
  status text not null default 'in_progress', -- 'in_progress', 'completed', 'cancelled'
  created_at timestamp with time zone default now(),
  last_updated timestamp with time zone default now()
);

-- Create savings history table
create table if not exists savings_history (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references savings_accounts(id),
  user_id uuid references auth.users(id) not null default auth.uid(),
  balance decimal not null,
  recorded_at timestamp with time zone default now()
);

-- Add RLS policies
alter table savings_accounts enable row level security;
alter table savings_goals enable row level security;
alter table savings_history enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own savings accounts" on savings_accounts;
drop policy if exists "Users can insert their own savings accounts" on savings_accounts;
drop policy if exists "Users can update their own savings accounts" on savings_accounts;
drop policy if exists "Users can view their own savings goals" on savings_goals;
drop policy if exists "Users can insert their own savings goals" on savings_goals;
drop policy if exists "Users can update their own savings goals" on savings_goals;
drop policy if exists "Users can view their own savings history" on savings_history;
drop policy if exists "Users can insert their own savings history" on savings_history;

-- Create new policies
create policy "Users can view their own savings accounts"
  on savings_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own savings accounts"
  on savings_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own savings accounts"
  on savings_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own savings accounts"
  on savings_accounts for delete
  using (auth.uid() = user_id);

create policy "Users can view their own savings goals"
  on savings_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own savings goals"
  on savings_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own savings goals"
  on savings_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own savings goals"
  on savings_goals for delete
  using (auth.uid() = user_id);

create policy "Users can view their own savings history"
  on savings_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own savings history"
  on savings_history for insert
  with check (auth.uid() = user_id);

-- Function to record savings history
create or replace function record_savings_history()
returns trigger as $$
begin
  insert into savings_history (account_id, user_id, balance)
  values (NEW.id, NEW.user_id, NEW.balance);
  return NEW;
end;
$$ language plpgsql;

-- Trigger to record history on balance updates
drop trigger if exists record_savings_history_trigger on savings_accounts;
create trigger record_savings_history_trigger
after insert or update of balance on savings_accounts
for each row
execute function record_savings_history();
