# 📦 Guía de Migración de TheJTool a Nuevo Ordenador

Esta guía te ayudará a migrar completamente el proyecto TheJTool a un nuevo ordenador de desarrollo, incluyendo código, configuración y memoria de Claude Code.

---

## 📋 CHECKLIST DE MIGRACIÓN

- [ ] 1. Clonar repositorio
- [ ] 2. Copiar archivo `.env`
- [ ] 3. Copiar memoria de Claude Code
- [ ] 4. Instalar dependencias Node.js
- [ ] 5. Verificar funcionamiento

---

## 🖥️ OPCIÓN A: Script Automático (Windows PowerShell)

### 1. En el **ORDENADOR ACTUAL**

Exporta el archivo `.env` y la memoria de Claude:

```powershell
# Ejecutar en PowerShell (como Administrador)
cd C:\GitHub\TheJTool

# Crear carpeta de exportación
New-Item -ItemType Directory -Path ".\EXPORT_MIGRACION" -Force

# Copiar .env
Copy-Item ".env" ".\EXPORT_MIGRACION\.env"

# Copiar memoria de Claude Code
$memoriaOrigen = "C:\Users\$env:USERNAME\.claude\projects\c--GitHub-TheJTool"
if (Test-Path $memoriaOrigen) {
    Copy-Item -Recurse $memoriaOrigen ".\EXPORT_MIGRACION\claude_memory"
    Write-Host "✅ Memoria de Claude exportada" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se encontró memoria de Claude en: $memoriaOrigen" -ForegroundColor Yellow
}

Write-Host "`n✅ Archivos exportados en: .\EXPORT_MIGRACION" -ForegroundColor Green
Write-Host "Copia esta carpeta al nuevo ordenador" -ForegroundColor Cyan
```

**Copia la carpeta `EXPORT_MIGRACION` a un USB o nube.**

---

### 2. En el **NUEVO ORDENADOR**

Ejecuta este script en PowerShell:

```powershell
# ═══════════════════════════════════════════════════════════════════
# SCRIPT DE MIGRACIÓN AUTOMÁTICA - TheJTool
# ═══════════════════════════════════════════════════════════════════

# Configuración
$REPO_URL = "https://github.com/JJ-Aneker/TheJTool.git"
$DESTINO = "C:\GitHub\TheJTool"
$EXPORT_PATH = "RUTA_A_TU_CARPETA_EXPORT_MIGRACION"  # ← CAMBIAR ESTO

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MIGRACIÓN DE TheJTool" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

# 1. Clonar repositorio
Write-Host "`n[1/5] Clonando repositorio..." -ForegroundColor Yellow
if (-not (Test-Path $DESTINO)) {
    New-Item -ItemType Directory -Path (Split-Path $DESTINO) -Force | Out-Null
    git clone $REPO_URL $DESTINO
    Write-Host "✅ Repositorio clonado" -ForegroundColor Green
} else {
    Write-Host "⚠️  El directorio ya existe, saltando clone" -ForegroundColor Yellow
}

cd $DESTINO

# 2. Copiar .env
Write-Host "`n[2/5] Copiando archivo .env..." -ForegroundColor Yellow
if (Test-Path "$EXPORT_PATH\.env") {
    Copy-Item "$EXPORT_PATH\.env" ".env" -Force
    Write-Host "✅ Archivo .env copiado" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: No se encontró .env en $EXPORT_PATH" -ForegroundColor Red
    Write-Host "   Crea manualmente el archivo .env con las credenciales" -ForegroundColor Yellow
}

# 3. Copiar memoria de Claude
Write-Host "`n[3/5] Copiando memoria de Claude Code..." -ForegroundColor Yellow
$memoriaDestino = "C:\Users\$env:USERNAME\.claude\projects\c--GitHub-TheJTool"
if (Test-Path "$EXPORT_PATH\claude_memory") {
    New-Item -ItemType Directory -Path $memoriaDestino -Force | Out-Null
    Copy-Item -Recurse "$EXPORT_PATH\claude_memory\*" $memoriaDestino -Force
    Write-Host "✅ Memoria de Claude copiada" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se encontró memoria de Claude en export" -ForegroundColor Yellow
}

# 4. Instalar dependencias
Write-Host "`n[4/5] Instalando dependencias de Node.js..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR instalando dependencias" -ForegroundColor Red
}

# 5. Verificar instalación
Write-Host "`n[5/5] Verificando instalación..." -ForegroundColor Yellow

$checks = @(
    @{ Name = ".env"; Path = ".env" },
    @{ Name = "node_modules"; Path = "node_modules" },
    @{ Name = "package.json"; Path = "package.json" },
    @{ Name = "Memoria Claude"; Path = $memoriaDestino }
)

foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "  ✅ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($check.Name) NO ENCONTRADO" -ForegroundColor Red
    }
}

# Instrucciones finales
Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ MIGRACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`nPróximos pasos:" -ForegroundColor Yellow
Write-Host "  1. npm run server    # Terminal 1 - Backend (puerto 3002)" -ForegroundColor White
Write-Host "  2. npm run dev       # Terminal 2 - Frontend (puerto 5173)" -ForegroundColor White
Write-Host "  3. Abrir http://localhost:5173" -ForegroundColor White
Write-Host "`nVerifica que aparece el mosaico de portadas guardadas" -ForegroundColor Cyan
```

---

## 🐧 OPCIÓN B: Script Automático (Linux/Mac Bash)

### 1. En el **ORDENADOR ACTUAL**

```bash
#!/bin/bash
# Exportar configuración y memoria

cd ~/GitHub/TheJTool  # o la ruta donde esté tu proyecto

mkdir -p EXPORT_MIGRACION

# Copiar .env
cp .env EXPORT_MIGRACION/.env

# Copiar memoria de Claude
MEMORIA_ORIGEN="$HOME/.claude/projects/c--GitHub-TheJTool"
if [ -d "$MEMORIA_ORIGEN" ]; then
    cp -r "$MEMORIA_ORIGEN" EXPORT_MIGRACION/claude_memory
    echo "✅ Memoria de Claude exportada"
else
    echo "⚠️  No se encontró memoria de Claude"
fi

echo "✅ Archivos exportados en: ./EXPORT_MIGRACION"
```

---

### 2. En el **NUEVO ORDENADOR**

```bash
#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# SCRIPT DE MIGRACIÓN AUTOMÁTICA - TheJTool (Linux/Mac)
# ═══════════════════════════════════════════════════════════════════

REPO_URL="https://github.com/JJ-Aneker/TheJTool.git"
DESTINO="$HOME/GitHub/TheJTool"
EXPORT_PATH="/ruta/a/tu/EXPORT_MIGRACION"  # ← CAMBIAR ESTO

echo "═══════════════════════════════════════════════"
echo "  MIGRACIÓN DE TheJTool"
echo "═══════════════════════════════════════════════"

# 1. Clonar repositorio
echo -e "\n[1/5] Clonando repositorio..."
if [ ! -d "$DESTINO" ]; then
    mkdir -p "$(dirname "$DESTINO")"
    git clone "$REPO_URL" "$DESTINO"
    echo "✅ Repositorio clonado"
else
    echo "⚠️  El directorio ya existe"
fi

cd "$DESTINO"

# 2. Copiar .env
echo -e "\n[2/5] Copiando archivo .env..."
if [ -f "$EXPORT_PATH/.env" ]; then
    cp "$EXPORT_PATH/.env" .env
    echo "✅ Archivo .env copiado"
else
    echo "❌ ERROR: No se encontró .env"
fi

# 3. Copiar memoria de Claude
echo -e "\n[3/5] Copiando memoria de Claude..."
MEMORIA_DESTINO="$HOME/.claude/projects/c--GitHub-TheJTool"
if [ -d "$EXPORT_PATH/claude_memory" ]; then
    mkdir -p "$MEMORIA_DESTINO"
    cp -r "$EXPORT_PATH/claude_memory/"* "$MEMORIA_DESTINO/"
    echo "✅ Memoria de Claude copiada"
else
    echo "⚠️  No se encontró memoria de Claude"
fi

# 4. Instalar dependencias
echo -e "\n[4/5] Instalando dependencias..."
npm install && echo "✅ Dependencias instaladas" || echo "❌ ERROR instalando dependencias"

# 5. Verificación
echo -e "\n[5/5] Verificando instalación..."
[ -f ".env" ] && echo "  ✅ .env" || echo "  ❌ .env NO ENCONTRADO"
[ -d "node_modules" ] && echo "  ✅ node_modules" || echo "  ❌ node_modules NO ENCONTRADO"
[ -d "$MEMORIA_DESTINO" ] && echo "  ✅ Memoria Claude" || echo "  ❌ Memoria Claude NO ENCONTRADA"

echo -e "\n═══════════════════════════════════════════════"
echo "  ✅ MIGRACIÓN COMPLETADA"
echo "═══════════════════════════════════════════════"
echo -e "\nPróximos pasos:"
echo "  1. npm run server    # Terminal 1"
echo "  2. npm run dev       # Terminal 2"
echo "  3. Abrir http://localhost:5173"
```

---

## 🔧 OPCIÓN C: Migración Manual Paso a Paso

Si prefieres hacerlo manualmente sin scripts:

### 1. Clonar el repositorio

```bash
git clone https://github.com/JJ-Aneker/TheJTool.git
cd TheJTool
```

### 2. Crear archivo `.env`

Copia el contenido de tu `.env` actual. Debe contener:

```env
# Supabase
VITE_SUPABASE_URL=https://tuinstancia.supabase.co
VITE_SUPABASE_ANON_KEY=tu_key_anon
SUPABASE_SERVICE_KEY=tu_service_key

# AWS Bedrock
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1

# Other
PORT=3002
NODE_ENV=development
```

### 3. Copiar memoria de Claude Code

**Windows:**
```
Desde: C:\Users\[TU_USUARIO_ACTUAL]\.claude\projects\c--GitHub-TheJTool\
Hasta: C:\Users\[TU_USUARIO_NUEVO]\.claude\projects\c--GitHub-TheJTool\
```

**Linux/Mac:**
```
Desde: ~/.claude/projects/c--GitHub-TheJTool/
Hasta: ~/.claude/projects/c--GitHub-TheJTool/
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Verificar funcionamiento

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

Abre http://localhost:5173 y verifica:
- ✅ Login funciona
- ✅ Aparece mosaico de portadas guardadas
- ✅ Generador de documentos funciona

---

## 📦 ARCHIVOS CRÍTICOS A NO PERDER

### 🔴 OBLIGATORIOS:
1. **`.env`** - Sin esto, nada funciona
2. **Repositorio Git** - El código completo

### 🟡 IMPORTANTES (pero recuperables):
1. **`C:\Users\[USER]\.claude\projects\c--GitHub-TheJTool\memory\`** - Memoria de Claude Code
   - Sin esto, Claude no recordará las decisiones técnicas del proyecto
   - Pero el código seguirá funcionando

### 🟢 OPCIONALES:
1. Archivos de test (`test-*.mjs`) - Útiles para desarrollo
2. `CLAUDE.md` - Ya está en el repo

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Ejecuta estos comandos para verificar:

```bash
# 1. Verificar Git
git status

# 2. Verificar dependencias
npm list --depth=0

# 3. Verificar .env
node -e "require('dotenv').config(); console.log('AWS_REGION:', process.env.AWS_REGION)"

# 4. Verificar memoria de Claude
# Windows
Test-Path C:\Users\$env:USERNAME\.claude\projects\c--GitHub-TheJTool\memory

# Linux/Mac
ls ~/.claude/projects/c--GitHub-TheJTool/memory
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Error: "Supabase connection failed"
Verifica que el `.env` tenga las URLs y keys correctas

### ❌ Error: "AWS Bedrock unauthorized"
Verifica las credenciales AWS en el `.env`

### ❌ No aparece mosaico de portadas
1. Verifica que las políticas RLS estén activas en Supabase
2. Comprueba la consola del navegador (F12) para errores

---

## 📞 CONTACTO

Si tienes problemas, revisa:
1. Los logs de la consola del navegador (F12)
2. Los logs del backend (terminal donde corre `npm run server`)
3. El archivo `CLAUDE.md` del proyecto

---

**Fecha de creación:** 2026-06-17  
**Versión del proyecto:** v0.1.0  
**Última limpieza:** 2026-06-17 (commit 32b7c74)
