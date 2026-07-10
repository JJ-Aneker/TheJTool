-- ============================================================
-- Banco de conocimiento — Cuestionarios de seguridad IT
-- ============================================================
-- Adaptación SQL Server → PostgreSQL para Supabase
-- Estructura en 5 tablas + 1 vista:
--
-- 1. formularios                    -> metadatos de cada cuestionario recibido
-- 2. preguntas_normalizadas         -> versión canónica única de cada pregunta
-- 3. formulario_preguntas_extraidas -> salida cruda del parser (excel_parser.py)
-- 4. pregunta_variantes             -> variantes de texto conocidas por pregunta
-- 5. respuestas_oficiales           -> respuesta curada y versionada, 1 vigente por pregunta
--
-- Flujo:
-- Excel -> parser -> formulario_preguntas_extraidas
--                      -> (match manual o asistido por IA) -> preguntas_normalizadas
--                                                                -> respuestas_oficiales
-- ============================================================

-- ------------------------------------------------------------
-- 1. FORMULARIOS
-- Un registro por cada cuestionario de homologación recibido
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS formularios (
    id                      SERIAL PRIMARY KEY,
    cliente                 VARCHAR(200)   NOT NULL,
    nombre_formulario       VARCHAR(300)   NOT NULL,
    producto_afectado       VARCHAR(100)   NULL,        -- Therefore / DOCAI / Corporativo / Mixto
    ruta_archivo_original   VARCHAR(500)   NULL,
    fecha_recepcion         DATE           NOT NULL DEFAULT CURRENT_DATE,
    fecha_envio_respuesta   DATE           NULL,
    estado                  VARCHAR(30)    NOT NULL DEFAULT 'pendiente',
        -- pendiente | procesando | completado | error
    mensaje_error           TEXT           NULL,        -- si estado = 'error', detalle del fallo
    preguntas_procesadas    INTEGER        NULL,        -- contador de progreso
    total_preguntas         INTEGER        NULL,        -- total estimado (para calcular %)
    notas                   TEXT           NULL,
    creado_en               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actualizado_en          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_formularios_estado CHECK (estado IN ('pendiente','procesando','completado','error'))
);

CREATE INDEX idx_formularios_cliente ON formularios(cliente);
CREATE INDEX idx_formularios_estado ON formularios(estado);
CREATE INDEX idx_formularios_creado_en ON formularios(creado_en DESC);

COMMENT ON TABLE formularios IS 'Cuestionarios de seguridad IT recibidos de clientes (ING, etc.)';
COMMENT ON COLUMN formularios.estado IS 'pendiente=subido,procesando=parser en curso,completado=preguntas extraídas,error=falló';


-- ------------------------------------------------------------
-- 2. PREGUNTAS_NORMALIZADAS
-- Versión canónica única de cada pregunta, independiente del
-- cliente/formulario. Esta es la tabla que se vectoriza para RAG.
-- Se crea antes que formulario_preguntas_extraidas por dependencia FK.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas_normalizadas (
    id                  SERIAL PRIMARY KEY,
    texto_canonico      VARCHAR(1000)  NOT NULL,
    estandar_referencia VARCHAR(100)   NULL,   -- ISO27001 / SOC2 / ITSS / GDPR / Generico...
    categoria           VARCHAR(200)   NULL,   -- p.ej. "Gestión de incidentes", "Cifrado"
    producto_afectado   VARCHAR(100)   NULL,   -- Therefore / DOCAI / Corporativo / N/A
    idioma              VARCHAR(5)     NOT NULL DEFAULT 'es',
    creado_por          VARCHAR(100)   NULL,
    creado_en           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pn_estandar ON preguntas_normalizadas(estandar_referencia);
CREATE INDEX idx_pn_categoria ON preguntas_normalizadas(categoria);
CREATE INDEX idx_pn_producto ON preguntas_normalizadas(producto_afectado);

COMMENT ON TABLE preguntas_normalizadas IS 'Versión canónica única de cada pregunta (para RAG con embeddings)';


-- ------------------------------------------------------------
-- 3. FORMULARIO_PREGUNTAS_EXTRAIDAS
-- Salida cruda del parser: cada pregunta tal cual aparece en el
-- Excel de origen, sin curar. pregunta_normalizada_id se rellena
-- cuando se hace el match manual/asistido con la tabla 2.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS formulario_preguntas_extraidas (
    id                      SERIAL PRIMARY KEY,
    formulario_id           INTEGER        NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
    hoja                    VARCHAR(200)   NOT NULL,
    seccion                 VARCHAR(300)   NULL,
    question_id_origen      VARCHAR(100)   NULL,       -- ID/Ref del propio Excel, si existe (p.ej. "SG-01")
    texto_pregunta          TEXT           NOT NULL,
    respuesta_existente     TEXT           NULL,       -- si el Excel ya traía algo respondido
    evidencia_nota          TEXT           NULL,
    cell_ref                VARCHAR(20)    NULL,
    answer_cell_ref         VARCHAR(20)    NULL,
    detection_method        VARCHAR(20)    NOT NULL,   -- header | heuristic
    confidence              VARCHAR(10)    NOT NULL,   -- alta | baja
    pregunta_normalizada_id INTEGER        NULL REFERENCES preguntas_normalizadas(id) ON DELETE SET NULL,
    revisado                BOOLEAN        NOT NULL DEFAULT FALSE,
    creado_en               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_fpe_detection CHECK (detection_method IN ('header','heuristic')),
    CONSTRAINT ck_fpe_confidence CHECK (confidence IN ('alta','baja'))
);

CREATE INDEX idx_fpe_formulario ON formulario_preguntas_extraidas(formulario_id);
CREATE INDEX idx_fpe_pregunta_norm ON formulario_preguntas_extraidas(pregunta_normalizada_id);
CREATE INDEX idx_fpe_revisado ON formulario_preguntas_extraidas(revisado);
CREATE INDEX idx_fpe_detection_confidence ON formulario_preguntas_extraidas(detection_method, confidence);

COMMENT ON TABLE formulario_preguntas_extraidas IS 'Salida cruda del parser Excel: cada pregunta sin curar';


-- ------------------------------------------------------------
-- 4. PREGUNTA_VARIANTES
-- Variantes de texto conocidas para la misma pregunta canónica.
-- Útil para mejorar matching futuro (búsqueda por texto exacto/
-- similar antes incluso de llegar al motor vectorial) y para
-- auditar de dónde salió cada variante.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pregunta_variantes (
    id                          SERIAL PRIMARY KEY,
    pregunta_normalizada_id     INTEGER        NOT NULL REFERENCES preguntas_normalizadas(id) ON DELETE CASCADE,
    texto_variante              VARCHAR(1000)  NOT NULL,
    formulario_pregunta_id      INTEGER        NULL REFERENCES formulario_preguntas_extraidas(id) ON DELETE SET NULL,
    creado_en                   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    UNIQUE(pregunta_normalizada_id, texto_variante)
);

CREATE INDEX idx_pv_pregunta_norm ON pregunta_variantes(pregunta_normalizada_id);
CREATE INDEX idx_pv_formulario_pregunta ON pregunta_variantes(formulario_pregunta_id);

COMMENT ON TABLE pregunta_variantes IS 'Variantes de texto conocidas para matching (antes de recurrir a embeddings)';


-- ------------------------------------------------------------
-- 5. RESPUESTAS_OFICIALES
-- Respuesta curada y versionada. Solo una versión "vigente" por
-- pregunta normalizada a la vez; el histórico se conserva.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS respuestas_oficiales (
    id                      SERIAL PRIMARY KEY,
    pregunta_normalizada_id INTEGER        NOT NULL REFERENCES preguntas_normalizadas(id) ON DELETE CASCADE,
    version                 INTEGER        NOT NULL DEFAULT 1,
    texto_respuesta         TEXT           NOT NULL,
    nivel_confidencialidad  VARCHAR(20)    NOT NULL DEFAULT 'interno',
        -- publico | interno | confidencial
    vigente                 BOOLEAN        NOT NULL DEFAULT TRUE,
    aprobado_por            VARCHAR(100)   NULL,
    fecha_revision          DATE           NOT NULL DEFAULT CURRENT_DATE,
    fuente_documental       VARCHAR(500)   NULL,   -- referencia a doc/política de origen
    creado_en               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_ro_confidencialidad CHECK (nivel_confidencialidad IN ('publico','interno','confidencial')),
    UNIQUE(pregunta_normalizada_id, version)
);

CREATE INDEX idx_ro_pregunta_norm ON respuestas_oficiales(pregunta_normalizada_id);
CREATE INDEX idx_ro_vigente ON respuestas_oficiales(vigente) WHERE vigente = TRUE;

-- Garantiza que solo haya UNA respuesta vigente por pregunta normalizada
CREATE UNIQUE INDEX ux_ro_una_vigente_por_pregunta
    ON respuestas_oficiales(pregunta_normalizada_id)
    WHERE vigente = TRUE;

COMMENT ON TABLE respuestas_oficiales IS 'Respuesta curada y versionada (solo una vigente por pregunta)';


-- ============================================================
-- Vista de conveniencia: pregunta normalizada + su respuesta
-- vigente en una sola consulta (esto es lo que alimentará el
-- proceso de generación de embeddings para el motor vectorial)
-- ============================================================
CREATE OR REPLACE VIEW vw_banco_conocimiento_vigente AS
SELECT
    pn.id                       AS pregunta_id,
    pn.texto_canonico,
    pn.estandar_referencia,
    pn.categoria,
    pn.producto_afectado,
    ro.id                       AS respuesta_id,
    ro.texto_respuesta,
    ro.nivel_confidencialidad,
    ro.fecha_revision,
    ro.fuente_documental
FROM preguntas_normalizadas pn
LEFT JOIN respuestas_oficiales ro
    ON ro.pregunta_normalizada_id = pn.id
    AND ro.vigente = TRUE;

COMMENT ON VIEW vw_banco_conocimiento_vigente IS 'Pregunta normalizada + respuesta vigente (para embeddings)';


-- ============================================================
-- Trigger para actualizar automáticamente `actualizado_en` en
-- formularios al cambiar el estado
-- ============================================================
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_formularios_actualizado_en
    BEFORE UPDATE ON formularios
    FOR EACH ROW
    EXECUTE FUNCTION update_actualizado_en();

COMMENT ON FUNCTION update_actualizado_en() IS 'Auto-actualiza columna actualizado_en en UPDATE';


-- ============================================================
-- RLS (Row Level Security) — Deshabilitado por defecto en esta
-- fase de desarrollo; habilitar según las políticas de acceso
-- que se definan para el aplicativo externo
-- ============================================================
-- ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE formulario_preguntas_extraidas ENABLE ROW LEVEL SECURITY;
-- ... (resto de tablas)
