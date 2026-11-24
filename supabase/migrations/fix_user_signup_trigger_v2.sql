-- Fix v2: Improved trigger with better metadata reading
-- Also includes debug to check what's in raw_user_meta_data

-- 1. Drop and recreate the trigger function with improved metadata handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name text;
  v_surname text;
  v_phone text;
BEGIN
  -- Extract values from raw_user_meta_data with multiple fallback attempts
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'first_name',
    ''
  );

  v_surname := COALESCE(
    NEW.raw_user_meta_data->>'surname',
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'last_name',
    ''
  );

  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phoneNumber',
    NEW.raw_user_meta_data->>'phone_number',
    ''
  );

  -- Log what we're about to insert (for debugging)
  RAISE NOTICE 'Creating profile for user %: name=%, surname=%, phone=%',
    NEW.email, v_name, v_surname, v_phone;

  -- Insert new profile
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    surname,
    phone,
    role,
    approved,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_surname,
    v_phone,
    'user',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE WHEN EXCLUDED.name != '' THEN EXCLUDED.name ELSE profiles.name END,
    surname = CASE WHEN EXCLUDED.surname != '' THEN EXCLUDED.surname ELSE profiles.surname END,
    phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE profiles.phone END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger v2 created with improved metadata reading';
  RAISE NOTICE '📝 Now checks: name, firstName, first_name';
  RAISE NOTICE '📝 Now checks: surname, lastName, last_name';
  RAISE NOTICE '📝 Now checks: phone, phoneNumber, phone_number';
END $$;

-- 4. OPTIONAL: Test query to see what's in existing users' metadata
-- Uncomment to debug existing users:
-- SELECT
--   id,
--   email,
--   raw_user_meta_data,
--   raw_user_meta_data->>'name' as name,
--   raw_user_meta_data->>'surname' as surname,
--   raw_user_meta_data->>'phone' as phone
-- FROM auth.users
-- ORDER BY created_at DESC
-- LIMIT 5;
