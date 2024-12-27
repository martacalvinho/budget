-- Function to check if a user has access to another user's data
create or replace function public.has_access_to_user(target_user_id uuid)
returns boolean as $$
begin
  -- Check if the user is the owner or has been granted access
  return 
    auth.uid() = target_user_id or
    exists (
      select 1 
      from public.shared_users 
      where (owner_id = target_user_id and shared_with_id = auth.uid()) or
            (owner_id = target_user_id and shared_with_email = auth.email())
    );
end;
$$ language plpgsql security definer;

-- Update policies for yearly_budgets table
drop policy if exists "Users can view their own yearly budgets" on yearly_budgets;
create policy "Users can view and edit shared yearly budgets"
  on yearly_budgets
  for all
  using (has_access_to_user(user_id))
  with check (has_access_to_user(user_id));

-- Update policies for purchases table
drop policy if exists "Users can view their own purchases" on purchases;
create policy "Users can view and edit shared purchases"
  on purchases
  for all
  using (has_access_to_user(user_id))
  with check (has_access_to_user(user_id));

-- Add user_id column to tables that don't have it
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
                where table_name = 'yearly_budgets' and column_name = 'user_id') then
    alter table yearly_budgets add column user_id uuid references auth.users(id);
    update yearly_budgets set user_id = (select id from auth.users limit 1);
    alter table yearly_budgets alter column user_id set not null;
  end if;
end $$;
