# 🖥️ Requisitos de Software para Nueva Máquina - TheJTool

Esta guía detalla TODO el software que necesitas instalar en el nuevo ordenador de desarrollo **ANTES** de importar el proyecto.

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] 1. Git
- [ ] 2. Node.js (v18 o superior)
- [ ] 3. Editor de código (VS Code recomendado)
- [ ] 4. Claude Code CLI (opcional pero recomendado)
- [ ] 5. Navegador moderno (Chrome/Edge/Firefox)

---

## 1️⃣ GIT (OBLIGATORIO)

### Windows:
Descarga e instala desde: https://git-scm.com/download/win

**Durante la instalación:**
- ✅ Marca: "Git from the command line and also from 3rd-party software"
- ✅ Marca: "Use Windows' default console window"
- ✅ Editor: Visual Studio Code (o el que prefieras)

**Verificar instalación:**
```powershell
git --version
# Debe mostrar: git version 2.x.x
```

**Configurar usuario:**
```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install git

# macOS (con Homebrew)
brew install git
```

---

## 2️⃣ NODE.JS v18+ (OBLIGATORIO)

### Windows:
Descarga e instala desde: https://nodejs.org/

**Versión recomendada:** LTS (Long Term Support)

**Verificar instalación:**
```powershell
node --version
# Debe mostrar: v18.x.x o superior

npm --version
# Debe mostrar: 9.x.x o superior
```

### Linux/Mac:
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (con Homebrew)
brew install node@18
```

**Verificar:**
```bash
node --version
npm --version
```

---

## 3️⃣ EDITOR DE CÓDIGO (Recomendado: VS Code)

### Visual Studio Code:
Descarga desde: https://code.visualstudio.com/

**Extensiones recomendadas para VS Code:**
- ESLint
- Prettier - Code formatter
- ES7+ React/Redux/React-Native snippets
- GitLens
- Claude Code Extension (si usas Claude)

**Instalar extensiones desde terminal:**
```powershell
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension eamodio.gitlens
```

---

## 4️⃣ CLAUDE CODE CLI (OPCIONAL - Para mantener memoria)

Si quieres que Claude recuerde el contexto del proyecto:

### Windows (PowerShell como Administrador):
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Linux/Mac:
```bash
curl -fsSL https://claude.ai/install.sh | sh
```

**Verificar:**
```powershell
claude --version
```

**Iniciar sesión:**
```powershell
claude auth login
```

---

## 5️⃣ NAVEGADOR MODERNO (OBLIGATORIO)

El proyecto funciona en puerto 5173 (frontend). Necesitas un navegador actualizado:

- ✅ **Google Chrome** (recomendado) - https://www.google.com/chrome/
- ✅ **Microsoft Edge** - Ya instalado en Windows
- ✅ **Firefox** - https://www.mozilla.org/firefox/

---

## 📦 DEPENDENCIAS DEL PROYECTO (Se instalan automáticamente)

Estas dependencias se instalan con `npm install`, **NO las instales manualmente:**

### Backend:
- express (servidor HTTP)
- @supabase/supabase-js (base de datos)
- @aws-sdk/client-bedrock-runtime (IA - generación de documentos)
- docx (generación de archivos Word)
- cors, dotenv, etc.

### Frontend:
- react + react-dom
- antd (componentes UI)
- react-router-dom
- recharts (gráficas)
- i18next (internacionalización)

---

## 🔧 CONFIGURACIÓN ADICIONAL (Opcional)

### PowerShell Execution Policy (Solo Windows):
Si tienes problemas ejecutando scripts `.ps1`:

```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Git Bash (Windows):
Si prefieres usar Bash en Windows, Git ya lo incluye:
- Ruta: `C:\Program Files\Git\bin\bash.exe`

---

## ✅ VERIFICACIÓN FINAL - ANTES DE IMPORTAR

Ejecuta estos comandos para verificar que todo está instalado:

```powershell
# Git
git --version

# Node.js
node --version
npm --version

# Editor (VS Code)
code --version

# Claude (opcional)
claude --version
```

**Resultado esperado:**
```
git version 2.43.0
v18.19.0
9.8.0
1.85.0
claude 1.x.x
```

---

## 🚀 DESPUÉS DE VERIFICAR TODO

Una vez instalado todo el software, sigue con la importación:

### Opción A: Script Automático
```powershell
# Copia EXPORT_MIGRACION.zip a la nueva máquina
# Descomprime en una ubicación temporal

# Ejecuta (ajusta la ruta):
.\import-en-nuevo-ordenador.ps1 -ExportPath "C:\temp\EXPORT_MIGRACION"
```

### Opción B: Manual
Sigue la guía en [MIGRACION.md](MIGRACION.md)

---

## 📊 RESUMEN DE ESPACIO EN DISCO

Espacio requerido en la nueva máquina:

| Componente | Espacio |
|------------|---------|
| Git | ~200 MB |
| Node.js v18 | ~50 MB |
| VS Code | ~350 MB |
| Claude Code | ~100 MB |
| **Subtotal Software** | **~700 MB** |
| | |
| TheJTool (código) | ~50 MB |
| node_modules (después de npm install) | ~400 MB |
| **Subtotal Proyecto** | **~450 MB** |
| | |
| **TOTAL APROXIMADO** | **~1.2 GB** |

---

## 🆘 PROBLEMAS COMUNES

### ❌ "git no se reconoce como comando"
**Solución:** Reinicia la terminal después de instalar Git, o añade manualmente a PATH:
- Windows: `C:\Program Files\Git\bin`

### ❌ "node no se reconoce como comando"
**Solución:** Reinicia la terminal o verifica que Node esté en PATH

### ❌ "Cannot find module 'xxx'"
**Solución:** Ejecuta `npm install` en la carpeta del proyecto

### ❌ "Permission denied" al ejecutar scripts .ps1
**Solución:**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ "Puerto 3002 o 5173 ya en uso"
**Solución:**
```powershell
# Windows - matar proceso en puerto
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

---

## 📞 SOPORTE

Si tienes problemas:
1. Verifica que todas las versiones sean correctas
2. Revisa los logs de instalación
3. Consulta la documentación oficial de cada herramienta

---

## 🎯 SIGUIENTE PASO

Una vez instalado todo y verificado:

1. ✅ Copia `EXPORT_MIGRACION.zip` desde el ordenador actual
2. ✅ Descomprímelo en el nuevo ordenador
3. ✅ Ejecuta el script de importación
4. ✅ Verifica que funcione correctamente

---

**Fecha de creación:** 2026-06-17  
**Versión mínima de Node.js:** 18.0.0  
**Sistema operativo soportado:** Windows 10/11, Linux, macOS
