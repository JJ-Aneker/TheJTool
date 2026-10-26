-- Tabla de cotizaciones de licencias Therefore
CREATE TABLE IF NOT EXISTS therefore_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre varchar(200) NOT NULL,
  cliente varchar(200),
  edicion varchar(20) NOT NULL, -- onpremise, online, suscripcion
  oportunidad varchar(100), -- SFDC OPP
  account_manager varchar(100),
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{codigo, descripcion, cantidad, pvp, css_pvp, subtotal}]
  servicios jsonb DEFAULT '[]'::jsonb, -- [{descripcion, jornadas, pvp_jornada, subtotal}]
  tech_partners jsonb DEFAULT '[]'::jsonb, -- [{nombre, importe}]
  total_licencias decimal(10,2) DEFAULT 0,
  total_css decimal(10,2) DEFAULT 0,
  total_servicios decimal(10,2) DEFAULT 0,
  total_general decimal(10,2) DEFAULT 0,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotations_user ON therefore_quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_edicion ON therefore_quotations(edicion);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON therefore_quotations(created_at DESC);

-- RLS Policies
ALTER TABLE therefore_quotations ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver solo sus propias cotizaciones
CREATE POLICY "Users can view own quotations" ON therefore_quotations
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propias cotizaciones
CREATE POLICY "Users can create own quotations" ON therefore_quotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias cotizaciones
CREATE POLICY "Users can update own quotations" ON therefore_quotations
  FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias cotizaciones
CREATE POLICY "Users can delete own quotations" ON therefore_quotations
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_therefore_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therefore_quotations_updated_at
  BEFORE UPDATE ON therefore_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_therefore_quotations_updated_at();
