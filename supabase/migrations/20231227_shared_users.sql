-- Create shared users table
create table if not exists public.shared_users (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) not null,
    shared_with_email text not null,
    shared_with_id uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(owner_id, shared_with_email)
);

-- Enable RLS
alter table public.shared_users enable row level security;

-- Create policies
create policy "Users can view their own shares and shares with them"
    on public.shared_users
    for select
    using (
        auth.uid() = owner_id or 
        auth.uid() = shared_with_id or 
        auth.email() = shared_with_email
    );

create policy "Users can create shares"
    on public.shared_users
    for insert
    with check (auth.uid() = owner_id);

create policy "Users can delete their own shares"
    on public.shared_users
    for delete
    using (auth.uid() = owner_id);

-- Create function to update shared_with_id when user signs up
create or replace function public.handle_shared_user_signup()
returns trigger as $$
begin
    -- Update any shared_users entries that were waiting for this email
    update public.shared_users
    set shared_with_id = new.id
    where shared_with_email = new.email
    and shared_with_id is null;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signups
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_shared_user_signup();
