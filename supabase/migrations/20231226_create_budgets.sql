-- Create budgets table
create table if not exists public.budgets (
    id uuid default gen_random_uuid() primary key,
    category text not null references categories(name) on delete cascade,
    amount numeric(10,2) not null default 0,
    type text not null check (type in ('fixed', 'flexible')),
    month text not null, -- Format: YYYY-MM
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Ensure only one budget per category per month
    unique(category, month)
);

-- Set up RLS policies
alter table public.budgets enable row level security;

create policy "Budgets are viewable by authenticated users"
    on public.budgets for select
    using (auth.role() = 'authenticated');

create policy "Budgets are insertable by authenticated users"
    on public.budgets for insert
    with check (auth.role() = 'authenticated');

create policy "Budgets are updatable by authenticated users"
    on public.budgets for update
    using (auth.role() = 'authenticated');

create policy "Budgets are deletable by authenticated users"
    on public.budgets for delete
    using (auth.role() = 'authenticated');
