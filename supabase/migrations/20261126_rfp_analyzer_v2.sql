-- RFP Analyzer v2: Estados, comentarios, y mejoras

-- 1. Añadir campo de estado a rfp_analyses
ALTER TABLE rfp_analyses
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('nueva', 'analizada', 'revisada', 'en_decision', 'archivada')) DEFAULT 'nueva';

-- 2. Añadir campo de cliente/organización
ALTER TABLE rfp_analyses
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- 3. Añadir campos de decisión
ALTER TABLE rfp_analyses
ADD COLUMN IF NOT EXISTS decision TEXT CHECK (decision IN ('go', 'no-go', 'pending')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS decision_reason TEXT,
ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ;

-- 4. Tabla de comentarios/notas
CREATE TABLE IF NOT EXISTS rfp_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID NOT NULL REFERENCES rfp_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES rfp_sections(id) ON DELETE CASCADE, -- NULL = comentario general

  comment TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rfp_analyses_status ON rfp_analyses(status);
CREATE INDEX IF NOT EXISTS idx_rfp_analyses_decision ON rfp_analyses(decision);
CREATE INDEX IF NOT EXISTS idx_rfp_comments_rfp_id ON rfp_comments(rfp_id);
CREATE INDEX IF NOT EXISTS idx_rfp_comments_user_id ON rfp_comments(user_id);

-- RLS Policies para rfp_comments
ALTER TABLE rfp_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments of their RFPs"
  ON rfp_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rfp_analyses
      WHERE rfp_analyses.id = rfp_comments.rfp_id
      AND rfp_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments on their RFPs"
  ON rfp_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rfp_analyses
      WHERE rfp_analyses.id = rfp_comments.rfp_id
      AND rfp_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON rfp_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON rfp_comments FOR DELETE
  USING (user_id = auth.uid());

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para rfp_analyses
DROP TRIGGER IF EXISTS update_rfp_analyses_updated_at ON rfp_analyses;
CREATE TRIGGER update_rfp_analyses_updated_at
  BEFORE UPDATE ON rfp_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para rfp_sections
DROP TRIGGER IF EXISTS update_rfp_sections_updated_at ON rfp_sections;
CREATE TRIGGER update_rfp_sections_updated_at
  BEFORE UPDATE ON rfp_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para rfp_comments
DROP TRIGGER IF EXISTS update_rfp_comments_updated_at ON rfp_comments;
CREATE TRIGGER update_rfp_comments_updated_at
  BEFORE UPDATE ON rfp_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Vista materializada para dashboard (opcional, para optimización futura)
CREATE OR REPLACE VIEW rfp_dashboard_stats AS
SELECT
  user_id,
  COUNT(*) as total_rfps,
  COUNT(*) FILTER (WHERE viability = 'alta') as viability_alta,
  COUNT(*) FILTER (WHERE viability = 'media') as viability_media,
  COUNT(*) FILTER (WHERE viability = 'baja') as viability_baja,
  COUNT(*) FILTER (WHERE status = 'nueva') as status_nueva,
  COUNT(*) FILTER (WHERE status = 'analizada') as status_analizada,
  COUNT(*) FILTER (WHERE status = 'revisada') as status_revisada,
  COUNT(*) FILTER (WHERE status = 'en_decision') as status_en_decision,
  COUNT(*) FILTER (WHERE status = 'archivada') as status_archivada,
  COUNT(*) FILTER (WHERE decision = 'go') as decision_go,
  COUNT(*) FILTER (WHERE decision = 'no-go') as decision_no_go
FROM rfp_analyses
GROUP BY user_id;

-- Comentarios para documentación
COMMENT ON COLUMN rfp_analyses.status IS 'Estado del ciclo de vida: nueva, analizada, revisada, en_decision, archivada';
COMMENT ON COLUMN rfp_analyses.decision IS 'Decisión final: go, no-go, pending';
COMMENT ON COLUMN rfp_analyses.client_name IS 'Nombre del cliente/organización que publica la RFP';
COMMENT ON TABLE rfp_comments IS 'Comentarios y notas sobre RFPs (general o por sección)';
