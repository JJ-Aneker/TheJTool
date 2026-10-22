# Despliegue del Generador de eForms IA

Este documento describe los pasos manuales necesarios para desplegar el módulo en producción.

## 1. Base de datos (Supabase)

Ejecutar el script SQL en Supabase → SQL Editor:

```sql
-- Ver archivo: eform-generator-ia/docs/eform-generator-ia/supabase/eform_generations.sql
```

Este script crea:
- Tabla `eform_generations` con versionado
- Función `is_admin()` para RLS
- Políticas RLS (solo admins, cada uno ve lo suyo)

⚠️ **Importante**: La función `is_admin()` asume que la tabla `profiles` tiene una columna `role` con valor `'admin'`. Si el esquema es diferente, adaptar la función.

## 2. Variables de entorno

### Local (.env)

Añadir:
```env
# Generador de eForms IA
EFORM_AI_MODEL_ID=claude-sonnet-4-5
```

Las credenciales de AWS Bedrock ya deben estar configuradas:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### Vercel (Production)

En Project Settings → Environment Variables, añadir:
- `EFORM_AI_MODEL_ID` = `claude-sonnet-4-5`

Las demás variables ya deben estar configuradas:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## 3. Dependencias npm

Ya están instaladas (uuid y fast-xml-parser son dependencias transitivas):
- ✅ `uuid` (vía exceljs)
- ✅ `fast-xml-parser` (vía @aws-sdk)

Si fuera necesario instalarlas explícitamente:
```bash
npm install uuid fast-xml-parser
```

## 4. Verificación local

### 4.1 Tests unitarios

```bash
node tests/eformXml.test.js
```

Debe mostrar: `✅ Todos los tests pasaron correctamente`

### 4.2 Servidor local

```bash
npm run dev:all
```

Debe iniciar:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 4.3 Acceso a la UI

1. Login como usuario administrador
2. Menú lateral → "Generador eForms IA" (icono ⚡)
3. Completar el flujo:
   - Paso 1: Petición ("Crea un eForm para el registro de libros que además lea QRs")
   - Paso 2: Preguntas (si aparecen) o saltar
   - Paso 3: Revisar prompt detallado
   - Paso 4: Descargar XML generado

### 4.4 Importar XML en Therefore

1. Abrir Therefore Solution Designer
2. File → Import Configuration
3. Seleccionar el XML descargado
4. Verificar que el eForm aparece en la lista de eForms

## 5. Pruebas de integración recomendadas

### Peticiones de prueba:

1. **Simple**: "Formulario de contacto con nombre, email y mensaje"
2. **Con QR**: "Registro de equipos con lector QR"
3. **Con autofill**: "Solicitud de vacaciones con datos del usuario conectado"
4. **Con lookup**: "Alta de cliente que busca el país en una categoría maestra"
5. **Complejo**: "Formulario de incidencias con fotografía, firma y búsqueda de técnico"

### Verificaciones:

- [ ] El XML generado se importa sin errores en Therefore
- [ ] Los campos del eForm corresponden a la petición
- [ ] Las validaciones (obligatorio, maxLength) funcionan
- [ ] Los bloques especiales (QR, autofill) tienen el código JS correcto
- [ ] No hay comillas dobles ni `<` `>` en atributos `onclick`
- [ ] El botón submit está al final
- [ ] Las keys coinciden con los ColName si se subió categoría

## 6. Monitorización

### Logs de IA (Supabase)

Tabla `anthropic_usage` registra todas las llamadas a Bedrock:
- `module = 'eform-ai-propose'`
- `module = 'eform-ai-generate'`
- `module = 'eform-ai-refine'`

### Generaciones (Supabase)

Tabla `eform_generations`:
- Filtrar por `status = 'invalid'` para ver errores
- Revisar `validation.errors` de generaciones fallidas

### Vercel Logs

En caso de errores en producción:
- Vercel Dashboard → Logs
- Filtrar por `/api/eform-ai/`
- Timeout: aumentar `maxDuration` si es necesario (actual: 120s)

## 7. Limitaciones conocidas

### v1:
- No hay vista previa interactiva del eForm (solo JSON + tabla de campos)
- No se importa automáticamente en Therefore (descarga manual)
- No se genera categoría asociada
- Refinamiento solo permite cambios menores (no reestructuración total)
- Plantilla XML personalizada no se persiste entre refinamientos

### Próximas versiones:
- Integración con formiojs para vista previa completa
- Importación directa vía API REST de Therefore
- Generación de categoría/perfil de indexación asociado
- Acceso para usuarios no-admin (con aprobación)

## 8. Troubleshooting

### Error: "No autorizado: falta token"
- Verificar que el usuario está logueado
- Comprobar que el token de Supabase es válido

### Error: "Acceso denegado: solo administradores"
- Verificar que `profiles.role = 'admin'` para el usuario
- Si el esquema de profiles es diferente, adaptar middleware de auth

### Error: "La IA no devolvió JSON válido"
- Revisar logs de Bedrock (Supabase `anthropic_usage`)
- Verificar que `EFORM_AI_MODEL_ID` apunta a un modelo válido
- Puede ser un prompt muy complejo → simplificar la petición

### Error: "Error parseando categoría"
- Verificar que el XML es un export válido de Therefore Solution Designer
- Comprobar que tiene la estructura `<Configuration><Categories><Category>`

### Error SQL 547 al importar en Therefore On-Premise
- Usar plantilla exportada de esa instancia específica (contiene `DefSubmNo`)
- No usar la plantilla por defecto con On-Premise

## 9. Soporte

Para issues o dudas:
- Revisar `docs/eform-generator-ia/SPEC.md`
- Consultar `docs/eform-generator-ia/knowledge/*.md`
- Logs en Supabase (tablas `anthropic_usage` y `eform_generations`)
