-- Update eforms table to add form_id for duplicate control
-- Execute this SQL in Supabase SQL Editor

-- Add form_id column (unique identifier within user's forms)
ALTER TABLE eforms
ADD COLUMN form_id VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;

-- Create unique constraint per user
ALTER TABLE eforms
ADD CONSTRAINT unique_form_per_user UNIQUE(created_by, form_id);

-- Add is_admin field to user's metadata (optional, can be set in Auth)
-- This will be checked from user metadata in the app
