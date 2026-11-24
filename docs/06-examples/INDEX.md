# 📚 Índice de Ejemplos Reales - Generador de Documentación

## Propósito

Este directorio contiene ejemplos reales (anónimos) de documentos de proyectos Therefore™ en diferentes tipos y fases. Sirven como:

✓ **Referencia de calidad**: Cómo debe lucir una buena documentación
✓ **Contexto para Claude**: Mejora la capacidad de análisis de la IA
✓ **Patrones validados**: Estructuras que funcionan en producción
✓ **Training material**: Base de conocimiento del equipo

---

## Tipos de Documentos Disponibles

### 1. 📋 EFDT (Especificaciones Funcionales y Diseño Técnico)
**Propósito**: Descripción técnica COMPLETA y detallada de la solución a implementar

**Cuándo se usa**: Después de análisis aprobado, ANTES de empezar a desarrollar

**Duración típica**: 5-15 días de esfuerzo (depende de complejidad)

**Archivo**: [`efdt/EJEMPLOS_REALES.md`](efdt/EJEMPLOS_REALES.md)

**Casos incluidos**:
- 📌 Vertical NotifAPP (pequeño-mediano)
- 📌 Vertical HR (mediano-grande, 12 categorías)
- 📌 Vertical Facturas (pequeño)

---

### 2. 📝 Análisis de Requerimientos
**Propósito**: Captura QUÉ necesita el cliente, ANTES de planificar CÓMO hacerlo

**Cuándo se usa**: Fase inicial, para validar alcance con cliente

**Duración típica**: 2-4 días

**Archivo**: [`requirements/EJEMPLOS_REALES.md`](requirements/EJEMPLOS_REALES.md)

**Casos incluidos**:
- 📌 Portal de autoservicio para empleados
- 📌 Sistema de gestión de incidencias (ticketing)
- 📌 Integración ERP (pequeño)

---

### 3. 💰 Aproximación Económica / Presupuesto
**Propósito**: Desglose de costes estimados para validar viabilidad financiera

**Cuándo se usa**: Después de análisis, para presentar al cliente

**Duración típica**: 3-5 días de esfuerzo

**Archivo**: [`budget/EJEMPLOS_REALES.md`](budget/EJEMPLOS_REALES.md)

**Casos incluidos**:
- 📌 Sistema notificaciones pequeño (7.5 días, 7,296€)
- 📌 Sistema HR grande (23 días, 27,918€)
- 📌 Change request simple (11h, 1,065€)

---

### 4. 🤝 Oferta Comercial
**Propósito**: Propuesta formal con términos, condiciones, plazos y firma

**Cuándo se usa**: Cuando cliente está listo para comprometerse

**Duración típica**: 2-3 días de esfuerzo

**Archivo**: [`commercial/EJEMPLOS_REALES.md`](commercial/EJEMPLOS_REALES.md)

**Casos incluidos**:
- 📌 Sistema notificaciones (8,131€)
- 📌 Sistema HR (24,781€)
- 📌 Change request (1,065€)

---

### 5. 🔄 Change Request / Evolutivo
**Propósito**: Documentación de cambios/ampliaciones en sistemas existentes

**Cuándo se usa**: Para cambios pequeños (CR) o expansiones (Evolutivo)

**Duración típica**: 
- CR simple: 1-3 días
- Evolutivo: 5-20 días

**Archivo**: [`change-requests/EJEMPLOS_REALES.md`](change-requests/EJEMPLOS_REALES.md)

**Casos incluidos**:
- 📌 CR simple: Agregar campo a formulario
- 📌 Evolutivo: Expandir a 2 nuevas verticales
- 📌 CR: Simplificar aprobaciones

---

### 6. 🔗 Integración (Especial)
**Propósito**: Documentación específica para integraciones con sistemas externos

**Cuándo se usa**: Cuando hay conexión SAP, Jira, Slack, etc.

**Estado**: 🔜 Por crear (se puede expandir de ejemplos existentes)

---

## Cómo Usar Esta Knowledge Base

### Para el Generador de Documentación (IA)

1. **En Análisis**: Buscar similar en `requirements/` para calibrar preguntas
2. **En EFDT**: Usar ejemplos de `efdt/` como referencia de estructura y profundidad
3. **En Presupuesto**: Usar ratios de `budget/` para estimaciones
4. **En Oferta**: Copiar estructura base de `commercial/` y personalizar

### Para el Equipo

1. **Training**: Leer los ejemplos para entender qué espera el cliente
2. **Referencia**: Copiar estructura de documento similares en proyectos nuevos
3. **Validación**: Comparar nuevo proyecto contra ejemplos para detectar gaps

### Para Clientes

1. **Expectativas claras**: Mostrar ejemplos de qué entregarán
2. **Quality baseline**: Estos son estándares mínimos de calidad
3. **Timing realistic**: Ver duración típica de análisis, presupuesto, etc.

---

## Patrones Transversales

### ✓ Patrón A: Validación Multinivel
Visto en EFDT (NotifAPP), Análisis (Portal), Presupuesto
→ **Aplicable a**: Cualquier proceso con múltiples revisores

### ✓ Patrón B: Automatización de Transiciones
Visto en EFDT (Workflows), Change Request (Escalado automático)
→ **Aplicable a**: Procesos que ahorren tiempo manual

### ✓ Patrón C: Integración con Externos
Visto en Análisis (SAP, Jira), Presupuesto (coste adicional), Oferta (términos)
→ **Aplicable a**: Cualquier proyecto con sistemas externos

### ✓ Patrón D: Desglose de Costes por Fase
Visto en Presupuesto, Oferta
→ **Aplicable a**: Comunicación clara con clientes

---

## Flujo Típico: Análisis → Presupuesto → Oferta → EFDT

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ANÁLISIS DE REQUERIMIENTOS (2-4 días)                   │
│    └─ Qué necesita el cliente                               │
│       Usar: requirements/EJEMPLOS_REALES.md                 │
├─────────────────────────────────────────────────────────────┤
│ 2. PRESUPUESTO ESTIMATIVO (3-5 días)                       │
│    └─ Cuánto cuesta                                         │
│       Usar: budget/EJEMPLOS_REALES.md + ratios             │
├─────────────────────────────────────────────────────────────┤
│ 3. OFERTA COMERCIAL (2-3 días)                             │
│    └─ Términos, plazos, firma                               │
│       Usar: commercial/EJEMPLOS_REALES.md                   │
├─────────────────────────────────────────────────────────────┤
│ 4. EFDT DETALLADA (5-15 días)                              │
│    └─ Cómo se hace exactamente                              │
│       Usar: efdt/EJEMPLOS_REALES.md como referencia        │
├─────────────────────────────────────────────────────────────┤
│ 5. IMPLEMENTACIÓN (5-30 días)                              │
│    └─ Ejecución en Therefore                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Estimación Rápida

Basado en ejemplos validados:

### Por Tamaño de Proyecto

| Tamaño | Duración EFDT | Coste Base | Complejidad |
|--------|---------------|-----------|------------|
| Pequeño | 4-7 días | 3,200-5,600€ | Baja |
| Mediano | 7-12 días | 5,600-9,600€ | Media |
| Grande | 12-20 días | 9,600-16,000€ | Alta |

### Por Tipo de Documento

| Documento | Duración | Cuando | Coste % de EFDT |
|-----------|----------|--------|-----------------|
| Análisis | 2-4 d | Inicio | ~15-20% |
| Presupuesto | 3-5 d | Tras análisis | ~20-25% |
| Oferta | 2-3 d | Tras presupuesto | ~10-15% |
| EFDT | 5-15 d | Tras aprobación | 100% |

---

## Datos Reales (Anónimos)

Todos los ejemplos están:
- ✓ Basados en proyectos reales completados
- ✓ Anónimos (sin datos de cliente específico)
- ✓ Validados en producción
- ✓ Estructurados para reutilización

---

## Cómo Expandir

Para agregar nuevo tipo de documento:

1. Crear carpeta: `docs/ejemplos/[tipo]/`
2. Crear `EJEMPLOS_REALES.md` con 2-3 casos
3. Incluir: Contexto, Estructura, Estimación, Patrones
4. Actualizar este INDEX.md

---

## Última Actualización
**Fecha**: 2026-05-28  
**Versión**: 1.0  
**Estado**: Completo con 5 tipos principales de documentos

---

## Contacto para Preguntas

¿Pregunta sobre un ejemplo específico?
- Leer el archivo completo en su carpeta
- Buscar patrón similar en otro tipo
- Preguntar al equipo de implementación
