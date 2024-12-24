-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;

-- Create new policies for purchases
CREATE POLICY "Allow authenticated users to read all purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_date 
ON purchases(user_id, date);