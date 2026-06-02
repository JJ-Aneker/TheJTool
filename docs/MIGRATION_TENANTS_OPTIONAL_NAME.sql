-- Migration: Make tenant name optional for on-premise instances
-- Execute this SQL in Supabase SQL Editor

-- Remove UNIQUE constraint from tenant column
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_tenant_key;

-- Make tenant nullable
ALTER TABLE tenants
ALTER COLUMN tenant DROP NOT NULL,
ALTER COLUMN tenant SET DEFAULT NULL;
