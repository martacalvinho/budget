-- Drop the function if it exists
DROP FUNCTION IF EXISTS insert_user_profile;

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
    
    -- Validate type
    IF p_type NOT IN ('Adult', 'Child') THEN
        RAISE EXCEPTION 'Tipo deve ser Adulto ou Criança';
    END IF;
    
    -- Validate monthly income
    IF p_monthly_income < 0 THEN
        RAISE EXCEPTION 'Rendimento mensal não pode ser negativo';
    END IF;
    
    -- Validate card number format if provided
    IF p_card_number IS NOT NULL AND p_card_number !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'Número do cartão deve conter exatamente 4 dígitos';
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
        p_type,
        COALESCE(p_monthly_income, 0),
        p_card_number,
        NOW(),
        NOW()
    ) RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
EXCEPTION
    WHEN others THEN
        -- Translate common errors to user-friendly messages in Portuguese
        CASE SQLERRM
            WHEN 'check_violation' THEN
                RAISE EXCEPTION 'Tipo de utilizador inválido';
            WHEN 'not_null_violation' THEN
                RAISE EXCEPTION 'Todos os campos obrigatórios devem ser preenchidos';
            ELSE
                RAISE EXCEPTION 'Erro ao criar perfil: %', SQLERRM;
        END CASE;
END;
$$;
