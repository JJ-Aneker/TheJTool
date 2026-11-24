# ⚙️ Configuración de Claude Code - Sin Confirmaciones

Esta es la configuración para que Claude Code NO pida confirmación al ejecutar comandos.

---

## 📄 **Archivo de configuración actual**

**Ubicación:** `C:\Users\[TU_USUARIO]\.claude\settings.json`

**Contenido completo:**

```json
{
  "autoApproveTools": true,
  "model": "claude-sonnet-4-5",
  "permissions": {
    "allow": [
      "Bash(*)",
      "PowerShell(*)",
      "Read(*)",
      "WebFetch(domain:localhost)"
    ],
    "additionalDirectories": [
      "C:\\GitHub",
      "C:\\Users\\Jimenezjj\\.claude"
    ]
  }
}
```

---

## 🚀 **Cómo aplicarlo en la NUEVA MÁQUINA**

### **Método 1: Crear el archivo manualmente**

```powershell
# 1. Crear carpeta .claude (si no existe)
New-Item -ItemType Directory -Path "$HOME\.claude" -Force

# 2. Crear archivo settings.json
@"
{
  "autoApproveTools": true,
  "model": "claude-sonnet-4-5",
  "permissions": {
    "allow": [
      "Bash(*)",
      "PowerShell(*)",
      "Read(*)",
      "WebFetch(domain:localhost)"
    ],
    "additionalDirectories": [
      "C:\\\\GitHub",
      "C:\\\\Users\\\\$env:USERNAME\\\\.claude"
    ]
  }
}
"@ | Out-File -FilePath "$HOME\.claude\settings.json" -Encoding UTF8
```

---

### **Método 2: Usando comandos de Claude CLI**

```powershell
# Instalar y autenticar Claude primero
claude auth login

# Luego configurar permisos
claude config set autoApproveTools true
claude config allow Bash(*)
claude config allow PowerShell(*)
claude config allow Read(*)
claude config allow WebFetch(domain:localhost)
```

---

## 📋 **Explicación de cada permiso**

| Permiso | Qué hace |
|---------|----------|
| `autoApproveTools: true` | Auto-aprobar herramientas sin pedir confirmación |
| `Bash(*)` | Permitir CUALQUIER comando Bash sin confirmar |
| `PowerShell(*)` | Permitir CUALQUIER comando PowerShell sin confirmar |
| `Read(*)` | Leer CUALQUIER archivo sin confirmar |
| `WebFetch(domain:localhost)` | Hacer peticiones HTTP a localhost sin confirmar |
| `additionalDirectories` | Carpetas adicionales con acceso completo |

---

## ⚠️ **IMPORTANTE - Seguridad**

Esta configuración es **MUY PERMISIVA**. Claude puede:
- ✅ Ejecutar cualquier comando sin pedir permiso
- ✅ Leer/modificar cualquier archivo
- ✅ Hacer cambios permanentes en tu sistema

**Solo úsala si:**
- ✅ Confías completamente en Claude
- ✅ Trabajas en proyectos de desarrollo (no producción)
- ✅ Tienes backups regulares

---

## 🔐 **Configuración más restrictiva (alternativa)**

Si quieres algo más seguro pero cómodo:

```json
{
  "model": "claude-sonnet-4-5",
  "permissions": {
    "allow": [
      "Read(*)",
      "Bash(command:git)",
      "Bash(command:npm)",
      "PowerShell(command:git)",
      "PowerShell(command:npm)",
      "WebFetch(domain:localhost)"
    ],
    "additionalDirectories": [
      "C:\\GitHub"
    ]
  }
}
```

Esto permite:
- ✅ Leer cualquier archivo
- ✅ Solo comandos git y npm (sin pedir confirmación)
- ❌ Otros comandos piden confirmación

---

## ✅ **Verificar configuración**

Después de aplicarla, verifica:

```powershell
# Ver configuración actual
claude config list

# O leer el archivo
cat $HOME\.claude\settings.json
```

---

## 📦 **Incluir en EXPORT_MIGRACION**

Si quieres exportar esta configuración también:

```powershell
# En el ordenador ACTUAL
Copy-Item "$HOME\.claude\settings.json" "C:\GitHub\TheJTool\EXPORT_MIGRACION\claude_settings.json"

# En el ordenador NUEVO (después de instalar Claude)
Copy-Item "C:\temp\EXPORT_MIGRACION\claude_settings.json" "$HOME\.claude\settings.json"
```

---

**Fecha:** 2026-06-17  
**Versión Claude Code:** 1.x.x  
**Sistema:** Windows 10/11
