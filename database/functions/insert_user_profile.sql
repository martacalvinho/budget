-- Drop the function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.insert_user_profile(text, text, numeric, text);

-- Create the function with proper error handling and validation
CREATE OR REPLACE FUNCTION public.insert_user_profile(
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
