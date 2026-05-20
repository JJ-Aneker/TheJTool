-- Anthropic API Usage Tracking Table
-- Run this SQL in Supabase SQL editor to create the table and RLS policies

CREATE TABLE IF NOT EXISTS anthropic_usage (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  module VARCHAR(50),
  model VARCHAR(50),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10,6)
);

-- Enable Row Level Security
ALTER TABLE anthropic_usage ENABLE ROW LEVEL SECURITY;

-- Service role (backend) can always insert usage records
CREATE POLICY "Service role can insert usage" ON anthropic_usage
  FOR INSERT WITH CHECK (true);

-- Only admins can read usage data
CREATE POLICY "Admins can read usage" ON anthropic_usage
  FOR SELECT USING (
    COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
  );

-- Create index for efficient queries
CREATE INDEX idx_anthropic_usage_timestamp ON anthropic_usage(timestamp DESC);
CREATE INDEX idx_anthropic_usage_user_id ON anthropic_usage(user_id);
CREATE INDEX idx_anthropic_usage_module ON anthropic_usage(module);
