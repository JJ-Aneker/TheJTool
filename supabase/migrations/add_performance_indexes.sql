-- =====================================================
-- Performance Indexes para TheJTool
-- Optimiza queries frecuentes en Supabase
-- =====================================================

-- Índice en profiles.user_id (query más frecuente)
-- Query: SELECT * FROM profiles WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
ON profiles(user_id);

-- Índice en profiles.approved (filtrado común)
-- Query: SELECT * FROM profiles WHERE approved = true
CREATE INDEX IF NOT EXISTS idx_profiles_approved
ON profiles(approved);

-- Índice en category_templates.created_by (filtrado por usuario)
-- Query: SELECT * FROM category_templates WHERE created_by = ?
CREATE INDEX IF NOT EXISTS idx_category_templates_created_by
ON category_templates(created_by);

-- Índice en category_templates.compartido (filtrado público/privado)
-- Query: SELECT * FROM category_templates WHERE compartido = true
CREATE INDEX IF NOT EXISTS idx_category_templates_compartido
ON category_templates(compartido);

-- Índice compuesto para queries de templates del usuario o compartidos
-- Query: SELECT * FROM category_templates WHERE created_by = ? OR compartido = true
CREATE INDEX IF NOT EXISTS idx_category_templates_user_or_shared
ON category_templates(created_by, compartido);

-- Índice en tenants.owner_id (filtrado por propietario)
-- Query: SELECT * FROM tenants WHERE owner_id = ?
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id
ON tenants(owner_id);

-- Índice en eform_templates.created_by (filtrado por usuario)
-- Query: SELECT * FROM eform_templates WHERE created_by = ?
CREATE INDEX IF NOT EXISTS idx_eform_templates_created_by
ON eform_templates(created_by);

-- Índice en eform_templates.compartido
CREATE INDEX IF NOT EXISTS idx_eform_templates_compartido
ON eform_templates(compartido);

-- Índice en therefore_profiles.user_id (relación con usuarios)
-- Query: SELECT * FROM therefore_profiles WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_therefore_profiles_user_id
ON therefore_profiles(user_id);

-- Índice en therefore_profiles.tenant_name (búsqueda por tenant)
-- Query: SELECT * FROM therefore_profiles WHERE tenant_name = ?
CREATE INDEX IF NOT EXISTS idx_therefore_profiles_tenant_name
ON therefore_profiles(tenant_name);

-- Índice compuesto para queries de perfiles por usuario y tenant
-- Query: SELECT * FROM therefore_profiles WHERE user_id = ? AND tenant_name = ?
CREATE INDEX IF NOT EXISTS idx_therefore_profiles_user_tenant
ON therefore_profiles(user_id, tenant_name);

-- =====================================================
-- Estadísticas y verificación
-- =====================================================

-- Para verificar que los índices se crearon:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Para analizar uso de índices:
-- EXPLAIN ANALYZE SELECT * FROM profiles WHERE user_id = 'some-uuid';

COMMENT ON INDEX idx_profiles_user_id IS 'Optimiza búsqueda de perfil por user_id (query más frecuente)';
COMMENT ON INDEX idx_tenants_owner_id IS 'Optimiza filtrado de tenants por propietario';
COMMENT ON INDEX idx_category_templates_created_by IS 'Optimiza queries de templates por creador';
