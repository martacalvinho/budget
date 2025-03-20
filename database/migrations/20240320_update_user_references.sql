-- Update foreign key references in purchases table
ALTER TABLE purchases
    DROP CONSTRAINT IF EXISTS purchases_user_id_fkey,
    ADD CONSTRAINT purchases_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES user_profiles(id)
        ON DELETE CASCADE;

-- Update foreign key references in shared_expenses table
ALTER TABLE shared_expenses
    DROP CONSTRAINT IF EXISTS shared_expenses_purchase_id_fkey,
    ADD CONSTRAINT shared_expenses_purchase_id_fkey
        FOREIGN KEY (purchase_id)
        REFERENCES purchases(id)
        ON DELETE CASCADE;

-- Update foreign key references in transaction_tags table
ALTER TABLE transaction_tags
    DROP CONSTRAINT IF EXISTS transaction_tags_transaction_id_fkey,
    ADD CONSTRAINT transaction_tags_transaction_id_fkey
        FOREIGN KEY (transaction_id)
        REFERENCES purchases(id)
        ON DELETE CASCADE;

-- Update owner_id references to auth.users
ALTER TABLE purchases
    DROP CONSTRAINT IF EXISTS purchases_owner_id_fkey,
    ADD CONSTRAINT purchases_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

ALTER TABLE shared_expenses
    DROP CONSTRAINT IF EXISTS shared_expenses_owner_id_fkey,
    ADD CONSTRAINT shared_expenses_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

ALTER TABLE transaction_tags
    DROP CONSTRAINT IF EXISTS transaction_tags_owner_id_fkey,
    ADD CONSTRAINT transaction_tags_owner_id_fkey
        FOREIGN KEY (owner_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

-- Shared expenses policies
CREATE POLICY "Users can view shared expenses they are involved with" ON shared_expenses
    FOR SELECT
    USING (
        owner_id = auth.uid() OR 
        purchase_id IN (
            SELECT id FROM purchases 
            WHERE user_id IN (
                SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage shared expenses for their purchases" ON shared_expenses
    FOR ALL
    USING (
        owner_id = auth.uid()
    );

-- Transaction tags policies
CREATE POLICY "Users can view tags for their transactions" ON transaction_tags
    FOR SELECT
    USING (
        owner_id = auth.uid()
    );

CREATE POLICY "Users can manage tags for their transactions" ON transaction_tags
    FOR ALL
    USING (
        owner_id = auth.uid()
    );
