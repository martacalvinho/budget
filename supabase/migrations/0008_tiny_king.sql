-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read all purchases" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated users to insert purchases" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated users to update purchases" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated users to delete purchases" ON purchases;

-- Create new policies for purchases
CREATE POLICY "Allow authenticated users to read all purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update own purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete own purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);