-- Create eforms table for storing created eForms
-- Execute this SQL in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS eforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add indexes for better query performance
  CONSTRAINT name_not_empty CHECK (length(name) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_eforms_created_by ON eforms(created_by);
CREATE INDEX IF NOT EXISTS idx_eforms_created_at ON eforms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eforms_name ON eforms(name);

-- Enable Row Level Security (RLS)
ALTER TABLE eforms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own eForms
CREATE POLICY "Users can view own eforms"
  ON eforms
  FOR SELECT
  USING (auth.uid() = created_by);

-- RLS Policy: Users can create eForms
CREATE POLICY "Users can create eforms"
  ON eforms
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policy: Users can update their own eForms
CREATE POLICY "Users can update own eforms"
  ON eforms
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- RLS Policy: Users can delete their own eForms
CREATE POLICY "Users can delete own eforms"
  ON eforms
  FOR DELETE
  USING (auth.uid() = created_by);

-- Grant permissions to authenticated users
GRANT ALL ON eforms TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
