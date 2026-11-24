-- Fix: Auto-create profile on user signup using Database Trigger
-- This bypasses RLS issues during signup

-- 1. Drop existing trigger if exists (to recreate it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile using the auth.users data
  -- This runs as a database trigger, so it bypasses RLS
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
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user', -- Default role
    false,  -- Default: not approved
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicates

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger that fires when a user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure RLS policies allow users to read their own profile
-- (They don't need INSERT permission because the trigger handles it)

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: We do NOT create an INSERT policy for regular users
-- because the trigger handles profile creation automatically

-- 5. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger created: Profiles will be auto-created on user signup';
  RAISE NOTICE '✅ RLS policies updated: Users can read/update their own profile';
  RAISE NOTICE '⚠️  Note: Signup now creates profiles automatically via trigger';
END $$;
