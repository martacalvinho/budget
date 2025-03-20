-- Drop the existing view if it exists
DROP VIEW IF EXISTS users;

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
