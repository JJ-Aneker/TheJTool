# Project Audit - TheJTool

## Estado Actual (21 Abril 2026)

### ✅ Lo que funciona bien
- **Autenticación**: Login/signup con Supabase
- **Perfil de usuario** (user.js): Formulario coherente con secciones
- **Navegación**: SPA router funcional
- **Estilos**: CSS coherente con glass-morphism
- **GitHub**: Conectado correctamente a JJ-Aneker/TheJTool

### ⚠️ Problemas Identificados

#### 1. Admin Panel
- **Problema**: Solo muestra 1 usuario en lugar de todos
- **Causa probable**: La query no trae todos los registros (pesar de `.limit(1000)`)
- **Impacto**: Admin no puede ver ni editar otros usuarios
- **Solución necesaria**: Verificar si es límite de RLS (Row Level Security) en Supabase

#### 2. Inconsistencia de Formularios
- **user.js**: Usa formulario inline con `form-section` y layout de 2 columnas
- **admin.js**: Usa modal con inputs simples
- **Impacto**: UX inconsistente
- **Solución**: Admin debe usar mismo patrón que user.js (inline con form-section)

#### 3. Falta de Validación
- No hay validación de inputs
- No hay feedback visual en tiempo real
- Impacto: Usuario no sabe qué campos son requeridos

#### 4. Guardia de Cambios
- **user.js**: Tiene Router.addBeforeLeaveHook para cambios sin guardar
- **admin.js**: No tiene protección de cambios
- Impacto: Puedes perder cambios al navegar

#### 5. Estructura de Carpetas
- personal.html: Página estática (no integrada en SPA)
- Debería ser un view en assets/js/views/personal.js
- Impacto: Incoherencia arquitectónica

### 📋 Plan de Coherencia

#### Fase 1: Arreglar Admin
- [ ] Verificar RLS en Supabase (probablemente solo trae propios datos)
- [ ] Reescribir admin.js con patrón form-section como user.js
- [ ] Agregar Router.addBeforeLeaveHook
- [ ] Usar mismo CSS que user.js

#### Fase 2: Validación Global
- [ ] Agregar validación basic a todos los formularios
- [ ] Feedback visual en inputs (requerido, error, etc)

#### Fase 3: Estructura
- [ ] Integrar personal.html como view (si es necesario)
- [ ] O eliminarla si no es parte de la app

#### Fase 4: Testing
- [ ] Verificar que admin carga TODOS los usuarios
- [ ] Test de edición completa
- [ ] Test de cambios sin guardar

### 🔍 Checklist de Verificación
- [ ] Admin carga múltiples usuarios
- [ ] Formulario de admin es igual a user.js
- [ ] Se puede editar todos los campos
- [ ] Cambios sin guardar están protegidos
- [ ] Modal/Form cierra correctamente
- [ ] Feedback visual en guardado

### 📝 Notas Técnicas

**RLS en Supabase**: Probablemente el problema es que la tabla `profiles` tiene RLS habilitado y solo permite al usuario ver sus propios datos. Para admin, necesitamos:
1. Crear una política RLS para admin que permita leer TODOS los datos
2. O deshabilitar RLS en esa tabla (menos seguro)

**Patrón form-section**: user.js usa:
```html
<div class="form-section">
  <div class="section-head">
    <h3 class="section-title">Título</h3>
    <p class="section-desc">Descripción</p>
  </div>
  <div class="fields-grid">
    <div class="field">...</div>
  </div>
</div>
```
Admin debería usar el mismo patrón.
