# Guía de Uso - Módulo de Cuestionarios de Seguridad IT

## 🎯 Flujo Completo de Uso

### 1. Subir Cuestionario Excel

1. Ir a **http://localhost:5173/questionnaires**
2. Rellenar formulario:
   - **Cliente**: Nombre del cliente (ej: ING, BBVA)
   - **Nombre Formulario**: Nombre descriptivo del cuestionario
   - **Producto Afectado**: Therefore / DOCAI / Corporativo / Mixto
3. **Arrastrar fichero Excel** (.xlsx, máx 20MB) o hacer click para seleccionar
4. Click en **"Subir y Procesar Cuestionario"**

**Resultado**: El cuestionario se procesa automáticamente en background (5-30 segundos según tamaño)

---

### 2. Monitorear Procesamiento

- La tabla se actualiza automáticamente cada 5 segundos
- Estados posibles:
  - ⏳ **Pendiente**: En cola para procesamiento
  - 🔄 **Procesando**: Extrayendo preguntas (con progress bar)
  - ✅ **Completado**: Listo para generar respuestas
  - ❌ **Error**: Falló el procesamiento (ver mensaje de error)

---

### 3. Revisar Preguntas Extraídas

1. Click en **"Ver"** en la fila del cuestionario
2. Se abre modal con:
   - **Estadísticas**: Total, confianza alta/baja, método de detección
   - **Tabla de preguntas**: Todas las preguntas extraídas
3. **Expandir** cualquier fila para ver:
   - Pregunta completa
   - Respuesta existente (si la había en el Excel original)
   - Evidencia/notas
   - Celdas de origen (pregunta y respuesta)

---

### 4. Generar Respuestas con IA

**Opción A: Desde la tabla**
1. Click en **"Generar IA"** en la fila del cuestionario

**Opción B: Desde el modal de detalles**
1. Abrir detalles del cuestionario
2. Click en **"Generar Respuestas con IA"** (footer del modal)

**Proceso**:
- Se genera una respuesta técnica para cada pregunta sin respuesta
- Usa AWS Bedrock (Claude) con contexto del banco de conocimiento
- Respeta respuestas existentes (no sobrescribe)
- Procesamiento en lotes de 5 preguntas (1s entre lotes)
- Duración aproximada: **1-3 minutos** para 100 preguntas

**Mensaje final**: "X respuestas generadas correctamente"

---

### 5. Descargar Excel Completado

**Opción A: Desde la tabla**
1. Click en **"Descargar"** en la fila del cuestionario

**Opción B: Desde el modal de detalles**
1. Abrir detalles del cuestionario
2. Click en **"Descargar Excel Completado"** (footer del modal)

**Resultado**:
- Se descarga fichero: `{Cliente}_{Formulario}_COMPLETADO.xlsx`
- Contiene el Excel original con las respuestas rellenadas
- Respuestas en **color azul** para distinguirlas
- Las celdas tienen wrap text para mejor legibilidad

---

## 📊 Ejemplo Completo

### Cuestionario de Ejemplo: ING Security Compliance

1. **Upload**: 
   - Cliente: ING
   - Formulario: Third Party IT Security Compliance v3
   - Producto: Therefore
   - Fichero: cuestionario_ing_2026.xlsx (487 preguntas)

2. **Procesamiento** (30 segundos):
   - Estado: Procesando... 45% (220/487)
   - → Estado: Completado ✅
   - 487 preguntas extraídas
   - Confianza alta: 450 (92%)
   - Confianza baja: 37 (8%)

3. **Generar Respuestas** (2 minutos):
   - Click "Generar IA"
   - Progreso: "Generando respuestas con IA..."
   - → "450 respuestas generadas correctamente"
   - (37 ya tenían respuesta existente)

4. **Descargar**:
   - Click "Descargar"
   - → `ING_Third_Party_IT_Security_Compliance_v3_COMPLETADO.xlsx`
   - Abrir en Excel → Todas las respuestas rellenadas en azul

---

## 🔍 Detalles de Preguntas Extraídas

### Campos Mostrados

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Hoja** | Nombre de la hoja Excel | "Questions" |
| **Sección** | Categoría/sección de la pregunta | "1. AUTENTICACIÓN Y AUTORIZACIÓN" |
| **Pregunta** | Texto de la pregunta | "¿Dispone de autenticación multifactor?" |
| **Confianza** | alta / baja | alta (verde), baja (naranja) |
| **Método** | header / heuristic | header (azul), heuristic (morado) |

### Al Expandir una Pregunta

- **Pregunta completa**: Texto íntegro
- **Respuesta existente**: Si ya había respuesta en el Excel
- **Evidencia**: Notas o evidencias documentales
- **Celda pregunta**: Referencia (ej: C12)
- **Celda respuesta**: Dónde se escribirá la respuesta (ej: D12)

---

## 🤖 Cómo Funciona la Generación de Respuestas

### Banco de Conocimiento

El sistema tiene información técnica detallada sobre:

#### Therefore™
- Métodos de autenticación (AD, LDAP, local)
- Cifrado (TLS 1.2/1.3, TDE en SQL Server)
- Permisos (RBAC granular)
- Backups (SQL Server + file server)
- Alta disponibilidad (cluster SQL + IIS load balancing)
- Cumplimiento (ISO 27001, GDPR, SOC 2)

#### DOCAI
- Autenticación (OAuth 2.0, JWT, API Keys)
- Cifrado (TLS 1.3, AES-256, AWS KMS)
- Procesamiento IA (AWS Bedrock, no retiene datos)
- Infraestructura (React/Vercel, Node/Render, Supabase)
- Capacidades IA (clasificación, extracción, validación)

#### Corporativo
- Formación anual en ciberseguridad
- Políticas de acceso (least privilege, revisión trimestral)
- Red (firewall Fortinet, VPN MFA, IDS/IPS)
- Respuesta ante incidentes (CSIRT 24/7)
- Continuidad (plan DR, RPO 1h, RTO 4h)

### Detección Automática de Categoría

El sistema detecta la categoría de cada pregunta por palabras clave y añade contexto específico:

| Categoría | Keywords | Contexto Añadido |
|-----------|----------|------------------|
| Autenticación | autenticación, login, MFA, contraseña | Métodos auth del producto |
| Cifrado | cifrado, encryption, TLS, SSL | Protocolos y algoritmos |
| Permisos | permisos, acceso, roles, autorización | Modelo RBAC, granularidad |
| Backup | backup, copia, seguridad, recovery | Frecuencia, métodos, RPO/RTO |
| Red | firewall, VPN, segmentación | Componentes de red |
| Incidentes | incidente, brecha, vulnerabilidad | Procedimientos CSIRT |
| Auditoría | auditoría, log, trazabilidad | Sistemas de logging |

### Calidad de Respuestas

**Características**:
- ✅ Técnicas y precisas (usa info real del banco de conocimiento)
- ✅ Concisas (máx 150 palabras / 2-3 frases)
- ✅ Formato adecuado (Sí/No + detalles técnicos)
- ✅ Terminología correcta (Therefore™ 2025, DOCAI 2.0)
- ✅ Respuestas deterministas (temperature 0.3)

**Ejemplo de Respuesta Generada**:

> **Pregunta**: ¿Dispone de sistema de autenticación multifactor?
> 
> **Respuesta**: Sí. Therefore™ soporta autenticación multifactor mediante integración con proveedores SAML/OAuth. Para usuarios administradores, se requiere obligatoriamente doble autenticación. El sistema se integra con Active Directory y LDAP para gestión centralizada de credenciales.

---

## 📥 Formato del Excel Descargado

### Estructura

- **Contenido**: Excel original intacto
- **Respuestas añadidas**: En las celdas especificadas por `answer_cell_ref`
- **Formato de respuestas**:
  - Color de texto: **Azul (#0066CC)**
  - Wrap text: **Activado**
  - Alineación vertical: **Superior**

### Ejemplo Visual

```
| Pregunta                              | Respuesta                                    |
|---------------------------------------|----------------------------------------------|
| ¿Dispone de autenticación MFA?        | Sí. Therefore™ soporta MFA mediante...      |
|                                       | (texto en azul, con wrap)                    |
```

---

## ⚙️ Configuración Técnica

### Variables de Entorno Necesarias

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# AWS Bedrock
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
```

### Límites y Rendimiento

| Concepto | Límite | Notas |
|----------|--------|-------|
| Tamaño fichero Excel | 20 MB | Suficiente para >1000 preguntas |
| Preguntas por lote (generación) | 5 | Para no saturar Bedrock |
| Pausa entre lotes | 1 segundo | Evita rate limiting |
| Timeout Bedrock por pregunta | 30 segundos | Configurable |
| Polling frontend | 5 segundos | Actualización automática |
| Tiempo estimado 100 preguntas | 1-2 minutos | Depende de Bedrock |
| Tiempo estimado 500 preguntas | 5-8 minutos | 100 lotes de 5 |

---

## 🐛 Troubleshooting

### Error: "No token provided"
**Causa**: No estás autenticado  
**Solución**: Refresca la página y vuelve a hacer login

### Error: "Bucket not found"
**Causa**: Bucket 'questionnaires' no existe  
**Solución**: Ejecutar `scripts/setup-questionnaires-bucket.sql`

### Error: "Error al generar respuestas"
**Causa**: Credenciales de AWS Bedrock incorrectas  
**Solución**: Verificar variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

### Procesamiento se queda en "Procesando..."
**Causa**: Error en background, revisar logs del backend  
**Solución**: Ver logs de nodemon en consola del servidor

### Respuestas generadas son genéricas
**Causa**: Bedrock no tiene contexto suficiente  
**Solución**: Banco de conocimiento ya incluido, debería dar respuestas específicas

### Excel descargado no tiene respuestas
**Causa**: Las preguntas no tienen `respuesta_existente` en la BD  
**Solución**: Ejecutar "Generar IA" primero

---

## 📈 Métricas de Calidad

Para un cuestionario típico de seguridad IT (tipo ING):

- ✅ **Extracción**: >90% confianza alta
- ✅ **Generación**: 100% de preguntas respondidas
- ✅ **Precisión**: Respuestas técnicas con info real del producto
- ✅ **Velocidad**: <3 min para 100 preguntas
- ✅ **Formato**: Excel profesional listo para enviar

---

## 🚀 Próximos Pasos (Roadmap)

- [ ] **v1.1**: Matching con preguntas normalizadas (embeddings)
- [ ] **v1.2**: Banco de preguntas frecuentes con respuestas curadas
- [ ] **v1.3**: Revisión humana de respuestas (workflow de aprobación)
- [ ] **v1.4**: Exportar a PDF con formato corporativo
- [ ] **v2.0**: Migración a stack on-premise (SQL Server + Qdrant + Ollama)

---

**Versión**: v1.0  
**Última actualización**: 2026-07-11
