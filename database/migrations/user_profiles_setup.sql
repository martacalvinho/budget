-- Drop existing user_profiles table if it exists
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create a fresh user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Adult', 'Child')),
  monthly_income NUMERIC DEFAULT 0,
  card_number VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users view that combines user_profiles with auth.users
CREATE OR REPLACE VIEW public.users AS
SELECT
  up.id,
  au.email,
  up.name,
  up.type,
  up.monthly_income,
  up.card_number,
  up.created_at,
  up.updated_at
FROM public.user_profiles up
JOIN auth.users au ON up.auth_user_id = au.id;

-- Basic RLS policy for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy allowing users to view their own profiles or profiles they own
CREATE POLICY user_profiles_select_policy ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = auth_user_id OR 
    auth.uid() = owner_id
  );

-- Policy allowing users to insert profiles they own
CREATE POLICY user_profiles_insert_policy ON public.user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

-- Policy allowing users to update their own profiles
CREATE POLICY user_profiles_update_policy ON public.user_profiles
  FOR UPDATE USING (
    auth.uid() = auth_user_id OR
    auth.uid() = owner_id
  );
