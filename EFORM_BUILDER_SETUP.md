# Therefore™ eForms Builder Setup

## Integración Completada ✓

El componente eForm Builder ha sido integrado en la aplicación con:

### Características Implementadas
- ✅ **Convertido a React**: eforms_builder.html → EFormBuilder.jsx
- ✅ **Sistema de Diseño**: Todos los colores reemplazados con variables CSS
- ✅ **Estilos Sincronizados**: Usa design-tokens.css para temas dark/light
- ✅ **Ruta Integrada**: Disponible en `/eforms` del menú principal
- ✅ **Supabase Ready**: Preparado para guardar definiciones de eForms

### Componentes Funcionales
1. **Editor de Campos**: 9 tipos de datos soportados
   - Texto, Email, Teléfono
   - Fecha, Fecha y Hora
   - Número, Importe (€)
   - Casilla (Sí/No), Lista desplegable

2. **Importador CSV**: Carga masiva desde CSV/texto
   - Detecta columnas automáticamente
   - Soporta separadores (`;` o `,`)
   - Validación y vista previa

3. **Constructor Form.io**: Genera JSON nativo de Form.io
   - Paneles con campos organizados
   - Layout flexible (1-4 columnas)
   - Validaciones automáticas

4. **Generador XML Therefore™**: Exporta XML importable
   - Cumple especificación Therefore 2020+
   - Incluye timestamp generado automáticamente
   - GUID único por eForm

5. **Vista Previa**: Renderizado en vivo
   - Visualiza cómo se vería el formulario
   - Muestra campos requeridos (*)
   - Respeta layout configurado

## Configuración de Supabase

### 1. Crear tabla `eforms`

Ejecuta en el SQL Editor de Supabase:

```sql
CREATE TABLE eforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_eforms_created_by ON eforms(created_by);
CREATE INDEX idx_eforms_created_at ON eforms(created_at);

-- RLS Policy: Usuarios solo ven sus propios eForms
ALTER TABLE eforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own eforms"
  ON eforms FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create eforms"
  ON eforms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own eforms"
  ON eforms FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own eforms"
  ON eforms FOR DELETE
  USING (auth.uid() = created_by);
```

### 2. Verificar Variables de Entorno

En `.env` o `.env.local`, asegúrate de tener:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Variables CSS Agregadas

Se agregaron dos nuevas variables al sistema de diseño:

```css
/* Dark Theme */
--accent-error: #ff5050;
--accent-warning: #ffa726;

/* Light Theme */
--accent-error: #ff5050;
--accent-warning: #ffa726;
```

Estas variables se usan en:
- Mensajes de error (inputs, validaciones)
- Alertas y advertencias
- Estados peligrosos (botones eliminar)

## Funciones del Componente

### Métodos Clave Disponibles

```javascript
// Generar GUID único
newGuid() → "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

// Escapar caracteres especiales XML
escXml(texto) → "&lt;tag&gt;"

// Convertir a camelCase (clave de campo)
toCamelKey("Nombre Completo") → "nombreCompleto"

// Generar timestamp Therefore
dcreaNow() → "20260430125959000"

// Parsear CSV y crear campos
parseCsv(texto) → { sections, warnings }

// Construir componente Form.io
buildComponent(field) → formioComponent

// Generar JSON Form.io completo
buildFormioJson({ sections, colsPerRow, submitLabel }) → { display, settings, components }

// Generar XML Therefore importable
buildEFormXml({ formName, submitLabel, sections, colsPerRow }) → xmlString
```

## Guardando eForms en Supabase

El botón "💾 Guardar en Supabase" ejecuta:

```javascript
const { error } = await supabase.from('eforms').insert({
  name: formName,
  definition: xml,
  description: description,
  created_by: user?.id,
  created_at: new Date().toISOString()
})
```

## Próximas Mejoras (Opcionales)

- [ ] Cargar eForms guardadas desde Supabase
- [ ] Editar eForms existentes
- [ ] Listar todos los eForms del usuario
- [ ] Validaciones avanzadas (expresiones regulares)
- [ ] Estilos CSS personalizados
- [ ] Exportar a PDF con preview
- [ ] Versionado de eForms

## Troubleshooting

### "Failed to fetch metadata" en Supabase
- Verifica que las credenciales en `.env` sean correctas
- Abre la tabla `eforms` en Supabase y confirma que existe

### Colores no se ven correctamente
- Verifica que `data-theme="dark"` está en el `<html>`
- Abre DevTools → Elements y busca los atributos `data-theme`
- Verifica que `design-tokens.css` está siendo cargado

### XML no genera
- Verifica que la sección tiene al menos un campo
- Cada campo debe tener un nombre (etiqueta)
- El formulario debe tener un nombre

## Acceso a la Herramienta

**Ruta**: `/eforms` en el menú "Generador de eForms"

**Requisitos**:
- Usuario autenticado en Supabase
- Tabla `eforms` creada en Supabase
- Variables de entorno configuradas

---

**Versión**: v2.0  
**Última actualización**: 2026-04-30  
**Framework**: React 18 + Supabase
