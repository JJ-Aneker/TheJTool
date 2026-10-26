-- Tabla de items de licencias Therefore (catálogo maestro)
CREATE TABLE IF NOT EXISTS therefore_license_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(50) NOT NULL,
  descripcion text NOT NULL,
  clase varchar(50), -- THE.EA, THE.ON, THE.SU
  categoria varchar(100), -- Licencias, CSS, Servicios, etc.
  pvp decimal(10,2) NOT NULL DEFAULT 0,
  css_pvp decimal(10,2) DEFAULT 0,
  puntos int, -- Solo para OnPremise
  edicion varchar(20) NOT NULL, -- onpremise, online, suscripcion
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_items_codigo ON therefore_license_items(codigo);
CREATE INDEX IF NOT EXISTS idx_items_edicion ON therefore_license_items(edicion);
CREATE INDEX IF NOT EXISTS idx_items_categoria ON therefore_license_items(categoria);
CREATE INDEX IF NOT EXISTS idx_items_activo ON therefore_license_items(activo);

-- Constraint único por codigo + edicion
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_codigo_edicion ON therefore_license_items(codigo, edicion);

-- RLS Policies
ALTER TABLE therefore_license_items ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer el catálogo
CREATE POLICY "Anyone can view active items" ON therefore_license_items
  FOR SELECT USING (auth.uid() IS NOT NULL AND activo = true);

-- Solo admins pueden crear/actualizar/eliminar items
CREATE POLICY "Admins can manage items" ON therefore_license_items
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_therefore_license_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therefore_license_items_updated_at
  BEFORE UPDATE ON therefore_license_items
  FOR EACH ROW
  EXECUTE FUNCTION update_therefore_license_items_updated_at();
