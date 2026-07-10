/* ============================================================
   Banco de conocimiento — Cuestionarios de seguridad IT
   ============================================================
   Estructura en 5 tablas + 1 vista:

   1. formularios                    -> metadatos de cada cuestionario recibido
   2. preguntas_normalizadas         -> versión canónica única de cada pregunta
   3. formulario_preguntas_extraidas -> salida cruda del parser (excel_parser.py)
   4. pregunta_variantes             -> variantes de texto conocidas por pregunta
   5. respuestas_oficiales           -> respuesta curada y versionada, 1 vigente por pregunta

   Flujo:
   Excel -> parser -> formulario_preguntas_extraidas
                        -> (match manual o asistido por IA) -> preguntas_normalizadas
                                                                  -> respuestas_oficiales

   Nota de orden: preguntas_normalizadas se crea ANTES que
   formulario_preguntas_extraidas porque esta última tiene una FK
   opcional hacia ella (el match se rellena después de la extracción).
   ============================================================ */

-- ------------------------------------------------------------
-- 1. FORMULARIOS
-- Un registro por cada cuestionario de homologación recibido
-- ------------------------------------------------------------
CREATE TABLE formularios (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    cliente             NVARCHAR(200)   NOT NULL,
    nombre_formulario   NVARCHAR(300)   NOT NULL,
    producto_afectado   NVARCHAR(100)   NULL,        -- Therefore / DOCAI / Corporativo / Mixto
    ruta_archivo_original NVARCHAR(500) NULL,
    fecha_recepcion     DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fecha_envio_respuesta DATE          NULL,
    estado              NVARCHAR(30)    NOT NULL DEFAULT 'pendiente',
        -- pendiente | en_progreso | en_revision | enviado
    notas               NVARCHAR(MAX)   NULL,
    creado_en           DATETIME2       NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_formularios_estado CHECK (estado IN ('pendiente','en_progreso','en_revision','enviado'))
);

CREATE INDEX IX_formularios_cliente ON formularios(cliente);
CREATE INDEX IX_formularios_estado ON formularios(estado);


-- ------------------------------------------------------------
-- 2. PREGUNTAS_NORMALIZADAS
-- Versión canónica única de cada pregunta, independiente del
-- cliente/formulario. Esta es la tabla que se vectoriza para RAG.
-- Se crea antes que formulario_preguntas_extraidas por dependencia FK.
-- ------------------------------------------------------------
CREATE TABLE preguntas_normalizadas (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    texto_canonico      NVARCHAR(1000)  NOT NULL,
    estandar_referencia NVARCHAR(100)   NULL,   -- ISO27001 / SOC2 / ITSS / GDPR / Generico...
    categoria           NVARCHAR(200)   NULL,   -- p.ej. "Gestión de incidentes", "Cifrado"
    producto_afectado   NVARCHAR(100)   NULL,   -- Therefore / DOCAI / Corporativo / N/A
    idioma              NVARCHAR(5)     NOT NULL DEFAULT 'es',
    creado_por          NVARCHAR(100)   NULL,
    creado_en           DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    actualizado_en      DATETIME2       NOT NULL DEFAULT SYSDATETIME()
);

CREATE INDEX IX_pn_estandar ON preguntas_normalizadas(estandar_referencia);
CREATE INDEX IX_pn_categoria ON preguntas_normalizadas(categoria);


-- ------------------------------------------------------------
-- 3. FORMULARIO_PREGUNTAS_EXTRAIDAS
-- Salida cruda del parser: cada pregunta tal cual aparece en el
-- Excel de origen, sin curar. pregunta_normalizada_id se rellena
-- cuando se hace el match manual/asistido con la tabla 2.
-- ------------------------------------------------------------
CREATE TABLE formulario_preguntas_extraidas (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    formulario_id           INT             NOT NULL,
    hoja                    NVARCHAR(200)   NOT NULL,
    seccion                 NVARCHAR(300)   NULL,
    question_id_origen      NVARCHAR(100)   NULL,       -- ID/Ref del propio Excel, si existe (p.ej. "SG-01")
    texto_pregunta          NVARCHAR(MAX)   NOT NULL,
    respuesta_existente     NVARCHAR(MAX)   NULL,       -- si el Excel ya traía algo respondido
    evidencia_nota          NVARCHAR(MAX)   NULL,
    cell_ref                NVARCHAR(20)    NULL,
    answer_cell_ref         NVARCHAR(20)    NULL,
    detection_method        NVARCHAR(20)    NOT NULL,   -- header | heuristic
    confidence              NVARCHAR(10)    NOT NULL,   -- alta | baja
    pregunta_normalizada_id INT             NULL,       -- FK opcional, se rellena al hacer match
    revisado                BIT             NOT NULL DEFAULT 0,
    creado_en               DATETIME2       NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_fpe_formulario FOREIGN KEY (formulario_id) REFERENCES formularios(id),
    CONSTRAINT FK_fpe_pregunta_norm FOREIGN KEY (pregunta_normalizada_id) REFERENCES preguntas_normalizadas(id),
    CONSTRAINT CK_fpe_detection CHECK (detection_method IN ('header','heuristic')),
    CONSTRAINT CK_fpe_confidence CHECK (confidence IN ('alta','baja'))
);

CREATE INDEX IX_fpe_formulario ON formulario_preguntas_extraidas(formulario_id);
CREATE INDEX IX_fpe_pregunta_norm ON formulario_preguntas_extraidas(pregunta_normalizada_id);
CREATE INDEX IX_fpe_revisado ON formulario_preguntas_extraidas(revisado);


-- ------------------------------------------------------------
-- 4. PREGUNTA_VARIANTES
-- Variantes de texto conocidas para la misma pregunta canónica.
-- Útil para mejorar matching futuro (búsqueda por texto exacto/
-- similar antes incluso de llegar al motor vectorial) y para
-- auditar de dónde salió cada variante.
-- ------------------------------------------------------------
CREATE TABLE pregunta_variantes (
    id                          INT IDENTITY(1,1) PRIMARY KEY,
    pregunta_normalizada_id     INT             NOT NULL,
    texto_variante              NVARCHAR(1000)  NOT NULL,
    formulario_pregunta_id      INT             NULL,   -- de qué extracción concreta vino
    creado_en                   DATETIME2       NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_pv_pregunta_norm FOREIGN KEY (pregunta_normalizada_id) REFERENCES preguntas_normalizadas(id),
    CONSTRAINT FK_pv_formulario_pregunta FOREIGN KEY (formulario_pregunta_id) REFERENCES formulario_preguntas_extraidas(id)
);

CREATE INDEX IX_pv_pregunta_norm ON pregunta_variantes(pregunta_normalizada_id);


-- ------------------------------------------------------------
-- 5. RESPUESTAS_OFICIALES
-- Respuesta curada y versionada. Solo una versión "vigente" por
-- pregunta normalizada a la vez; el histórico se conserva.
-- ------------------------------------------------------------
CREATE TABLE respuestas_oficiales (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    pregunta_normalizada_id INT             NOT NULL,
    version                 INT             NOT NULL DEFAULT 1,
    texto_respuesta         NVARCHAR(MAX)   NOT NULL,
    nivel_confidencialidad  NVARCHAR(20)    NOT NULL DEFAULT 'interno',
        -- publico | interno | confidencial
    vigente                 BIT             NOT NULL DEFAULT 1,
    aprobado_por            NVARCHAR(100)   NULL,
    fecha_revision          DATE            NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fuente_documental       NVARCHAR(500)   NULL,   -- referencia a doc/política de origen
    creado_en               DATETIME2       NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_ro_pregunta_norm FOREIGN KEY (pregunta_normalizada_id) REFERENCES preguntas_normalizadas(id),
    CONSTRAINT CK_ro_confidencialidad CHECK (nivel_confidencialidad IN ('publico','interno','confidencial')),
    CONSTRAINT UQ_ro_pregunta_version UNIQUE (pregunta_normalizada_id, version)
);

CREATE INDEX IX_ro_pregunta_norm ON respuestas_oficiales(pregunta_normalizada_id);

-- Garantiza que solo haya UNA respuesta vigente por pregunta normalizada
CREATE UNIQUE INDEX UX_ro_una_vigente_por_pregunta
    ON respuestas_oficiales(pregunta_normalizada_id)
    WHERE vigente = 1;
GO

/* ============================================================
   Vista de conveniencia: pregunta normalizada + su respuesta
   vigente en una sola consulta (esto es lo que alimentará el
   proceso de generación de embeddings para el motor vectorial)
   ============================================================ */
CREATE VIEW vw_banco_conocimiento_vigente AS
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
    AND ro.vigente = 1;
GO
