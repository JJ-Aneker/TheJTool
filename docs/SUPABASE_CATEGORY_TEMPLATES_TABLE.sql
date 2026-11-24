-- Create category_templates table for storing Therefore™ category definitions
-- Execute this SQL in Supabase SQL Editor

-- Create table for storing category templates
CREATE TABLE IF NOT EXISTS category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  xml_definition TEXT NOT NULL,
  csv_data TEXT,
  compartido BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  template_id VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text
);

-- Create indexes for better query performance
CREATE INDEX idx_category_templates_created_by ON category_templates(created_by);
CREATE INDEX idx_category_templates_created_at ON category_templates(created_at DESC);
CREATE INDEX idx_category_templates_name ON category_templates(name);

-- Enable Row Level Security
ALTER TABLE category_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view category templates" ON category_templates;
DROP POLICY IF EXISTS "Users can create category templates" ON category_templates;
DROP POLICY IF EXISTS "Users can update category templates" ON category_templates;
DROP POLICY IF EXISTS "Users can delete category templates" ON category_templates;

-- SELECT: Users see their own + shared templates, admins see all
CREATE POLICY "Users can view category templates"
  ON category_templates
  FOR SELECT
  USING (
    -- Admin users see all
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    -- Or users see their own
    auth.uid() = created_by
    OR
    -- Or users see shared templates
    compartido = true
  );

-- INSERT: Only authenticated users can create
CREATE POLICY "Users can create category templates"
  ON category_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only creators (except admins can update any)
CREATE POLICY "Users can update category templates"
  ON category_templates
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
CREATE POLICY "Users can delete category templates"
  ON category_templates
  FOR DELETE
  USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR
    auth.uid() = created_by
  );
