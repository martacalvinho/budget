/*
  # Fix User RLS Policies

  1. Changes
    - Update RLS policies for users table to allow proper user management
    - Allow authenticated users to create and manage users
    - Maintain security while enabling family finance management

  2. Security
    - Only authenticated users can manage users
    - Users can see all family members
    - Maintain data integrity with optional email
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;

-- Create new, more permissive policies for family finance management
CREATE POLICY "Allow authenticated users to read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update users"
  ON users FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete users"
  ON users FOR DELETE
  TO authenticated
  USING (true);