-- Create tenants table with RLS policies
-- Execute this SQL in Supabase SQL Editor

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  tenant VARCHAR(100) NOT NULL UNIQUE,
  usuario VARCHAR(255),
  password TEXT,
  shared BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_shared ON tenants(shared);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own and shared tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can delete own tenants" ON tenants;

-- SELECT: Users see their own tenants + shared tenants, admins see all
CREATE POLICY "Users can view own and shared tenants"
  ON tenants
  FOR SELECT
  USING (
    -- Admin users see all
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    -- Or users see their own tenants
    auth.uid() = owner_id
    OR
    -- Or users see shared tenants
    shared = true
  );

-- INSERT: Only authenticated users can create tenants
CREATE POLICY "Users can create tenants"
  ON tenants
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only owners or admins can update
CREATE POLICY "Users can update own tenants"
  ON tenants
  FOR UPDATE
  USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = owner_id
  )
  WITH CHECK (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = owner_id
  );

-- DELETE: Only owners or admins can delete
CREATE POLICY "Users can delete own tenants"
  ON tenants
  FOR DELETE
  USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = owner_id
  );
