-- Migration: Dashboard Real Data Tables
-- Description: Creates tables for report executions, generated documents, and activity log
-- Date: 2026-06-12

-- ============================================
-- 1. GENERATED DOCUMENTS (AI-generated docs)
-- ============================================
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'EFDT', 'Budget', 'Requirements', 'Commercial', 'CR'
  title VARCHAR(255) NOT NULL,
  pages INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed', -- 'generating', 'completed', 'failed'
  file_path TEXT, -- Optional: S3/storage path if we save files
  metadata JSONB, -- Additional data: prompt used, model, etc.
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_generated_documents_user_id ON generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_created_at ON generated_documents(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_documents_type ON generated_documents(document_type);

-- RLS Policies
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated documents"
  ON generated_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated documents"
  ON generated_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated documents"
  ON generated_documents FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. REPORT EXECUTIONS (Therefore Reporter)
-- ============================================
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_name VARCHAR(255) NOT NULL,
  report_name VARCHAR(255) NOT NULL, -- User-friendly name or identifier
  category_no INTEGER NOT NULL,
  category_name VARCHAR(255), -- Cached for display
  condition TEXT, -- Search condition used
  result_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'error', 'partial'
  error_message TEXT,
  execution_time_ms INTEGER, -- Performance metric
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_executions_user_id ON report_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_at ON report_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_executions_tenant ON report_executions(tenant_name);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);

-- RLS Policies
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report executions"
  ON report_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report executions"
  ON report_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. ACTIVITY LOG (User activity timeline)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255), -- Cached username for display
  action_type VARCHAR(100) NOT NULL, -- 'report_executed', 'eform_created', 'category_created', 'document_generated'
  action_description TEXT NOT NULL, -- Human-readable: "ejecutó report 'Facturas Q1'"
  entity_type VARCHAR(50), -- 'report', 'eform', 'category', 'document'
  entity_id VARCHAR(255), -- ID of the entity (UUID or number)
  metadata JSONB, -- Additional context data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON activity_log(action_type);

-- RLS Policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all activity logs"
  ON activity_log FOR SELECT
  USING (true); -- All users can see activity (it's a shared timeline)

CREATE POLICY "Users can insert their own activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. CLEANUP FUNCTION (Auto-delete old logs)
-- ============================================
-- Function to clean up old logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM report_executions WHERE executed_at < NOW() - INTERVAL '30 days';
  DELETE FROM activity_log WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup weekly
-- (Requires pg_cron extension - enable in Supabase if needed)
-- SELECT cron.schedule('cleanup-old-logs', '0 2 * * 0', 'SELECT cleanup_old_logs();');

-- ============================================
-- 5. HELPER VIEWS (Optional but useful)
-- ============================================

-- View: Recent activity (last 50 events)
CREATE OR REPLACE VIEW recent_activity AS
SELECT
  id,
  user_name,
  action_description,
  action_type,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) AS seconds_ago
FROM activity_log
ORDER BY created_at DESC
LIMIT 50;

-- View: Report stats by tenant
CREATE OR REPLACE VIEW report_stats_by_tenant AS
SELECT
  tenant_name,
  COUNT(*) as total_executions,
  SUM(result_count) as total_documents,
  AVG(execution_time_ms) as avg_execution_time_ms,
  MAX(executed_at) as last_execution
FROM report_executions
WHERE status = 'success'
GROUP BY tenant_name;

-- View: Document generation stats
CREATE OR REPLACE VIEW document_generation_stats AS
SELECT
  document_type,
  COUNT(*) as total_generated,
  SUM(pages) as total_pages,
  AVG(pages) as avg_pages,
  MAX(generated_at) as last_generated
FROM generated_documents
WHERE status = 'completed'
GROUP BY document_type;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Created tables:';
  RAISE NOTICE '   - generated_documents';
  RAISE NOTICE '   - report_executions';
  RAISE NOTICE '   - activity_log';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '📈 Helper views created for analytics';
  RAISE NOTICE '🧹 Cleanup function created: cleanup_old_logs()';
END $$;
