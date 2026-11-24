-- Add compartido field to eforms table
-- Execute this SQL in Supabase SQL Editor

-- Add compartido column
ALTER TABLE eforms
ADD COLUMN compartido BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_eforms_compartido ON eforms(compartido);

-- Update RLS policies to support compartido and admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own eforms" ON eforms;
DROP POLICY IF EXISTS "Users can create eforms" ON eforms;
DROP POLICY IF EXISTS "Users can update own eforms" ON eforms;
DROP POLICY IF EXISTS "Users can delete own eforms" ON eforms;

-- New policies with compartido support

-- SELECT: Users see their own + shared forms, admins see all
CREATE POLICY "Users can view eforms"
  ON eforms
  FOR SELECT
  USING (
    -- Admin users see all
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    -- Or users see their own
    auth.uid() = created_by
    OR
    -- Or users see shared forms
    compartido = true
  );

-- INSERT: Only authenticated users
CREATE POLICY "Users can create eforms"
  ON eforms
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only creators (except admins can update any)
CREATE POLICY "Users can update eforms"
  ON eforms
  FOR UPDATE
  USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = created_by
  )
  WITH CHECK (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = created_by
  );

-- DELETE: Only creators (except admins can delete any)
CREATE POLICY "Users can delete eforms"
  ON eforms
  FOR DELETE
  USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = created_by
  );

-- Optional: Create a function to check if user is admin
-- You'll need to set 'is_admin' = true in the JWT custom claims in your auth provider
