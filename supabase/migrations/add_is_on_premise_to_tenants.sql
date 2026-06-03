-- Add is_on_premise column to tenants table
-- This field indicates whether the Therefore instance is on-premise (true) or cloud (false)
-- On-premise instances should not include TenantName in the request headers

ALTER TABLE tenants
ADD COLUMN is_on_premise BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX idx_tenants_is_on_premise ON tenants(is_on_premise);
