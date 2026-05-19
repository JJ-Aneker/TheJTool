-- Migration: Add field_types column to reporter_profiles
-- Purpose: Store FieldType for each saved field to identify date fields
-- Date: 2026-05-19

ALTER TABLE reporter_profiles
  ADD COLUMN IF NOT EXISTS field_types jsonb DEFAULT '{}'::jsonb;

-- Column description:
-- field_types: JSON mapping field ColName → FieldType (3=DateField, 5=DateTimeField)
-- Example: {"Fecha_Envio": 3, "Fecha_Creacion": 5, "DocNo": 1}
