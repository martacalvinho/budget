-- First drop the view if it exists
DROP VIEW IF EXISTS users;

-- Drop the existing user_profiles table if it exists
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create the user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id),
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Adult', 'Child')),
    monthly_income NUMERIC DEFAULT 0,
    card_number VARCHAR(4),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own profiles and profiles they own
CREATE POLICY "Users can view their own profiles and ones they own"
    ON user_profiles FOR SELECT
    USING (auth.uid() = auth_user_id OR auth.uid() = owner_id);

-- Policy to allow users to insert their own profiles
CREATE POLICY "Users can insert their own profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id AND auth.uid() = owner_id);

-- Policy to allow users to update their own profiles and ones they own
CREATE POLICY "Users can update their own profiles and ones they own"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = owner_id);

-- Policy to allow users to delete profiles they own
CREATE POLICY "Users can delete profiles they own"
    ON user_profiles FOR DELETE
    USING (auth.uid() = owner_id);

-- Create the users view that combines user_profiles with auth.users
CREATE OR REPLACE VIEW users AS
SELECT 
    up.id,
    up.auth_user_id,
    up.owner_id,
    au.email,
    up.name,
    up.type,
    up.monthly_income,
    up.card_number,
    up.created_at,
    up.updated_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.auth_user_id = au.id;

-- Grant appropriate permissions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Comment on view
COMMENT ON VIEW users IS 'Vista combinada de perfis de utilizadores com informações de autenticação';

-- Comments on columns
COMMENT ON COLUMN users.id IS 'ID único do perfil';
COMMENT ON COLUMN users.auth_user_id IS 'ID do utilizador na tabela auth.users';
COMMENT ON COLUMN users.owner_id IS 'ID do proprietário do perfil';
COMMENT ON COLUMN users.email IS 'Email do utilizador';
COMMENT ON COLUMN users.name IS 'Nome do utilizador';
COMMENT ON COLUMN users.type IS 'Tipo de utilizador (Adulto/Criança)';
COMMENT ON COLUMN users.monthly_income IS 'Rendimento mensal';
COMMENT ON COLUMN users.card_number IS 'Número do cartão (últimos 4 dígitos)';
COMMENT ON COLUMN users.created_at IS 'Data de criação';
COMMENT ON COLUMN users.updated_at IS 'Data da última atualização';

-- Create the function for inserting profiles
CREATE OR REPLACE FUNCTION insert_user_profile(
    p_name TEXT,
    p_type TEXT DEFAULT 'Adult',
    p_monthly_income NUMERIC DEFAULT 0,
    p_card_number TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- Get the current authenticated user
    v_auth_user_id := auth.uid();
    
    -- Ensure user is authenticated
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;
    
    -- Validate required fields
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'Nome é obrigatório';
    END IF;
    
    -- Insert the user profile with validated data
    INSERT INTO public.user_profiles (
        auth_user_id,
        owner_id,
        name,
        type,
        monthly_income,
        card_number,
        created_at,
        updated_at
    ) VALUES (
        v_auth_user_id,
        v_auth_user_id,
        trim(p_name),
        COALESCE(p_type, 'Adult'),
        COALESCE(p_monthly_income, 0),
        NULLIF(trim(p_card_number), ''),
        NOW(),
        NOW()
    ) RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
EXCEPTION
    WHEN others THEN
        -- Translate common errors to user-friendly messages
        RAISE EXCEPTION 'Erro ao criar perfil: %', SQLERRM;
END;
$$;
