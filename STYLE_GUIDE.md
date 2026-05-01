# 🎨 TheJTool Design System - Guía de Estilos

## Objetivo
Mantener **consistencia visual** y **tema oscuro/claro** en todo el proyecto sin duplicar CSS.

---

## 1. Variables CSS (Design Tokens)

Todas las variables se definen en `src/styles/design-tokens.css` y respetan automáticamente light/dark mode.

### Colores
```css
--bg-card: fondo de tarjetas (#25272D dark, #ffffff light)
--bg-canvas: fondo principal de la página
--bg-input: fondo de inputs
--bg-hover: fondo al pasar el mouse
--text-primary: texto principal
--text-secondary: texto secundario
--text-muted: texto tenue
--accent-primary: color principal (azul #3663FF)
--accent-success: color éxito (verde)
--accent-error: color error (rojo)
--border-default: borde por defecto
```

### Border Radius
```css
--radius-sm: 6px
--radius-md: 8px (por defecto)
--radius-lg: 10px
```

---

## 2. Clases Genéricas Reutilizables

### Contenedores Principales
```jsx
// Contenedor principal de la página
<div className="container-main">
  {/* Usa padding 24px y min-height automático */}
</div>
```

### Header
```jsx
<div className="header-main">
  <h1 className="header-title">Título</h1>
  <p className="header-subtitle">Subtítulo</p>
  <div className="header-actions">
    {/* Botones aquí */}
  </div>
</div>
```

### Tarjetas
```jsx
{/* Tarjeta normal */}
<div className="card">
  {/* Contenido */}
</div>

{/* Tarjeta con efecto vidrio (blur) */}
<div className="card-glass">
  {/* Contenido */}
</div>

{/* Sección */}
<div className="section">
  {/* Contenido */}
</div>
```

### Botones
```jsx
{/* Botón primario (azul) */}
<button className="btn-primary">Acción Principal</button>

{/* Botón secundario/default (transparente) */}
<button className="btn-default">Acción Secundaria</button>

{/* Botón éxito (verde) */}
<button className="btn-success">Completado</button>

{/* Botón peligroso (rojo) */}
<button className="btn-danger">Eliminar</button>

{/* Botón pequeño */}
<button className="btn-sm btn-default">Pequeño</button>
```

### Formularios
```jsx
<div className="form-group">
  <label className="form-label">Campo de entrada</label>
  <input className="form-input" type="text" />
</div>

{/* Select / Dropdown */}
<select className="form-select">
  <option>Opción 1</option>
</select>

{/* Textarea */}
<textarea className="form-textarea"></textarea>

{/* Versión compacta */}
<input className="form-input-compact" />
```

### Alertas / Mensajes
```jsx
{/* Error */}
<div className="alert alert-error">
  ⚠ Mensaje de error
</div>

{/* Éxito */}
<div className="alert alert-success">
  ✓ Operación completada
</div>

{/* Advertencia */}
<div className="alert alert-warning">
  ⚡ Advertencia
</div>
```

### Badges / Etiquetas
```jsx
<span className="badge">5 campos</span>
```

### Utilitarios de Texto
```jsx
<p className="text-primary">Texto principal</p>
<p className="text-secondary">Texto secundario</p>
<p className="text-error">Texto en rojo</p>
<p className="text-success">Texto en verde</p>
<p className="text-accent">Texto en azul principal</p>
```

---

## 3. Ejemplo Práctico: Nuevo Componente

### ❌ **MAL** - Estilos inline hardcodeados
```jsx
export default function MyComponent() {
  return (
    <div style={{
      background: '#25272D',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h1 style={{ color: '#3663FF', fontSize: '20px' }}>Título</h1>
      <button style={{
        background: '#3663FF',
        color: '#fff',
        border: 'none'
      }}>
        Guardar
      </button>
    </div>
  )
}
```

### ✅ **BIEN** - Usando clases genéricas
```jsx
export default function MyComponent() {
  return (
    <div className="container-main">
      <div className="header-main">
        <h1 className="header-title">Título</h1>
      </div>
      
      <div className="card">
        <button className="btn-primary">Guardar</button>
      </div>
    </div>
  )
}
```

---

## 4. Cómo Cambiar Tema

El tema se controla automáticamente con el atributo `data-theme` en el `<html>`:

```html
<!-- Dark mode (por defecto) -->
<html data-theme="dark">

<!-- Light mode -->
<html data-theme="light">
```

Todas las variables CSS se adaptan automáticamente. **No hay que cambiar nada en los componentes.**

---

## 5. Reglas de Oro

### ✅ HACER
- ✅ Usar clases genéricas de `design-tokens.css`
- ✅ Usar variables CSS (`var(--accent-primary)`)
- ✅ Usar border-radius: `var(--radius-md)`
- ✅ Usar `!important` SOLO si Ant Design conflictúa
- ✅ Crear componentes agnósticos al tema

### ❌ NO HACER
- ❌ Hardcodear colores (`#25272D`, `#ffffff`)
- ❌ Hardcodear border-radius (`8px`)
- ❌ Mezclar estilos inline + clases CSS
- ❌ Crear clases CSS específicas por componente (reutiliza las genéricas)

---

## 6. Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/styles/design-tokens.css` | Variables CSS + clases genéricas |
| `src/styles/category-builder.css` | Clases específicas del CategoryBuilder (deprecadas) |
| `src/styles/eform-builder.css` | Clases específicas del EFormBuilder |
| `STYLE_GUIDE.md` | Este documento |

---

## 7. Migración de Componentes Existentes

Si encuentras estilos inline hardcodeados:

1. Reemplaza `style={{ background: 'var(--bg-card)' }}` con `className="card"`
2. Reemplaza botones inline con `.btn-primary` / `.btn-default`
3. Reemplaza inputs inline con `.form-input`
4. Verifica que funcione en light/dark mode

Ejemplo:
```jsx
// Antes
<div style={{ background: 'var(--bg-card)', padding: '16px' }}>
  <button style={{ background: 'var(--accent-primary)' }}>OK</button>
</div>

// Después
<div className="card">
  <button className="btn-primary">OK</button>
</div>
```

---

## 8. Troubleshooting

### Los estilos no se aplican
- Verifica que el elemento tenga la clase CSS correcta
- Revisa que `design-tokens.css` esté importado en `index.css`
- Usa DevTools (F12) para inspeccionar estilos

### El color es diferente en light/dark mode
- ¡Es normal! Las variables CSS cambian automáticamente
- Verifica que uses variables CSS, no colores hardcodeados

### Conflicto con Ant Design
- Añade `!important` en el CSS (última opción)
- O sobrescribe el componente de Ant Design en `design-tokens.css`

---

**¡Nuevo componente? Usa `design-tokens.css` y ahorra tiempo! 🚀**
