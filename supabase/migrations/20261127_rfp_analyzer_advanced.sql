-- RFP Analyzer Advanced Features
-- Nuevas tablas para funcionalidades avanzadas

-- ============================================================================
-- 1. TAGS PERSONALIZADOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT 'blue',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS rfp_tag_assignments (
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES rfp_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (rfp_id, tag_id)
);

-- ============================================================================
-- 2. REQUISITOS EXTRAÍDOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
  requirement_text TEXT NOT NULL,
  category VARCHAR(50), -- 'Core', 'Autenticación', 'Web', 'Integración', etc.
  therefore_coverage VARCHAR(20) CHECK (therefore_coverage IN ('nativo', 'desarrollo', 'integracion', 'no_aplica')),
  effort_level VARCHAR(20) CHECK (effort_level IN ('bajo', 'medio', 'alto', 'muy_alto')),
  notes TEXT,
  priority INT DEFAULT 0, -- orden de importancia
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfp_requirements_rfp ON rfp_requirements(rfp_id);

-- ============================================================================
-- 3. BIBLIOTECA DE RESPUESTAS REUTILIZABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_answer_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_category VARCHAR(50), -- 'Técnico', 'Legal', 'Comercial', 'Seguridad', etc.
  answer_template TEXT NOT NULL,
  keywords TEXT[], -- para búsqueda
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answer_library_keywords ON rfp_answer_library USING GIN(keywords);

-- Respuestas generadas para RFPs específicas
CREATE TABLE IF NOT EXISTS rfp_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
  library_answer_id UUID REFERENCES rfp_answer_library(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  section VARCHAR(100), -- sección del pliego donde se usa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfp_answers_rfp ON rfp_answers(rfp_id);

-- ============================================================================
-- 4. SISTEMA DE SCORING
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_scoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE UNIQUE,

  -- Componentes del score (0-100 cada uno)
  viabilidad_tecnica DECIMAL(5,2) DEFAULT 0,
  margen_esperado DECIMAL(5,2) DEFAULT 0,
  expertise_equipo DECIMAL(5,2) DEFAULT 0,
  riesgo_contractual DECIMAL(5,2) DEFAULT 0,
  timeline_factible DECIMAL(5,2) DEFAULT 0,

  -- Score total ponderado
  score_total DECIMAL(5,2) GENERATED ALWAYS AS (
    (viabilidad_tecnica * 0.30 +
     margen_esperado * 0.25 +
     expertise_equipo * 0.20 +
     riesgo_contractual * 0.15 +
     timeline_factible * 0.10)
  ) STORED,

  -- Recomendación automática
  recommendation VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN (viabilidad_tecnica * 0.30 + margen_esperado * 0.25 + expertise_equipo * 0.20 + riesgo_contractual * 0.15 + timeline_factible * 0.10) >= 70 THEN 'go'
      WHEN (viabilidad_tecnica * 0.30 + margen_esperado * 0.25 + expertise_equipo * 0.20 + riesgo_contractual * 0.15 + timeline_factible * 0.10) >= 50 THEN 'review'
      ELSE 'no_go'
    END
  ) STORED,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ANÁLISIS DE SENTIMIENTO Y LENGUAJE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_risk_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
  clause_text TEXT NOT NULL,
  clause_type VARCHAR(50) CHECK (clause_type IN ('penalizacion', 'garantia', 'exclusividad', 'restrictivo', 'oportunidad')),
  risk_level VARCHAR(20) CHECK (risk_level IN ('alto', 'medio', 'bajo', 'positivo')),
  page_number INT,
  section_reference VARCHAR(100),
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_clauses_rfp ON rfp_risk_clauses(rfp_id);
CREATE INDEX idx_risk_clauses_type ON rfp_risk_clauses(clause_type);

-- ============================================================================
-- 6. ALERTAS Y NOTIFICACIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) CHECK (alert_type IN ('deadline_48h', 'deadline_24h', 'deadline_6h', 'status_change', 'new_comment', 'assignment')),
  alert_title VARCHAR(200) NOT NULL,
  alert_message TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  recipients UUID[], -- array de user IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_scheduled ON rfp_alerts(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX idx_alerts_rfp ON rfp_alerts(rfp_id);

-- ============================================================================
-- 7. COMPARACIONES DE RFPs
-- ============================================================================
CREATE TABLE IF NOT EXISTS rfp_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  rfp_ids UUID[] NOT NULL, -- array de RFP IDs a comparar
  comparison_data JSONB, -- datos calculados de la comparación
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. AMPLIAR TABLA rfp_comments (ya existe, añadir campos)
-- ============================================================================
ALTER TABLE rfp_comments
  ADD COLUMN IF NOT EXISTS mentioned_users UUID[],
  ADD COLUMN IF NOT EXISTS is_decision BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS decision_type VARCHAR(50); -- 'go', 'no_go', 'review'

-- ============================================================================
-- 9. AMPLIAR TABLA rfp_sections (asignaciones)
-- ============================================================================
ALTER TABLE rfp_sections
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en rfp_requirements
CREATE OR REPLACE FUNCTION update_rfp_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfp_requirements_updated_at
  BEFORE UPDATE ON rfp_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_rfp_requirements_updated_at();

-- Trigger para actualizar updated_at en rfp_answer_library
CREATE OR REPLACE FUNCTION update_answer_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER answer_library_updated_at
  BEFORE UPDATE ON rfp_answer_library
  FOR EACH ROW
  EXECUTE FUNCTION update_answer_library_updated_at();

-- Trigger para incrementar usage_count cuando se usa una respuesta
CREATE OR REPLACE FUNCTION increment_answer_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.library_answer_id IS NOT NULL THEN
    UPDATE rfp_answer_library
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.library_answer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER answer_usage_increment
  AFTER INSERT ON rfp_answers
  FOR EACH ROW
  EXECUTE FUNCTION increment_answer_usage();

-- Trigger para crear alertas automáticas cuando cambia deadline
CREATE OR REPLACE FUNCTION create_deadline_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline IS NOT NULL AND (OLD.deadline IS NULL OR OLD.deadline != NEW.deadline) THEN
    -- Limpiar alertas anteriores
    DELETE FROM rfp_alerts WHERE rfp_id = NEW.id AND alert_type LIKE 'deadline_%';

    -- Crear alerta 48h antes
    IF NEW.deadline > NOW() + INTERVAL '48 hours' THEN
      INSERT INTO rfp_alerts (rfp_id, alert_type, alert_title, alert_message, scheduled_for)
      VALUES (
        NEW.id,
        'deadline_48h',
        'Deadline en 48 horas: ' || NEW.name,
        'El plazo de entrega de la propuesta vence en 48 horas',
        NEW.deadline - INTERVAL '48 hours'
      );
    END IF;

    -- Crear alerta 24h antes
    IF NEW.deadline > NOW() + INTERVAL '24 hours' THEN
      INSERT INTO rfp_alerts (rfp_id, alert_type, alert_title, alert_message, scheduled_for)
      VALUES (
        NEW.id,
        'deadline_24h',
        'Deadline en 24 horas: ' || NEW.name,
        'El plazo de entrega de la propuesta vence en 24 horas',
        NEW.deadline - INTERVAL '24 hours'
      );
    END IF;

    -- Crear alerta 6h antes
    IF NEW.deadline > NOW() + INTERVAL '6 hours' THEN
      INSERT INTO rfp_alerts (rfp_id, alert_type, alert_title, alert_message, scheduled_for)
      VALUES (
        NEW.id,
        'deadline_6h',
        '⚠️ URGENTE: Deadline en 6 horas: ' || NEW.name,
        'El plazo de entrega de la propuesta vence en 6 horas',
        NEW.deadline - INTERVAL '6 hours'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfp_deadline_alerts
  AFTER INSERT OR UPDATE OF deadline ON rfps
  FOR EACH ROW
  EXECUTE FUNCTION create_deadline_alerts();

-- ============================================================================
-- 11. VISTAS ÚTILES
-- ============================================================================

-- Vista de RFPs con scoring y tags
CREATE OR REPLACE VIEW rfp_dashboard_enhanced AS
SELECT
  r.id,
  r.name,
  r.viability,
  r.viability_reason,
  r.status,
  r.deadline,
  r.created_at,
  rs.score_total,
  rs.recommendation,
  COALESCE(
    (SELECT json_agg(json_build_object('id', rt.id, 'name', rt.name, 'color', rt.color))
     FROM rfp_tag_assignments rta
     JOIN rfp_tags rt ON rt.id = rta.tag_id
     WHERE rta.rfp_id = r.id),
    '[]'::json
  ) as tags,
  (SELECT COUNT(*) FROM rfp_requirements WHERE rfp_id = r.id) as requirements_count,
  (SELECT COUNT(*) FROM rfp_comments WHERE rfp_id = r.id) as comments_count,
  (SELECT COUNT(*) FROM rfp_risk_clauses WHERE rfp_id = r.id AND risk_level = 'alto') as high_risk_clauses
FROM rfps r
LEFT JOIN rfp_scoring rs ON rs.rfp_id = r.id
ORDER BY r.created_at DESC;

-- Vista de biblioteca de respuestas más usadas
CREATE OR REPLACE VIEW answer_library_popular AS
SELECT
  id,
  question_text,
  question_category,
  answer_template,
  keywords,
  usage_count,
  last_used_at,
  created_at
FROM rfp_answer_library
WHERE usage_count > 0
ORDER BY usage_count DESC, last_used_at DESC
LIMIT 50;

-- ============================================================================
-- 12. DATOS INICIALES (Tags predefinidos)
-- ============================================================================
INSERT INTO rfp_tags (name, color, description) VALUES
  ('Cliente VIP', 'purple', 'Cliente estratégico de alto valor'),
  ('Sector Público', 'blue', 'Licitación pública o administración'),
  ('Recurring', 'green', 'Cliente recurrente con historial'),
  ('High Risk', 'red', 'RFP con cláusulas de alto riesgo'),
  ('Quick Win', 'orange', 'Oportunidad rápida de cerrar'),
  ('Strategic', 'pink', 'Proyecto estratégico para la empresa'),
  ('International', 'cyan', 'Proyecto internacional o multinacional')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 13. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rfps_deadline ON rfps(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_rfps_viability ON rfps(viability);
CREATE INDEX IF NOT EXISTS idx_rfp_scoring_total ON rfp_scoring(score_total DESC);
CREATE INDEX IF NOT EXISTS idx_rfp_scoring_recommendation ON rfp_scoring(recommendation);

-- ============================================================================
-- 14. RLS POLICIES (Row Level Security)
-- ============================================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE rfp_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_answer_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_risk_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_comparisons ENABLE ROW LEVEL SECURITY;

-- Policies: todos los usuarios autenticados pueden leer
CREATE POLICY "Usuarios autenticados pueden ver tags" ON rfp_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver asignaciones de tags" ON rfp_tag_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver requisitos" ON rfp_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver biblioteca" ON rfp_answer_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver respuestas" ON rfp_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver scoring" ON rfp_scoring FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver cláusulas de riesgo" ON rfp_risk_clauses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver alertas" ON rfp_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver comparaciones" ON rfp_comparisons FOR SELECT TO authenticated USING (true);

-- Policies: todos los usuarios autenticados pueden insertar/actualizar
CREATE POLICY "Usuarios autenticados pueden crear tags" ON rfp_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden asignar tags" ON rfp_tag_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear requisitos" ON rfp_requirements FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar biblioteca" ON rfp_answer_library FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear respuestas" ON rfp_answers FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear scoring" ON rfp_scoring FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear cláusulas de riesgo" ON rfp_risk_clauses FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear alertas" ON rfp_alerts FOR ALL TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear comparaciones" ON rfp_comparisons FOR ALL TO authenticated USING (true);

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
