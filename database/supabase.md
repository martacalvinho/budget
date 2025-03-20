# Supabase Database Schema

This document contains the complete database schema for the Budget application. It is automatically generated and should be updated whenever the schema changes.

## Tables

### user_profiles
This table stores user profile information.

**Columns:**
- id (uuid, NOT NULL, PRIMARY KEY, DEFAULT: gen_random_uuid())
- auth_user_id (uuid, NOT NULL): References auth.users(id)
- owner_id (uuid, NOT NULL): References auth.users(id)
- name (text, NOT NULL)
- type (text, NOT NULL)
- monthly_income (numeric, DEFAULT: 0)
- card_number (varchar)
- created_at (timestamptz, DEFAULT: now())
- updated_at (timestamptz, DEFAULT: now())

**RLS Policies:**
- Users can view profiles they own or are assigned to
- Users can insert profiles they own
- Users can update profiles they own
- Users can delete profiles they own

### purchases
This table stores purchase transactions.

**Columns:**
- id (uuid, NOT NULL, PRIMARY KEY, DEFAULT: gen_random_uuid())
- user_id (uuid, NOT NULL): References user_profiles(id)
- amount (numeric, NOT NULL)
- category (text, NOT NULL)
- description (text)
- date (date, NOT NULL)
- total_amount (numeric)
- split_between (integer)
- created_at (timestamptz, DEFAULT: now())
- updated_at (timestamptz, DEFAULT: now())

**RLS Policies:**
- Users can view purchases for profiles they own or are assigned to
- Users can insert purchases for profiles they own or are assigned to
- Users can update purchases for profiles they own
- Users can delete purchases for profiles they own

### shared_expenses
This table stores shared expense information.

**Columns:**
- id (uuid, NOT NULL, PRIMARY KEY, DEFAULT: gen_random_uuid())
- purchase_id (uuid, NOT NULL): References purchases(id)
- user_id (uuid, NOT NULL): References user_profiles(id)
- amount (numeric, NOT NULL)
- created_at (timestamptz, DEFAULT: now())
- updated_at (timestamptz, DEFAULT: now())

**RLS Policies:**
- Users can view shared expenses for profiles they own or are assigned to
- Users can manage shared expenses they created

### transaction_tags
This table stores tags for transactions.

**Columns:**
- id (uuid, NOT NULL, PRIMARY KEY, DEFAULT: gen_random_uuid())
- transaction_id (uuid, NOT NULL): References purchases(id)
- tag (text, NOT NULL)
- created_at (timestamptz, DEFAULT: now())
- updated_at (timestamptz, DEFAULT: now())

**RLS Policies:**
- Users can view tags for transactions they own or are assigned to
- Users can manage tags for transactions they own

### categories
This table stores expense categories.

**Columns:**
- id (uuid, NOT NULL, PRIMARY KEY, DEFAULT: gen_random_uuid())
- name (text, NOT NULL)
- type (text, NOT NULL): Either 'fixed' or 'flexible'
- created_at (timestamptz, DEFAULT: now())
- updated_at (timestamptz, DEFAULT: now())

**RLS Policies:**
- Users can view all categories
- Only authenticated users can manage categories

## Views

### users
This view combines user_profiles with auth.users.

**Columns:**
- id (uuid): From user_profiles
- auth_user_id (uuid): From user_profiles
- owner_id (uuid): From user_profiles
- email (text): From auth.users
- name (text): From user_profiles
- type (text): From user_profiles
- monthly_income (numeric): From user_profiles
- card_number (varchar): From user_profiles
- created_at (timestamptz): From user_profiles
- updated_at (timestamptz): From user_profiles

**Permissions:**
- SELECT granted to authenticated and anonymous users

## Functions

### insert_user_profile(p_name text, p_type text, p_monthly_income numeric, p_card_number text)
Inserts a new user profile with proper validation.

**Parameters:**
- p_name: User's name
- p_type: User type ('Adult' or 'Child')
- p_monthly_income: Monthly income amount
- p_card_number: Last 4 digits of card number (optional)

**Returns:** void

**Permissions:**
- Execute granted to authenticated users

## Notes
- All tables have Row Level Security (RLS) enabled
- Timestamps are handled automatically via triggers
- Foreign keys use CASCADE on delete
- The auth schema is managed by Supabase
