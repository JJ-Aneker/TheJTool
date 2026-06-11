-- =====================================================
-- Performance Indexes para TheJTool (SAFE VERSION)
-- Solo crea índices en tablas que existen
-- =====================================================

-- Índices para PROFILES (tabla principal)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved);
        RAISE NOTICE 'Índices creados en: profiles';
    END IF;
END $$;

-- Índices para CATEGORY_TEMPLATES
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'category_templates') THEN
        CREATE INDEX IF NOT EXISTS idx_category_templates_created_by ON category_templates(created_by);
        CREATE INDEX IF NOT EXISTS idx_category_templates_compartido ON category_templates(compartido);
        CREATE INDEX IF NOT EXISTS idx_category_templates_user_or_shared ON category_templates(created_by, compartido);
        RAISE NOTICE 'Índices creados en: category_templates';
    END IF;
END $$;

-- Índices para TENANTS
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
        CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
        RAISE NOTICE 'Índices creados en: tenants';
    END IF;
END $$;

-- Índices para EFORMS (nombre correcto de la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'eforms') THEN
        CREATE INDEX IF NOT EXISTS idx_eforms_created_by ON eforms(created_by);
        CREATE INDEX IF NOT EXISTS idx_eforms_compartido ON eforms(compartido);
        RAISE NOTICE 'Índices creados en: eforms';
    ELSE
        RAISE NOTICE 'Tabla eforms no existe - saltando índices';
    END IF;
END $$;

-- Índices para THEREFORE_PROFILES (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'therefore_profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_therefore_profiles_user_id ON therefore_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_therefore_profiles_tenant_name ON therefore_profiles(tenant_name);
        CREATE INDEX IF NOT EXISTS idx_therefore_profiles_user_tenant ON therefore_profiles(user_id, tenant_name);
        RAISE NOTICE 'Índices creados en: therefore_profiles';
    ELSE
        RAISE NOTICE 'Tabla therefore_profiles no existe - saltando índices';
    END IF;
END $$;

-- =====================================================
-- Verificación final
-- =====================================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
