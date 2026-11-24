-- ============================================================
-- Setup de Supabase Storage para cuestionarios de seguridad IT
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- (Storage → SQL Editor)

-- 1. Crear bucket 'questionnaires' (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('questionnaires', 'questionnaires', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de escritura: solo usuarios autenticados (aplicativo externo)
CREATE POLICY "Allow authenticated uploads to questionnaires"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'questionnaires');

-- 3. Política de lectura: solo service_role (backend con service key)
CREATE POLICY "Allow service role read from questionnaires"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'questionnaires');

-- 4. Política de eliminación: solo service_role (para limpieza)
CREATE POLICY "Allow service role delete from questionnaires"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'questionnaires');

-- ============================================================
-- Verificación: comprobar que el bucket se creó correctamente
-- ============================================================
SELECT * FROM storage.buckets WHERE id = 'questionnaires';

-- Output esperado:
-- id              | name            | public | created_at
-- questionnaires  | questionnaires  | false  | 2026-07-10 ...
