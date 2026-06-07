# Análisis de Depuración - TheJTool

**Fecha:** 2026-06-04  
**Objetivo:** Eliminar archivos innecesarios y dar consistencia al código sin romper funcionalidades

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Archivos | Tamaño | Acción |
|-----------|----------|--------|--------|
| **Código activo** | 33 JS/JSX | ~500 KB | ✅ MANTENER |
| **Temporales/Logs** | 8 archivos | ~15 KB | ❌ ELIMINAR |
| **Tests/Previews** | 8 archivos | ~25 KB | ❌ ELIMINAR |
| **Documentación duplicada** | ~40 archivos | ~800 KB | 🔄 CONSOLIDAR |
| **Versión antigua (_reference)** | ~80 archivos | ~2 MB | ❌ ELIMINAR COMPLETO |
| **Checkpoints/Reports** | 12 archivos | ~120 KB | 🔄 ARCHIVAR |

---

## 🔴 ELIMINAR INMEDIATAMENTE

### 1. Logs y temporales
```
❌ dev-server.log (9.4 KB)
❌ server.log (201 bytes)
❌ .vscode/launch.json (duplicado en _reference)
```

### 2. Archivos de test/preview temporales
```
❌ test_grid_preview.js
❌ test_grid_preview.jsx
❌ test_multi_category.csv
❌ verify_ctgryno.js
❌ verify_xml_structure.js
❌ preview-gantt.js
❌ screenshot.js
❌ test-results/.last-run.json
```

### 3. CSV de ejemplo de desarrollo
```
❌ PRL_Examenes_Preguntas_CSV_TablaParent.csv
```

### 4. Scripts de migración ya ejecutados
```
❌ run-migration.js (migración completada)
```

### 5. **CARPETA COMPLETA _reference/** (versión antigua 100% duplicada)
```
❌ _reference/old-version/ (2 MB completo)
   - Incluye código viejo, docs duplicados, ref/ duplicado
   - TODO está en docs/therefore/ actualizado
```

---

## 🟡 CONSOLIDAR/REORGANIZAR

### 1. Documentación duplicada en docs/therefore/

**DUPLICADOS DETECTADOS:**
```
docs/therefore/JJ - eform-import-export-guide.md (11.3 KB)
docs/therefore/JJ_-_eform-import-export-guide.md (10.4 KB)  ← MANTENER (más reciente)

docs/therefore/JJ-therefore-eforms-data-loading-guide (2).md
docs/therefore/JJ-therefore-eforms-data-loading-guide.md  ← MANTENER
```

**ACCIÓN:** Eliminar versiones con espacios/paréntesis, mantener con guiones bajos.

### 2. XMLs de muestra gigantes
```
🔄 docs/samples/TheConfiguration_Complete.xml (5.5 MB)
🔄 docs/samples/TheConfiguration_SampleCtgry.xml (1.2 MB)
🔄 docs/samples/ANALYSIS_FirstCategory.xml (65 KB)
```

**ACCIÓN:** Mover a `docs/samples/archive/` (útiles como referencia, pero no en raíz)

### 3. Checkpoints y análisis intermedios
```
🔄 CHECKPOINT_2026-05-24.md
🔄 CHECKPOINT_2026-05-25.md
🔄 ARCHITECTURE_CATEGORYBUILDER.md
🔄 EDITOR_UI_PREVIEW.md
🔄 IMPLEMENTACION_COMPLETA.md
🔄 PREVIEW_ENHANCEMENT.md
🔄 TABLA_PARENT_STRUCTURE.md
🔄 TEST_PLAN_TablaParent_SinPestaña.md
🔄 THEREFORE_REPORTER_BUILD_SUMMARY.md
🔄 XML_STRUCTURE_FIX_REPORT.md
```

**ACCIÓN:** Mover a `docs/development-history/`

### 4. Documentación de Therefore Reporter dispersa
```
🔄 docs/THEREFORE_REPORTER_*.md (6 archivos)
```

**ACCIÓN:** Consolidar en un único `docs/THEREFORE_REPORTER.md` con secciones

---

## ✅ MANTENER (Código Activo)

### Estructura src/ (33 archivos - TODOS ACTIVOS)

#### **Vistas usadas en App.jsx:**
```js
✅ src/views/Home.jsx
✅ src/views/Login.jsx
✅ src/views/UserProfile.jsx
✅ src/views/UserManager.jsx
✅ src/views/VerticalesManager.jsx
✅ src/views/TenantManager.jsx
✅ src/views/WebServicesManager.jsx
✅ src/views/EFormBuilder.jsx
✅ src/views/EFormManager.jsx
✅ src/views/TemplateManager.jsx
✅ src/views/CategoryBuilder.jsx
✅ src/views/DocumentGenerator.jsx
✅ src/views/ThereforeReporter.jsx
✅ src/views/BedrrockPanel.jsx
✅ src/views/Placeholder.jsx
```

#### **Servicios:**
```js
✅ src/services/authService.js
✅ src/services/userService.js
✅ src/services/storageService.js
✅ src/services/thereforeService.js
✅ src/services/verticalesService.js
✅ src/services/ganttService.js
```

#### **Hooks:**
```js
✅ src/hooks/useAuth.js
✅ src/hooks/useRole.js
✅ src/hooks/useTheme.js
```

#### **Componentes:**
```js
✅ src/components/ProtectedRoute.jsx
✅ src/components/AdminRoute.jsx
✅ src/components/UserDropdown.jsx
✅ src/components/GanttViewer.jsx
```

#### **Configuración:**
```js
✅ src/config/supabaseClient.js
✅ src/config/antdTheme.js
✅ src/context/AuthContext.jsx
✅ src/context/ThemeContext.jsx
✅ src/constants/documentTypes.js
✅ src/debug.js (útil para desarrollo)
```

---

## 🔧 API Backend (verificar uso)

```
✅ api/analyze.js (22 KB) - usado por DocumentGenerator
✅ api/bedrock.js (7 KB) - AWS Bedrock panel
✅ api/bedrockClient.js (4 KB) - cliente Bedrock
✅ api/build-docx.js (36 KB) - generación DOCX
✅ api/generate-gantt.js (10 KB) - Gantt viewer
✅ api/verticales.js (7 KB) - CRUD verticales
✅ api/execute-sql.js (2.5 KB) - ejecución SQL directa
✅ api/update-user-role.js (2 KB) - gestión roles

✅ api/_lib/knowledge/*.js (base conocimiento Bedrock)
✅ api/_lib/database/verticalesDb.js
⚠️ api/_lib/migrations/*.js - YA EJECUTADAS, considerar archivar
```

---

## 📁 ESTRUCTURA PROPUESTA POST-LIMPIEZA

```
TheJTool/
├── api/                              # Backend Express
│   ├── _lib/
│   │   ├── database/
│   │   ├── knowledge/
│   │   └── migrations/              # ← Mover a docs/migrations/
│   ├── analyze.js
│   ├── bedrock.js
│   ├── bedrockClient.js
│   ├── build-docx.js
│   ├── generate-gantt.js
│   ├── verticales.js
│   ├── execute-sql.js
│   └── update-user-role.js
│
├── src/                             # Frontend React
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── context/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   └── views/
│
├── docs/
│   ├── therefore/                   # Docs Therefore (limpias)
│   ├── ejemplos/                    # Ejemplos DOCAI/IVNEOS
│   ├── samples/
│   │   └── archive/                # XMLs grandes (nueva)
│   ├── development-history/         # Checkpoints (nueva)
│   └── migrations/                  # Scripts migración (nueva)
│
├── public/
│   └── TheConfiguration_categoria_PLANTILLA.xml
│
├── .claude/
├── CLAUDE.md
├── package.json
├── server.js
└── vite.config.js
```

---

## 🎯 PLAN DE EJECUCIÓN (8 PASOS)

### PASO 1: Backup de seguridad
```bash
git add -A
git commit -m "checkpoint: pre-cleanup backup"
git push
```

### PASO 2: Eliminar temporales y logs
```bash
rm dev-server.log server.log
rm test_*.js test_*.jsx test_*.csv
rm verify_*.js preview-*.js screenshot.js run-migration.js
rm -rf test-results/
rm PRL_Examenes_Preguntas_CSV_TablaParent.csv
```

### PASO 3: Eliminar _reference/ completo
```bash
rm -rf _reference/
```

### PASO 4: Consolidar docs duplicados
```bash
rm "docs/therefore/JJ - eform-import-export-guide.md"
rm "docs/therefore/JJ-therefore-eforms-data-loading-guide (2).md"
```

### PASO 5: Reorganizar checkpoints
```bash
mkdir docs/development-history
mv CHECKPOINT_*.md docs/development-history/
mv ARCHITECTURE_*.md docs/development-history/
mv EDITOR_*.md docs/development-history/
mv IMPLEMENTACION_*.md docs/development-history/
mv PREVIEW_*.md docs/development-history/
mv TABLA_*.md docs/development-history/
mv TEST_PLAN_*.md docs/development-history/
mv *_SUMMARY.md docs/development-history/
mv XML_*.md docs/development-history/
```

### PASO 6: Archivar XMLs grandes
```bash
mkdir -p docs/samples/archive
mv docs/samples/TheConfiguration_Complete.xml docs/samples/archive/
mv docs/samples/TheConfiguration_SampleCtgry.xml docs/samples/archive/
mv docs/samples/ANALYSIS_FirstCategory.xml docs/samples/archive/
```

### PASO 7: Consolidar docs Therefore Reporter
```bash
# (Crear docs/THEREFORE_REPORTER.md unificado)
# (Eliminar 6 archivos individuales)
```

### PASO 8: Actualizar .gitignore
```gitignore
# Añadir:
*.log
test_*.js
test_*.jsx
preview-*.js
verify_*.js
screenshot.js
test-results/
dev-server.log
server.log
```

---

## ⚠️ VERIFICACIONES POST-LIMPIEZA

### Funcionalidades críticas a verificar:

1. **Login y autenticación** → UserManager, roles
2. **EForm Builder** → Generación XML, templates
3. **Category Builder** → CSV import, XML export
4. **Therefore Reporter** → 3 vistas, exportación
5. **Document Generator** → Bedrock, DOCX, Gantt
6. **Verticales Manager** → CRUD Supabase
7. **Tenant Manager** → Conexiones Therefore

### Comandos de verificación:
```bash
npm run dev          # Frontend debe arrancar sin errores
node server.js       # Backend debe arrancar sin errores
npm run build        # Build debe completar sin warnings
```

---

## 📈 IMPACTO ESTIMADO

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Total archivos** | ~180 | ~90 | -50% |
| **Tamaño repo** | ~10 MB | ~4 MB | -60% |
| **Docs duplicados** | 40 | 0 | -100% |
| **Archivos raíz** | 25 | 8 | -68% |
| **Claridad estructura** | 3/10 | 9/10 | +200% |

---

## ✅ SIGUIENTE FASE: CONSISTENCIA DE CÓDIGO

**Después de la limpieza, abordar:**

1. Estandarizar nombres de componentes (PascalCase consistente)
2. Unificar manejo de errores (toast vs message vs console)
3. Extraer strings repetidos a constantes
4. Consolidar estilos inline a clases CSS
5. Documentar props de componentes (JSDoc)
6. Añadir PropTypes o migrar a TypeScript
7. **Implementar i18n** (después de todo lo anterior)

---

## 🚀 LISTO PARA EJECUTAR

¿Procedo con el PASO 1 (backup) y luego ejecuto la limpieza completa?
