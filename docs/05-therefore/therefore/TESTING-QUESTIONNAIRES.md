# Testing del Módulo de Cuestionarios - Guía Rápida

## Estado Actual de los Servidores

✅ **Frontend (Vite)**: http://localhost:5173  
✅ **Backend (Express)**: http://localhost:3002

### Nuevos endpoints disponibles:
- 📤 **Upload**: `POST http://localhost:3002/api/questionnaires/upload`
- 📊 **Status**: `GET http://localhost:3002/api/questionnaires/:id/status`

---

## ⚠️ Setup Previo Necesario

Antes de poder probar los endpoints, necesitas:

### 1. Ejecutar la migración de Supabase
```sql
-- En Supabase Dashboard → SQL Editor
-- Copiar y ejecutar todo el contenido de:
supabase/migrations/20260710_create_questionnaires_tables.sql
```

### 2. Crear el bucket de Storage
```sql
-- En Supabase Dashboard → Storage → SQL Editor
-- Ejecutar:
scripts/setup-questionnaires-bucket.sql
```

### 3. Crear usuario de servicio en Supabase Auth
```
Dashboard → Authentication → Users → Create User
Email: servicio.cuestionarios@buildingcenter.com
Password: (genera uno seguro y guárdalo)
```

### 4. Obtener JWT del usuario de servicio

**Con PowerShell**:
```powershell
$body = @{
    email = "servicio.cuestionarios@buildingcenter.com"
    password = "TU_PASSWORD_AQUI"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://vvehigbigvqkbgavnqkr.supabase.co/auth/v1/token?grant_type=password" `
    -Method POST `
    -Headers @{
        "apikey" = $env:VITE_SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    } `
    -Body $body

$jwt = $response.access_token
Write-Host "JWT Token obtenido:"
Write-Host $jwt

# Guardar en variable de entorno para los siguientes tests
$env:QUESTIONNAIRE_JWT = $jwt
```

---

## 🧪 Tests con el Parser Standalone (sin backend)

Si tienes un fichero Excel de prueba:

```powershell
# Test del parser sin necesidad de backend/BD
node scripts/test-questionnaire-parser.js ruta\al\cuestionario.xlsx
```

**Output esperado**:
- ✅ X preguntas extraídas
- 📊 Estadísticas por confianza, método, hoja
- 📋 Primeras 10 preguntas como ejemplo
- 💾 JSON exportado a `<nombre>_preguntas.json`
- ⚠️ Warnings de calidad

**Ejemplo de fichero Excel de prueba simple** (crear en Excel):

| Pregunta | Respuesta | Categoría |
|----------|-----------|-----------|
| ¿Tiene autenticación multifactor? | | Seguridad |
| ¿Realiza copias de seguridad diarias? | Sí | Backup |
| ¿Dispone de firewall perimetral? | | Red |

Guardar como `test_simple.xlsx` y ejecutar:
```powershell
node scripts/test-questionnaire-parser.js test_simple.xlsx
```

---

## 🌐 Tests de los Endpoints (con backend + Supabase)

### Test 1: Upload de Cuestionario

**Con PowerShell**:
```powershell
# Asegúrate de tener el JWT en la variable de entorno
$jwt = $env:QUESTIONNAIRE_JWT

# Crear formulario multipart
$filePath = "C:\ruta\al\cuestionario.xlsx"
$boundary = [System.Guid]::NewGuid().ToString()

$bodyLines = @(
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="cuestionario.xlsx"',
    'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '',
    [System.IO.File]::ReadAllText($filePath),
    "--$boundary",
    'Content-Disposition: form-data; name="cliente"',
    '',
    'ING',
    "--$boundary",
    'Content-Disposition: form-data; name="nombre_formulario"',
    '',
    'Test Cuestionario v1',
    "--$boundary",
    'Content-Disposition: form-data; name="producto_afectado"',
    '',
    'Therefore',
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

$response = Invoke-RestMethod -Uri "http://localhost:3002/api/questionnaires/upload" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $jwt"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    } `
    -Body $body

Write-Host "✅ Cuestionario subido:"
$response | ConvertTo-Json

# Guardar el ID para el siguiente test
$questionnaireId = $response.id
$env:QUESTIONNAIRE_ID = $questionnaireId
```

**Response esperada (202 Accepted)**:
```json
{
  "message": "Cuestionario recibido y en procesamiento",
  "id": 1,
  "estado": "pendiente",
  "cliente": "ING",
  "nombre_formulario": "Test Cuestionario v1"
}
```

### Test 2: Consultar Estado (polling)

**Con PowerShell**:
```powershell
$jwt = $env:QUESTIONNAIRE_JWT
$id = $env:QUESTIONNAIRE_ID

# Polling cada 5 segundos hasta que esté completado
do {
    $status = Invoke-RestMethod -Uri "http://localhost:3002/api/questionnaires/$id/status" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $jwt" }
    
    Write-Host "`n⏳ Estado: $($status.estado)"
    
    if ($status.estado -eq "procesando") {
        $porcentaje = $status.progreso.porcentaje
        Write-Host "   Progreso: $porcentaje% ($($status.progreso.procesadas)/$($status.progreso.total))"
        Start-Sleep -Seconds 5
    }
    elseif ($status.estado -eq "completado") {
        Write-Host "✅ Procesamiento completado!"
        Write-Host "   Total preguntas: $($status.total_preguntas)"
        Write-Host "`n📊 Estadísticas:"
        $status.estadisticas | ConvertTo-Json -Depth 3
        
        Write-Host "`n📋 Primeras 5 preguntas:"
        $status.preguntas | Select-Object -First 5 | ForEach-Object {
            Write-Host "`n[$($_.id)] $($_.hoja) - $($_.seccion)"
            Write-Host "   Pregunta: $($_.texto_pregunta)"
            Write-Host "   Confianza: $($_.confidence) | Método: $($_.detection_method)"
            Write-Host "   Celda: $($_.cell_ref) → Respuesta: $($_.answer_cell_ref)"
        }
        
        # Guardar resultado completo en JSON
        $status | ConvertTo-Json -Depth 10 | Out-File "resultado_cuestionario_$id.json"
        Write-Host "`n💾 Resultado completo guardado en: resultado_cuestionario_$id.json"
        
        break
    }
    elseif ($status.estado -eq "error") {
        Write-Host "❌ Error en procesamiento:"
        Write-Host "   $($status.mensaje_error)"
        break
    }
} while ($status.estado -ne "completado")
```

### Test 3: Verificación Manual en Supabase

```sql
-- En Supabase SQL Editor

-- Ver formulario creado
SELECT * FROM formularios ORDER BY id DESC LIMIT 1;

-- Ver preguntas extraídas
SELECT 
    id, hoja, seccion, 
    LEFT(texto_pregunta, 80) as pregunta,
    detection_method, confidence
FROM formulario_preguntas_extraidas
WHERE formulario_id = 1  -- Cambiar por tu ID
ORDER BY id
LIMIT 20;

-- Estadísticas de calidad
SELECT 
    detection_method,
    confidence,
    COUNT(*) as total
FROM formulario_preguntas_extraidas
WHERE formulario_id = 1
GROUP BY detection_method, confidence;
```

---

## 🐛 Troubleshooting

### Error: "No token provided"
**Causa**: Falta el JWT o está mal formateado.  
**Solución**: Verificar que `$env:QUESTIONNAIRE_JWT` esté definido y empiece por "eyJ..."

### Error: "Error al guardar el fichero"
**Causa**: Bucket de Supabase no existe o no tiene permisos.  
**Solución**: Ejecutar `scripts/setup-questionnaires-bucket.sql`

### Error: "relation 'formularios' does not exist"
**Causa**: No se ejecutó la migración de BD.  
**Solución**: Ejecutar `supabase/migrations/20260710_create_questionnaires_tables.sql`

### Backend no arranca
**Solución**: Verificar que el puerto 3002 esté libre:
```powershell
Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
# Si hay algo, matar el proceso o cambiar el puerto en server.js
```

### Frontend no arranca
**Solución**: Verificar que el puerto 5173 esté libre:
```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```

---

## 📊 Métricas de Calidad Esperadas

Para un cuestionario bien estructurado (tipo ING):
- ✅ **Confianza alta**: ≥90%
- ✅ **Confianza baja**: ≤10%
- ✅ **Sin sección**: ≤5%
- ✅ **Tiempo de procesamiento**: ~30s para 500 preguntas

---

## 🔗 URLs de Referencia

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3002
- **Health Check**: http://localhost:3002/api/health
- **Supabase Dashboard**: https://vvehigbigvqkbgavnqkr.supabase.co

---

**Nota**: Si no tienes un fichero Excel de cuestionario real, puedes crear uno simple en Excel con las columnas `Pregunta | Respuesta | Categoría` y unas 10-20 filas de ejemplo para probar el flujo completo.
