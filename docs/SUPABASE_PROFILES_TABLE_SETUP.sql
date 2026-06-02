-- Create profiles table with automatic user profile creation
-- This ensures that whenever a user signs up, a profile is automatically created

-- 1. CREATE THE PROFILES TABLE (if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  surname TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal TEXT,
  role TEXT DEFAULT 'user',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 5. CREATE HELPER FUNCTION (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 6. CREATE RLS POLICIES
-- SELECT: Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_user_admin()
  );

-- INSERT: Authenticated users can create profile (for signup)
CREATE POLICY "Authenticated users can create profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own, admins can update all
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_user_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_user_admin());

-- DELETE: Admins only
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  USING (public.is_user_admin());

-- 7. CREATE FUNCTION TO HANDLE NEW USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, approved, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    FALSE,  -- New users need admin approval by default
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 8. CREATE TRIGGER TO CALL FUNCTION ON NEW USER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. VERIFY SETUP
-- After running this, test with:
-- SELECT * FROM profiles;
-- Should show an empty table ready for new users
