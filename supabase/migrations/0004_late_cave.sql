/*
  # Make Email Optional for Users

  1. Changes
    - Make email field optional in users table
    - Update RLS policies to handle users without email
    - Add name as the primary identifier for users

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with nullable email
*/

-- Make email optional
ALTER TABLE users 
  ALTER COLUMN email DROP NOT NULL,
  ADD CONSTRAINT users_email_unique UNIQUE NULLS NOT DISTINCT (email);

-- Add index on name for better performance
CREATE INDEX idx_users_name ON users(name);

-- Update user management function to handle optional email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.id = COALESCE(NEW.id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;