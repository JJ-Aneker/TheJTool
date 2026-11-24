-- Fix RLS policies for reporter_profiles table to match eforms pattern
-- Execute in Supabase SQL Editor

-- Drop restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own reporter profiles" ON reporter_profiles;

-- Create new permissive SELECT policy
-- The app will handle filtering based on user_id
CREATE POLICY "Reporter profiles select all for filtering in app"
  ON reporter_profiles
  FOR SELECT
  USING (true);

-- Ensure other policies work correctly
DROP POLICY IF EXISTS "Users can create reporter profiles" ON reporter_profiles;
CREATE POLICY "Reporter profiles insert authenticated"
  ON reporter_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reporter profiles" ON reporter_profiles;
CREATE POLICY "Reporter profiles update owner"
  ON reporter_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reporter profiles" ON reporter_profiles;
CREATE POLICY "Reporter profiles delete owner"
  ON reporter_profiles
  FOR DELETE
  USING (auth.uid() = user_id);
