# Therefore Reporter — Guía de Uso

## ¿Qué es el Therefore Reporter?

El Therefore Reporter es un módulo para monitorear servidores Therefore™ en tiempo real. Te permite:

- 📊 **Extraer métricas** de documentos, casos, usuarios y workflows
- 🔐 **Almacenar perfiles** de monitoreo de forma segura
- 🚀 **Acceso rápido** a datos del servidor con un solo clic
- ⚠️ **Manejo inteligente de errores** con mensajes específicos

---

## Primeros Pasos

### 1. Crear un Tenant (Servidor Therefore)

Antes de poder monitorear un servidor, debes registrarlo como "Tenant":

**Ruta:** Gestión de Tenants

**Campos requeridos:**
- **Nombre**: Nombre descriptivo (ej: "Producción", "Desarrollo")
- **URL**: URL completa del servidor (ej: `https://buildingcenter.thereforeonline.com`)
- **Tenant ID**: ID del tenant en Therefore (ej: `buildingcenter`)
- **Usuario**: Usuario con permisos de query en Therefore
- **Contraseña**: Contraseña del usuario

**Opcional:**
- **Compartido**: Marca para que otros usuarios vean este servidor

✅ **Consejo:** Usa credenciales de una cuenta de servicio dedicada, no tu cuenta personal.

### 2. Crear un Perfil de Reporte

Ahora crea un perfil para monitorear ese servidor:

**Ruta:** Therefore Reporter → Botón "Nuevo Perfil"

**Campos:**
- **Nombre del Perfil**: Descripción clara (ej: "Monitoring Producción")
- **Servidor (Tenant)**: Selecciona el tenant que creaste
- **Descripción**: Notas opcionales (ej: "Para alertas en PagerDuty")

✅ **Consejo:** Crea múltiples perfiles si quieres monitorear diferentes categorías del mismo servidor.

### 3. Extraer Datos

En la tabla de perfiles, haz clic en el **ojo (👁️)** para extraer datos:

```
El sistema:
1. Autentica con el servidor Therefore
2. Ejecuta 4 queries en paralelo (documentos, casos, usuarios, workflows)
3. Muestra los resultados en una segunda pestaña
4. Cachea la sesión para futuras queries más rápidas
```

---

## Métricas Disponibles

El Therefore Reporter extrae y muestra 4 métricas clave:

| Métrica | Significa | API Query |
|---------|-----------|-----------|
| **Documentos** | Total de documentos en todas las categorías | ExecuteSimpleQuery |
| **Casos** | Total de casos en el sistema | ExecuteSingleQuery (Mode 5) |
| **Usuarios** | Total de usuarios activos | ExecuteUsersQuery |
| **Workflows** | Total de instancias de workflow activas | ExecuteWorkflowQueryForAll |

---

## Interpretar Errores

Si algo falla, el Therefore Reporter muestra un mensaje específico:

### ❌ "Credenciales inválidas"
**Causa:** El usuario o contraseña del Therefore son incorrectos.

**Solución:**
1. Verifica que el usuario existe en Therefore
2. Confirma que la contraseña es correcta
3. Edita el Tenant y corrige las credenciales
4. Intenta de nuevo

### ⏱️ "Timeout: El servidor tarda demasiado"
**Causa:** El servidor Therefore tarda más de 10 segundos en responder.

**Solución:**
1. Comprueba que el servidor está disponible
2. Revisa la carga del servidor
3. Comprueba la conectividad de red
4. Intenta más tarde

### 🔒 "Error CORS"
**Causa:** El servidor Therefore no permite acceso desde el navegador.

**Solución:**
- Contacta al administrador Therefore para habilitar CORS
- O usa un proxy backend (no aún implementado)

### ⚠️ "El usuario no tiene permisos"
**Causa:** El usuario de Therefore no tiene permisos para queries.

**Solución:**
1. En Therefore, abre el usuario
2. Verifica que tiene permisos "Query"
3. Confirma "ExecuteSimpleQuery", "ExecuteSingleQuery", "ExecuteUsersQuery"
4. Guarda cambios

---

## Casos de Uso

### Monitoreo Diario
```
1. Crea un perfil "Daily Check"
2. Cada mañana, abre el Reporter
3. Haz clic en "Ver datos"
4. Verifica que los números sean "normales" para tu organización
```

### Alertas por Anomalías
```
1. Toma nota de los valores "normales"
2. Si ves números muy altos o bajos, investiga
3. Ej: Si documentos baja de repente → puede ser problema de indexación
```

### Comparación entre Servidores
```
1. Crea perfiles para dev, staging, producción
2. Compara números entre ellos
3. Asegúrate de que proporciones coincidan
```

---

## Consejos y Trucos

### 🔄 Refrescar Datos
- Usa el botón "Refrescar" en la pestaña de datos
- Los números se actualizarán sin salir del reporte

### 📱 Responsive
- El módulo funciona en móvil
- La grilla de métricas se adapta automáticamente

### 🔐 Privacidad
- Tus perfiles solo los ves tú
- Tenants compartidos son visibles a todos
- Las credenciales se almacenan de forma segura en Supabase

### ⚡ Rendimiento
- La primera query tarda ~1-2 segundos (autenticación)
- Queries posteriores son más rápidas (token cacheado)
- Las 4 métricas se extraen en paralelo (no secuencial)

---

## Permisos y Seguridad

### ¿Quién puede acceder?
- **Todos** (cualquier usuario autenticado) pueden crear perfiles

### ¿Quién puede ver qué?
- Tus propios perfiles: solo tú
- Tenants compartidos: todos ven el servidor
- Editar/borrar perfiles: solo el propietario

### ¿Dónde se guardan las credenciales?
- En la tabla `tenants` de Supabase
- Protegidas con RLS (Row Level Security)
- Solo tú (como propietario) las ves

---

## Solución de Problemas

### Q: No puedo crear un perfil
**R:** Primero debes crear un Tenant en Gestión de Tenants.

### Q: El botón "Nuevo Perfil" está gris
**R:** No hay tenants disponibles. Crea uno primero o pide que te compartan uno.

### Q: Los datos muestran ceros
**R:** Es probable que:
- El usuario Therefore no tiene permisos de query
- La base de datos esté vacía
- Las categorías no estén indexadas

### Q: ¿Cómo logout para limpiar tokens?
**R:** Cuando haces logout de la app, los tokens se limpian automáticamente.

### Q: ¿Puedo ver el historial de extracciones?
**R:** No por ahora. Cada extracción muestra el timestamp de cuándo fue realizada.

---

## Próximas Características (Roadmap)

- 📊 Historial de métricas y tendencias
- 📈 Gráficos de datos a lo largo del tiempo
- 📧 Alertas automáticas por anomalías
- 📄 Exportar reportes a PDF/CSV
- 🔄 Extracciones programadas (cada hora, cada día, etc.)
- 🔐 Permisos granulares (admin, manager, viewer)
- 🌐 Proxy para resolver CORS

---

## Soporte

Si encuentras problemas:

1. **Revisa este documento** para casos comunes
2. **Verifica la consola del navegador** (F12) para errores técnicos
3. **Contacta al equipo** con:
   - Mensaje de error exacto
   - Qué intentabas hacer
   - Nombre del Tenant

---

**Última actualización:** 2026-05-19  
**Versión:** 1.0
