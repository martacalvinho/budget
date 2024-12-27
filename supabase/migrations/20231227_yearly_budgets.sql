-- Create categories table
create table if not exists public.categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    type text not null check (type in ('fixed', 'flexible', 'income')),
    user_id uuid references auth.users(id) not null default auth.uid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint categories_name_user_id_key unique (name, user_id)
);

-- Enable RLS on categories
alter table public.categories enable row level security;

-- Add RLS policies for categories
create policy "Users can view their own categories"
    on public.categories for select
    using (auth.uid() = user_id);

create policy "Users can insert their own categories"
    on public.categories for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own categories"
    on public.categories for update
    using (auth.uid() = user_id);

-- Create yearly budgets table
create table if not exists public.yearly_budgets (
    id uuid default gen_random_uuid() primary key,
    year text not null,
    month text not null,
    category_id uuid references public.categories(id) not null,
    amount numeric(10,2) not null,
    user_id uuid references auth.users(id) not null default auth.uid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Ensure we don't have duplicate entries for the same category in the same month/year
    constraint yearly_budgets_year_month_category_key unique (year, month, category_id)
);

-- Enable RLS on yearly budgets
alter table public.yearly_budgets enable row level security;

-- Add RLS policies for yearly budgets
create policy "Users can view their own yearly budgets"
    on public.yearly_budgets for select
    using (auth.uid() = user_id);

create policy "Users can insert their own yearly budgets"
    on public.yearly_budgets for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own yearly budgets"
    on public.yearly_budgets for update
    using (auth.uid() = user_id);
