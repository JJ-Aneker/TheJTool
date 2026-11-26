-- RFP Analyzer Tables

-- 1. Tabla rfp_analyses (almacena cada RFP analizada)
CREATE TABLE IF NOT EXISTS rfp_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  files_urls JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Viabilidad
  viability TEXT CHECK (viability IN ('alta', 'media', 'baja')),
  viability_reason TEXT,

  -- Plazos
  deadlines JSONB DEFAULT '{}'::jsonb,

  -- Riesgos
  risks JSONB DEFAULT '[]'::jsonb,

  -- Requisitos técnicos
  technical_requirements JSONB DEFAULT '[]'::jsonb,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_rfp_analyses_user_id ON rfp_analyses(user_id);
CREATE INDEX idx_rfp_analyses_created_at ON rfp_analyses(created_at DESC);

-- RLS Policies
ALTER TABLE rfp_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own RFP analyses"
  ON rfp_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RFP analyses"
  ON rfp_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RFP analyses"
  ON rfp_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RFP analyses"
  ON rfp_analyses FOR DELETE
  USING (auth.uid() = user_id);


-- 2. Tabla rfp_sections (secciones de cada RFP con asignación a áreas)
CREATE TABLE IF NOT EXISTS rfp_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID NOT NULL REFERENCES rfp_analyses(id) ON DELETE CASCADE,

  section_name TEXT NOT NULL,
  area TEXT NOT NULL, -- Comercial, Técnica, Legal, Marketing, Seguridad IT / GDPR, Medio Ambiente, Operaciones, Otra
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  priority TEXT CHECK (priority IN ('critical', 'optional')) DEFAULT 'optional',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',

  order_index INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_rfp_sections_rfp_id ON rfp_sections(rfp_id);
CREATE INDEX idx_rfp_sections_responsible ON rfp_sections(responsible_user_id);
CREATE INDEX idx_rfp_sections_order ON rfp_sections(rfp_id, order_index);

-- RLS Policies
ALTER TABLE rfp_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sections of their RFPs"
  ON rfp_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rfp_analyses
      WHERE rfp_analyses.id = rfp_sections.rfp_id
      AND rfp_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sections for their RFPs"
  ON rfp_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rfp_analyses
      WHERE rfp_analyses.id = rfp_sections.rfp_id
      AND rfp_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sections of their RFPs"
  ON rfp_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rfp_analyses
      WHERE rfp_analyses.id = rfp_sections.rfp_id
      AND rfp_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sections of their RFPs"
  ON rfp_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rfp_analyses
      WHERE rfp_analyses.id = rfp_sections.rfp_id
      AND rfp_analyses.user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rfp_analyses_updated_at
  BEFORE UPDATE ON rfp_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfp_sections_updated_at
  BEFORE UPDATE ON rfp_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
