-- Create reporter_profiles table for Therefore Reporter module
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reporter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reporter_profiles_user_id ON reporter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reporter_profiles_tenant_id ON reporter_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reporter_profiles_created_at ON reporter_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE reporter_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reporter profiles" ON reporter_profiles;
DROP POLICY IF EXISTS "Users can create reporter profiles" ON reporter_profiles;
DROP POLICY IF EXISTS "Users can update own reporter profiles" ON reporter_profiles;
DROP POLICY IF EXISTS "Users can delete own reporter profiles" ON reporter_profiles;

-- SELECT: Users see only their own profiles
CREATE POLICY "Users can view own reporter profiles"
  ON reporter_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Only authenticated users can create profiles
CREATE POLICY "Users can create reporter profiles"
  ON reporter_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owners can update
CREATE POLICY "Users can update own reporter profiles"
  ON reporter_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only owners can delete
CREATE POLICY "Users can delete own reporter profiles"
  ON reporter_profiles
  FOR DELETE
  USING (auth.uid() = user_id);
