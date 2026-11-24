-- Fix RLS policies for tenants table to match eforms pattern
-- Execute in Supabase SQL Editor

-- Drop restrictive SELECT policy
DROP POLICY IF EXISTS "Tenants visible if shared or owner or admin" ON tenants;

-- Create new permissive SELECT policy (like eforms)
-- The app will handle filtering based on compartido and owner_id
CREATE POLICY "Tenants select all for filtering in app"
  ON tenants
  FOR SELECT
  USING (true);

-- Ensure other policies work correctly
DROP POLICY IF EXISTS "Tenants creatable by authenticated" ON tenants;
CREATE POLICY "Tenants insert authenticated"
  ON tenants
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Tenants updatable by owner or admin" ON tenants;
CREATE POLICY "Tenants update owner or admin"
  ON tenants
  FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
  );

DROP POLICY IF EXISTS "Tenants deletable by owner or admin" ON tenants;
CREATE POLICY "Tenants delete owner or admin"
  ON tenants
  FOR DELETE
  USING (
    auth.uid() = owner_id
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
  );
