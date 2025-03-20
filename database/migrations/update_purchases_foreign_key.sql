-- First, store all the existing data in temporary tables
CREATE TEMP TABLE temp_purchases AS SELECT * FROM purchases;
CREATE TEMP TABLE temp_shared_expenses AS SELECT * FROM shared_expenses;
CREATE TEMP TABLE temp_transaction_tags AS SELECT * FROM transaction_tags;

-- Drop the dependent tables first
DROP TABLE IF EXISTS transaction_tags;
DROP TABLE IF EXISTS shared_expenses;

-- Now we can safely drop and recreate the purchases table
DROP TABLE purchases;

-- Recreate the purchases table with the correct foreign key
CREATE TABLE purchases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    category text NOT NULL,
    description text,
    date date NOT NULL,
    total_amount numeric,
    split_between integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Copy the old data to the new purchases table, mapping the user IDs
INSERT INTO purchases (id, user_id, amount, category, description, date, total_amount, split_between, created_at, updated_at)
SELECT 
    tp.id,
    up.id as user_id,
    tp.amount,
    tp.category,
    tp.description,
    tp.date,
    tp.total_amount,
    tp.split_between,
    tp.created_at,
    tp.updated_at
FROM temp_purchases tp
JOIN user_profiles up ON tp.user_id = up.auth_user_id;

-- Recreate the shared_expenses table
CREATE TABLE shared_expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Copy the old data to the new shared_expenses table, mapping the user IDs
INSERT INTO shared_expenses (id, purchase_id, user_id, amount, created_at, updated_at)
SELECT 
    tse.id,
    tse.purchase_id,
    up.id as user_id,
    tse.amount,
    tse.created_at,
    tse.updated_at
FROM temp_shared_expenses tse
JOIN user_profiles up ON tse.user_id = up.auth_user_id;

-- Recreate the transaction_tags table
CREATE TABLE transaction_tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Copy the old data to the new transaction_tags table
INSERT INTO transaction_tags (id, transaction_id, tag, created_at, updated_at)
SELECT 
    id,
    transaction_id,
    tag,
    created_at,
    updated_at
FROM temp_transaction_tags;

-- Drop the temporary tables
DROP TABLE temp_purchases;
DROP TABLE temp_shared_expenses;
DROP TABLE temp_transaction_tags;

-- Enable RLS and set up policies for all tables

-- Purchases table policies
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert purchases for profiles they own" ON purchases;
DROP POLICY IF EXISTS "Users can update purchases for profiles they own" ON purchases;
DROP POLICY IF EXISTS "Users can delete purchases for profiles they own" ON purchases;

CREATE POLICY "Users can view their own purchases"
    ON purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = purchases.user_id
            AND (up.auth_user_id = auth.uid() OR up.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert purchases for profiles they own"
    ON purchases FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = purchases.user_id
            AND (up.auth_user_id = auth.uid() OR up.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can update purchases for profiles they own"
    ON purchases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = purchases.user_id
            AND up.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete purchases for profiles they own"
    ON purchases FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = purchases.user_id
            AND up.owner_id = auth.uid()
        )
    );

-- Shared expenses table policies
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared expenses" ON shared_expenses;
DROP POLICY IF EXISTS "Users can manage shared expenses they created" ON shared_expenses;

CREATE POLICY "Users can view shared expenses"
    ON shared_expenses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = shared_expenses.user_id
            AND (up.auth_user_id = auth.uid() OR up.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage shared expenses they created"
    ON shared_expenses
    USING (
        EXISTS (
            SELECT 1 FROM purchases p
            JOIN user_profiles up ON up.id = p.user_id
            WHERE p.id = shared_expenses.purchase_id
            AND up.owner_id = auth.uid()
        )
    );

-- Transaction tags table policies
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transaction tags" ON transaction_tags;
DROP POLICY IF EXISTS "Users can manage their own transaction tags" ON transaction_tags;

CREATE POLICY "Users can view transaction tags"
    ON transaction_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM purchases p
            JOIN user_profiles up ON up.id = p.user_id
            WHERE p.id = transaction_tags.transaction_id
            AND (up.auth_user_id = auth.uid() OR up.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own transaction tags"
    ON transaction_tags
    USING (
        EXISTS (
            SELECT 1 FROM purchases p
            JOIN user_profiles up ON up.id = p.user_id
            WHERE p.id = transaction_tags.transaction_id
            AND up.owner_id = auth.uid()
        )
    );

-- Comments in Portuguese
COMMENT ON TABLE purchases IS 'Registo de compras dos utilizadores';
COMMENT ON COLUMN purchases.user_id IS 'ID do perfil do utilizador';
COMMENT ON COLUMN purchases.amount IS 'Montante da compra';
COMMENT ON COLUMN purchases.category IS 'Categoria da compra';
COMMENT ON COLUMN purchases.description IS 'Descrição da compra';
COMMENT ON COLUMN purchases.date IS 'Data da compra';
COMMENT ON COLUMN purchases.total_amount IS 'Montante total da compra (se dividida)';
COMMENT ON COLUMN purchases.split_between IS 'Número de pessoas entre as quais a compra é dividida';
COMMENT ON COLUMN purchases.created_at IS 'Data de criação do registo';
