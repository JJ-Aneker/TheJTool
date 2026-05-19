-- Migration: Extend reporter_profiles table with multi-category support
-- Purpose: Add columns for storing category selections, field configurations, and groupings
-- Date: 2026-05-19

-- Add columns if they don't exist
ALTER TABLE reporter_profiles
  ADD COLUMN IF NOT EXISTS saved_cat_nos  integer[]  DEFAULT '{}' ::integer[],
  ADD COLUMN IF NOT EXISTS saved_fields   text[]     DEFAULT '{}' ::text[],
  ADD COLUMN IF NOT EXISTS group_fields   text[]     DEFAULT '{}' ::text[],
  ADD COLUMN IF NOT EXISTS caption_map    jsonb      DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cat_field_order jsonb     DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cat_names      jsonb      DEFAULT '{}'::jsonb;

-- Example data structure (for reference):
/*
INSERT INTO reporter_profiles (
  user_id,
  tenant_id,
  nombre,
  descripcion,
  saved_cat_nos,
  saved_fields,
  group_fields,
  caption_map,
  cat_field_order,
  cat_names
) VALUES (
  'user-uuid',
  1,
  'Aliseda - Notificaciones',
  'Informe de notificaciones enviadas',
  ARRAY[84, 91, 108],
  ARRAY['DocNo', 'Org_nombre', 'Fecha_Envio', 'Estado_ID'],
  ARRAY['Estado_ID', 'Org_nombre'],
  '{"Org_nombre": "Organismo", "Fecha_Envio": "Fecha Envío", "Estado_ID": "Estado", "DocNo": "DocNo"}'::jsonb,
  '{"84": ["Org_nombre", "Fecha_Envio", "Estado_ID"], "91": ["Org_nombre", "Fecha_Envio"], "108": ["Org_nombre", "Estado_ID"]}'::jsonb,
  '{"84": "Notificaciones", "91": "Documentos", "108": "Archivos"}'::jsonb
);
*/

-- Column descriptions:
-- saved_cat_nos: Array of Therefore CategoryNo selected in this profile (e.g., [84, 91, 108])
-- saved_fields: Array of ColName fields to include in reports (e.g., ['DocNo', 'Org_nombre', 'Fecha_Envio'])
-- group_fields: Array of ColName fields to use as dimensions in dashboard charts (e.g., ['Estado_ID', 'Org_nombre'])
-- caption_map: JSON mapping ColName → user-friendly caption (e.g., {"Org_nombre": "Organismo"})
-- cat_field_order: JSON mapping CategoryNo → array of field ColNames in order (e.g., {"84": ["Org_nombre", "Fecha_Envio", ...]})
-- cat_names: JSON mapping CategoryNo → category display name (e.g., {"84": "Notificaciones"})

-- These columns are NOT used by the old thereforeService.extractReportData() method
-- That method only extracts metric counts, ignoring these fields
-- The new executeMultiQuery() method relies entirely on these columns
