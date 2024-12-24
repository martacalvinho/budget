/*
  # Fix Email Constraint for Users Table

  1. Changes
    - Drop existing email constraint
    - Add new constraint that only enforces uniqueness for non-null emails
    - Update table structure to better handle optional emails

  2. Security
    - Maintains data integrity
    - Allows null/empty emails
    - Prevents duplicate emails when provided
*/

-- Drop existing email constraint
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_email_unique;

-- Add new constraint that only enforces uniqueness for non-null emails
ALTER TABLE users
  ADD CONSTRAINT users_email_unique 
  UNIQUE (email)
  DEFERRABLE INITIALLY DEFERRED;

-- Add check constraint to ensure email is either null or valid
ALTER TABLE users
  ADD CONSTRAINT users_email_check
  CHECK (
    email IS NULL OR 
    email = '' OR 
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Update existing records with empty emails to NULL
UPDATE users 
SET email = NULL 
WHERE email = '';