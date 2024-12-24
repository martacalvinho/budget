/*
  # Update household policies and indexes
  
  1. Add missing indexes for better performance
  2. Update RLS policies for enhanced security
  3. Add settings column for additional functionality
*/

-- Add indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_household_members') THEN
        CREATE INDEX idx_household_members ON household_members(user_id, household_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_shared_expenses_household') THEN
        CREATE INDEX idx_shared_expenses_household ON shared_expenses(household_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_debt_tracking_users') THEN
        CREATE INDEX idx_debt_tracking_users ON debt_tracking(from_user_id, to_user_id);
    END IF;
END $$;

-- Add settings column to households if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'households' AND column_name = 'settings'
    ) THEN
        ALTER TABLE households ADD COLUMN settings jsonb DEFAULT '{}';
    END IF;
END $$;

-- Drop existing policies to update them
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
DROP POLICY IF EXISTS "Users can manage households they own" ON households;
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Admins can manage household members" ON household_members;
DROP POLICY IF EXISTS "Users can view shared expenses in their households" ON shared_expenses;
DROP POLICY IF EXISTS "Users can manage shared expenses they created" ON shared_expenses;
DROP POLICY IF EXISTS "Users can view their debts" ON debt_tracking;
DROP POLICY IF EXISTS "Users can manage debts in their households" ON debt_tracking;

-- Create updated policies
CREATE POLICY "Users can view households they belong to"
  ON households FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = households.id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage households they own"
  ON households FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage household members"
  ON household_members FOR ALL USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view shared expenses in their households"
  ON shared_expenses FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = shared_expenses.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage shared expenses they created"
  ON shared_expenses FOR ALL USING (
    EXISTS (
      SELECT 1 FROM purchases p
      WHERE p.id = shared_expenses.purchase_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their debts"
  ON debt_tracking FOR SELECT USING (
    auth.uid() IN (from_user_id, to_user_id)
  );

CREATE POLICY "Users can manage debts in their households"
  ON debt_tracking FOR ALL USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = debt_tracking.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'admin')
    )
  );