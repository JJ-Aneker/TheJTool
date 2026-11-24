# Ejemplos Reales - Aproximación Económica / Presupuesto (Anónimos)

## Definición

**Aproximación Económica**: Desglose de costes estimados ANTES de comprometer firmes en EFDT. Usado para validar viabilidad financiera con cliente.

Típicamente: Análisis 2 días → Presupuesto 3-5 días → EFDT 5-10 días

---

## Caso 1: Presupuesto - Sistema Notificaciones (Pequeño)

### Datos del Cliente
- Presupuesto total disponible: 8,000€
- Timeline: 6 semanas máximo
- Usuarios: 8 concurrentes

### Desglose de Costes

```
FASE 1: PLANIFICACIÓN Y ANÁLISIS
┌─────────────────────────────────────────┐
│ Análisis funcional                       │ 1.0 día  │ 800€
│ Toma de requisitos (entrevistas)        │ 0.5 día  │ 400€
│ Definición de arquitectura               │ 0.5 día  │ 400€
├─────────────────────────────────────────┤
│ SUBTOTAL FASE 1                          │ 2.0 días │ 1,600€
└─────────────────────────────────────────┘

FASE 2: CONFIGURACIÓN THEREFORE
┌─────────────────────────────────────────┐
│ Expediente principal (18 campos)         │ 0.25 día │ 200€
│ Categoría dependiente (12 campos)        │ 0.19 día │ 150€
│ Workflow principal (5 etapas)            │ 0.5 día  │ 400€
│ Workflow de escalado                     │ 0.25 día │ 200€
│ Tabla maestra organismos                 │ 0.1 día  │ 80€
├─────────────────────────────────────────┤
│ SUBTOTAL FASE 2                          │ 1.29 días│ 1,030€
└─────────────────────────────────────────┘

FASE 3: INTEGRACIÓN Y PLANTILLAS
┌─────────────────────────────────────────┐
│ Integración con email (notificaciones)   │ 0.5 día  │ 400€
│ Plantilla Word para expedientes          │ 0.25 día │ 200€
│ Configuración de roles y permisos        │ 0.25 día │ 200€
├─────────────────────────────────────────┤
│ SUBTOTAL FASE 3                          │ 1.0 día  │ 800€
└─────────────────────────────────────────┘

FASE 4: PRUEBAS Y DEPLOYMENT
┌─────────────────────────────────────────┐
│ Pruebas unitarias y de integración       │ 0.75 día │ 600€
│ UAT con cliente                          │ 0.5 día  │ 400€
│ Ajustes post-UAT                         │ 0.5 día  │ 400€
│ Deployment a producción                  │ 0.25 día │ 200€
├─────────────────────────────────────────┤
│ SUBTOTAL FASE 4                          │ 2.0 días │ 1,600€
└─────────────────────────────────────────┘

FASE 5: FORMACIÓN Y SOPORTE
┌─────────────────────────────────────────┐
│ Formación usuarios (1 sesión × 4h)       │ 0.5 día  │ 400€
│ Documentación de usuario                 │ 0.25 día │ 200€
│ Soporte post-go-live (15 días)           │ 0.5 día  │ 400€
├─────────────────────────────────────────┤
│ SUBTOTAL FASE 5                          │ 1.25 días│ 1,000€
└─────────────────────────────────────────┘
```

### Resumen Ejecutivo

| Concepto | Horas | Días | Importe |
|----------|-------|------|---------|
| Planificación | 16 | 2.0 | 1,600€ |
| Configuración | 10.3 | 1.3 | 1,030€ |
| Integración | 8 | 1.0 | 800€ |
| Pruebas | 16 | 2.0 | 1,600€ |
| Formación | 10 | 1.25 | 1,000€ |
| **TOTAL** | **60.3h** | **7.54 días** | **6,030€** |
| **Con IVA (21%)** | - | - | **7,296€** |

### Análisis de Viabilidad

```
Presupuesto cliente: 8,000€
Coste propuesto: 7,296€
Margen de contingencia: 704€ (8.8%)
```

✓ **VIABLE** - Proyecto dentro de presupuesto con margen

### Inversión Adicional Opcional

Si cliente quiere extras:
- Integración con sistema externo: +2,000€
- Reportería avanzada: +1,000€
- Aplicación móvil: +3,000€

---

## Caso 2: Presupuesto - Sistema HR Completo (Grande)

### Datos del Cliente
- Presupuesto: 30,000€
- Timeline: 10 semanas
- Usuarios: 50 RRHH + 500 empleados

### Desglose Simplificado

| Fase | Tareas | Horas | Importe |
|------|--------|-------|---------|
| **Análisis** | Entrevistas, mapeo procesos | 24h | 1,920€ |
| **Categoría Principal** | Expediente empleado (22 campos) | 4h | 320€ |
| **12 Categorías** | Formación, evaluación, nómina, etc. | 72h | 5,760€ |
| **Workflows** | 5 workflows principales | 40h | 3,200€ |
| **Integraciones** | SAP, Slack, Azure | 48h | 3,840€ |
| **Testing** | QA completa + UAT | 40h | 3,200€ |
| **Formación** | 3 sesiones × 4h | 12h | 960€ |
| **Soporte** | Post-go-live (30 días) | 16h | 1,280€ |
| **Contingencia (10%)** | - | - | 2,560€ |
| **TOTAL** | | **256h** | **23,040€** |
| **Con IVA** | | - | **27,918€** |

### Viabilidad
```
Presupuesto cliente: 30,000€
Coste propuesto: 27,918€
Margen: 2,082€ (6.9%)

Status: ✓ VIABLE
Riesgo: MEDIO (margen ajustado, gran alcance)
```

### Recomendación
- Presupuesto es ajustado
- Si surgen complejidades en análisis, pueden consumir contingencia
- Proponer fase 2 opcional: Analítica avanzada (+5,000€)

---

## Caso 3: Presupuesto - Change Request Simple

### Solicitud
Agregar 2 nuevos campos a sistema existente

### Desglose

| Item | Horas | Importe |
|------|-------|---------|
| Análisis del cambio | 2h | 160€ |
| Implementación | 4h | 320€ |
| Testing | 4h | 320€ |
| Deployment | 1h | 80€ |
| **TOTAL** | **11h** | **880€** |
| **Con IVA** | - | **1,065€** |

---

## Principios para Estimar Presupuesto

### Tarifa Base
- **Tarifa estándar**: 800€/día · 8 horas = **100€/hora**
- Variaciones: ±20% según experiencia del equipo

### Ratios Validados

```
Análisis de requerimientos:     1 día base + tiempo con cliente
Expediente principal:           0.25 días (18-20 campos)
Categoría dependiente:          0.19 días por categoría
Workflow:                       0.5 días (4-5 etapas)
Tabla maestra:                  0.1 día
Integración simple:             1 día
Integración compleja (SAP):     2-3 días
Pruebas:                        15-25% del tiempo de desarrollo
Formación:                      0.5 día por sesión de 4h
Soporte post-go-live:           0.5 día por mes (después del primero)
```

### Margen de Contingencia

```
Proyecto pequeño (<5 días):     8-10%
Proyecto mediano (5-15 días):   10-15%
Proyecto grande (>15 días):     15-20%
```

### Factores que Afectan Coste

**Aumentan coste:**
- Integración con sistemas externos
- Reportería compleja
- Bases de datos grandes (>1M registros)
- Usuarios distribuidos geográficamente
- Cambios de requisitos durante proyecto

**Reducen coste:**
- Reutilización de código/workflows
- Requisitos claros desde inicio
- Cliente disponible para UAT
- Procesos simples sin excepciones

---

## Estructura de Propuesta

### Para Cliente

```markdown
## DESGLOSE DE COSTES

**Fase 1: Análisis y Planificación**
- Análisis funcional y técnico
- Definición de arquitectura
- Costo: 1,600€

**Fase 2: Implementación en Therefore**
- Configuración de categorías, workflows, integraciones
- Costo: 2,830€

**Fase 3: Testing y Deployment**
- Pruebas, UAT, deployment
- Costo: 1,600€

**Fase 4: Formación y Soporte**
- Capacitación de usuarios, documentación
- Costo: 1,400€

**SUBTOTAL**: 7,430€
**IVA (21%)**: 1,560€
**TOTAL**: 8,990€
```

---

**Última actualización**: 2026-05-28  
**Versión**: 1.0  
**Estado**: Validado con presupuestos reales
