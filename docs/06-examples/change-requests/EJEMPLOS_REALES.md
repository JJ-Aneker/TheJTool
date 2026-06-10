# Ejemplos Reales - Change Request / Evolutivo (Anónimos)

## Definición: Change Request vs Evolutivo

**Change Request (CR)**: Cambio en implementación existente (pequeño/medio, 1-5 días)
**Evolutivo**: Expansión de alcance en proyecto existente (medio/grande, 5-20 días)

---

## Caso 1: Change Request - Solicitud de Mejora UI

### Contexto
- **Tipo**: CR - Mejora de interfaz
- **Sistema Base**: Notificaciones Administrativas (existente)
- **Duración**: 3-5 días
- **Impacto**: Cosmético/Usabilidad

### Cambios Solicitados

1. **Nuevo campo en formulario de Notificación**
   - Campo: "Popup de Bienvenida" (Boolean)
   - Propósito: Mostrar diálogo en primera lectura de notificación
   - Estimación: 0.25 días

2. **Modificación de workflow existente**
   - Agregar validación: Si "Popup" = true, mostrar modal
   - Cambio en etapa de envío (visual, no lógica)
   - Estimación: 0.5 días

3. **Actualización de plantilla Word**
   - Agregar nueva línea en documento de especificación
   - Estimación: 0.1 días

4. **Pruebas de regresión**
   - Verificar que workflows existentes no se rompieron
   - Testing de nuevo campo en contexto
   - Estimación: 1 día

### Estimación Total
- **Análisis**: 0.25 días
- **Desarrollo**: 0.85 días
- **QA**: 1.0 día
- **Total**: 2.1 días = **1,680€**

### Criterios de Aceptación
- [ ] Nuevo campo visible en formulario
- [ ] Popup se muestra al abrir notificación por primera vez
- [ ] Popup se oculta al confirmar lectura
- [ ] Workflows existentes funcionan sin cambios
- [ ] Documentación actualizada

---

## Caso 2: Evolutivo - Expansión a 2 Nuevas Verticales

### Contexto Proyecto Original
- **Sistema Base**: Gestor de Notificaciones (6 meses en producción)
- **Usuarios**: 40 activos
- **Estabilidad**: 99.5% uptime

### Nuevo Alcance Solicitado

**Nueva Vertical 1: Gestión de Incidencias**
- Similitud con existente: 60% (usa mismos flujos, nuevas categorías)
- Nuevas categorías: 3 (Incidente, Seguimiento, Resolución)
- Nuevos workflows: 2 (Escalado automático, SLA tracking)
- Estimación: 3.5 días

**Nueva Vertical 2: Gestión de Cambios (CAB)**
- Similitud: 40% (requiere workflows nuevos completamente)
- Nuevas categorías: 2 (Cambio, Impacto)
- Nuevos workflows: 3 (Planificación, Aprobación multi-nivel, Ejecución)
- Estimación: 4.5 días

### Estructura de Cambios

#### Cambios en Infrastructure
- Nueva tabla maestra: Grupos de Escalado
- Nueva tabla maestra: Equipos CAB
- Actualización RLS: Nuevos roles (Responsable Incidencia, Miembro CAB)
- Estimación: 1 día

#### Cambios en Workflows Existentes
- Extender workflow base para soportar SLA
- Agregar lógica de escalado automático (cuando > 2 días)
- Estimación: 1.5 días

#### Integración
- Conexión con herramienta externa de ticketing (API)
- Notificaciones a Slack cuando incidencia escalada
- Estimación: 2 días

### Desglose de Estimación

| Componente | Días | Descripción |
|-----------|------|------------|
| Análisis ampliado | 1.5 | Reqs nueva vertical, impacto en existente |
| Nuevas categorías (5) | 0.95 | 0.19 × 5 |
| Nuevos workflows (5) | 2.5 | 0.5 × 5 |
| Cambios infraestructura | 1.0 | RLS, tablas, roles |
| Modificación workflows base | 1.5 | Soporte SLA, escalado |
| Integración externa | 2.0 | API ticketing, Slack |
| Plantillas Word | 0.5 | 3 documentos nuevos |
| Pruebas funcionales | 2.0 | Completa + regresión |
| Formación | 1.0 | Nuevos usuarios |
| **TOTAL** | **12.95 días** | **10,360€** |
| **Total con IVA** | - | **12,536€** |

### Riesgos Específicos
- **R1**: Cambios en workflows base pueden afectar notificaciones en producción
  - *Mitigación*: Extensa testing + rollback plan
- **R2**: Integración con sistema externo puede tener delays de API
  - *Mitigación*: Queue con reintentos, fallback a email

### Particularidades del Evolutivo

✓ **Reutilización de código**: 60% de workflows existentes adaptados
✓ **Impacto en producción**: Requiere planning cuidadoso de rollout
✓ **Testing ampliado**: Pruebas de regresión en sistema existente + nuevo
✓ **Migración cero-downtime**: Despliegue gradual (feature flags)

---

## Caso 3: CR - Simplificar Proceso de Aprobación

### Cambio Solicitado
- **Contexto**: Sistema de Notificaciones existente
- **Problema**: Proceso de aprobación tiene 3 niveles, usuarios piden 2
- **Solución**: Eliminar nivel intermedio (Power User)

### Impacto en Workflows
**Workflow Original**: Registro → Revisión → Aprobación → Envío
**Workflow Nuevo**: Registro → Aprobación → Envío

### Cambios Requeridos
1. Eliminar paso "Revisión" en workflow (0.25 días)
2. Actualizar RLS: Eliminar rol Power User (0.1 días)
3. Actualizar plantilla Word: Remover sección de revisor (0.1 días)
4. Testing: Verificar workflow nuevo funciona (1 día)
5. Migración de datos: ¿Qué pasa con notificaciones "en revisión"? (0.25 días)

### Estimación Total
- **Total**: 1.7 días = **1,360€**

### Consideraciones
- ⚠️ Requiere decisión: ¿Qué ocurre con notificaciones en revisión al momento del cambio?
  - Opción A: Completarlas bajo proceso antiguo (retrasa cambio 3-5 días)
  - Opción B: Migrarlas automáticamente al nuevo proceso (testing adicional)

---

## Patrones de Change Request

### Patrón A: Agregar Campo/Tabla
- **Complejidad**: Baja (1-2 días)
- **Riesgo**: Bajo
- **Ejemplo**: Agregar campo "Prioridad" a notificación existente

### Patrón B: Modificar Workflow
- **Complejidad**: Media (2-4 días)
- **Riesgo**: Medio (puede afectar procesos activos)
- **Ejemplo**: Cambiar número de aprobaciones, agregar validaciones

### Patrón C: Integración Externa
- **Complejidad**: Media-Alta (2-5 días)
- **Riesgo**: Medio-Alto (depende de API externa)
- **Ejemplo**: Conectar con SAP, Slack, CRM

### Patrón D: Cambio Importante en Arquitectura
- **Complejidad**: Alta (5+ días)
- **Riesgo**: Alto
- **Ejemplo**: Cambiar modelo de datos, reorganizar categorías, cambiar workflow principal

---

## Estimación Rápida para CR

**Fórmula Simple:**
```
- Agregar campo: 0.25 días
- Modificar workflow existente: 0.5 días
- Integración simple: 1 día
- Testing + QA: 1 día
- Total mínimo: 2 días
- Total máximo: 5 días (para CR)
```

**Para Evolutivo:** Usar fórmula EFDT pero sumar +20% por testing de regresión

---

## Cuándo Usar "Cambio" vs "Evolutivo"

| Aspecto | CR | Evolutivo |
|--------|-----|-----------|
| **Duración** | 1-5 días | 5-20 días |
| **Costo** | 800-4,000€ | 4,000-16,000€ |
| **Impacto** | Localizado | Sistémico |
| **Riesgo** | Bajo-Medio | Medio-Alto |
| **Testing** | Parcial | Completo |
| **Usuarios** | Pocos | Múltiples equipos |
| **Documentación** | Mínima | Completa |

---

**Última actualización**: 2026-05-28  
**Versión**: 1.0  
**Estado**: Validado con cambios reales en producción
