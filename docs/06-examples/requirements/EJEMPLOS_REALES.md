# Ejemplos Reales - Análisis de Requerimientos (Anónimos)

## Definición

**Análisis de Requerimientos**: Documento funcional/técnico que captura QUÉ necesita el cliente ANTES de escribir la EFDT (que describe CÓMO se hace).

Típicamente precede 2-4 semanas al EFDT.

---

## Caso 1: Análisis - Portal de Autoservicio (Mediano)

### Contexto
- **Cliente**: Empresa de servicios
- **Necesidad**: Portal para empleados acceder a documentos personales
- **Usuarios**: ~500 empleados
- **Plataforma**: Therefore Online
- **Timeline**: Despliegue en 8 semanas

### Requerimientos Funcionales

#### RF-001: Autenticación y Seguridad
- Los empleados se autentican con usuario/contraseña corporativo
- 2FA opcional para datos sensibles (salario, documentos bancarios)
- Sesión caduca tras 30 min inactividad
- Logout automático al cierre de navegador

#### RF-002: Acceso a Documentos Personales
- Empleado puede ver:
  - Recibos de nómina (últimos 24 meses)
  - Certificados de cotización
  - Documentos de contrato
  - Certificados de vacaciones pendientes
- Descargar en PDF con firma digital
- Historial de descargas (quién, cuándo, qué)

#### RF-003: Solicitud de Cambios
- Empleado puede solicitar cambios en datos personales
- Campos editables: Teléfono, Email personal, Dirección
- Campos NO editables: Nombre, Apellidos, DNI
- Workflow de aprobación por RRHH antes de actualizar

#### RF-004: Reportería Personal
- Listado de absentismos (por tipo: enfermedad, vacaciones, permisos)
- Cálculo automático de días disponibles de vacaciones
- Proyección: "Cuántas vacaciones tendré el próximo año"
- Notificaciones: "Te quedan 5 días de vacaciones por tomar"

### Requerimientos Técnicos

#### RT-001: Integración con Therefore
- Portal reutiliza autenticación corporativa
- Datos en tiempo real desde Therefore (no batch)
- Cache de 5 minutos para documentos (balance performance)
- Sincronización nocturna de cambios RRHH → Portal

#### RT-002: Integradores Externos
- Integración con generador de nómina (lectura XML)
- Integración con firma digital (validación PKI)
- API de portal con rate limiting (100 req/min por usuario)

#### RT-003: Escalabilidad y Disponibilidad
- 500 usuarios concurrentes pico (fin de mes)
- 99.5% SLA
- Disaster recovery: RTO 4h, RPO 1h
- Backups diarios, retenidos 90 días

### Requerimientos de Datos

| Dato | Volumen | Origen | Frecuencia |
|------|---------|--------|-----------|
| Nómina | 12,000 docs/año | Sistema nómina | Mensual |
| Documentos contrato | 500 | Therefore | Bajo cambio |
| Ausencias | 5,000/año | RRHH | Diaria |
| Solicitudes cambio | 1,000/año | Portal | Bajo cambio |

### Requerimientos de Usabilidad

- Interfaz responsive (desktop, tablet, móvil)
- Tiempo de carga < 2 segundos
- Accesibilidad WCAG 2.1 AA
- Disponible en 3 idiomas (español, inglés, francés)

### Aceptación

✓ Empleado accede con su usuario corporativo y ve sus documentos
✓ Descarga PDF de nómina → se crea entrada en historial
✓ Solicita cambio de teléfono → RRHH lo aprueba → actualiza automáticamente
✓ Notificación: "Te quedan 5 días de vacaciones por disfrutar"

---

## Caso 2: Análisis - Sistema de Gestión de Incidencias (Grande)

### Contexto
- **Cliente**: Empresa de IT
- **Necesidad**: Gestión de tickets de soporte interno
- **Usuarios**: 80 técnicos, 500+ solicitantes
- **Integración**: Debe conectar con Jira, Slack, Azure
- **Volumen**: 2,000 incidencias/mes

### Requerimientos Principales

#### Creación de Incidencia
- Solicitante abre ticket con: Título, Descripción, Categoría, Urgencia
- Sistema asigna automáticamente a equipo según categoría
- Se crea canal Slack automático para comunicación
- Notificaciones: Técnico asignado recibe email + notificación app

#### Escalado Automático
- Si incidencia > 4 horas sin actualización → escalada a supervisor
- Si > 8 horas → notificación a director de IT
- Si > 24 horas → llamada telefónica automática

#### Seguimiento del SLA
- Crítica: Resolución en 2h
- Alta: Resolución en 4h
- Media: Resolución en 24h
- Baja: Resolución en 5 días
- Sistema alertas en rojo cuando SLA en riesgo

#### Cierre y Satisfacción
- Técnico resuelve y propone cierre
- Solicitante confirma cierre o reabre
- Encuesta de satisfacción (1-5 estrellas)
- Feedback se registra para métricas de equipo

### Requerimientos de Integración

- **Jira**: Sync bidireccional de tickets
- **Slack**: Canal por incidencia, notificaciones
- **Azure**: Autenticación y grupos de usuarios
- **Email**: Notificaciones, replies vía email crean comentarios

### Métricas Requeridas

- Tiempo promedio de resolución por categoría
- Tasa de escalados
- Satisfacción del cliente (NPS)
- Carga de trabajo por técnico
- Tendencias: Qué categorías generan más tickets

---

## Caso 3: Análisis - Integración ERP (Pequeño)

### Contexto
- **Cliente**: Empresa de distribución
- **Necesidad**: Sincronizar órdenes de compra Therefore ↔ SAP
- **Volumen**: 500 órdenes/mes
- **Criticidad**: Alta (afecta logística)

### Flujo de Datos

```
SAP (Maestro de proveedores, precios)
  ↓ [Nightly sync]
Therefore (Órdenes de compra)
  ↓ [User creates/modifies]
Therefore (Orden actualizada)
  ↓ [Auto-export cuando status = "Confirmada"]
SAP (Importa a modulo compras)
  ↓ [SAP crea solicitud de pedido]
Proveedor (Recibe PO)
```

### Requerimientos de Sincronización

- Maestro de proveedores: Sync nocturno (bidireccional)
- Precios: Sync semanal (desde SAP a Therefore)
- Órdenes confirmadas: Export en tiempo real a SAP
- Recepciones: Import desde SAP a Therefore (actualizaciones de entrada)

### Manejo de Errores

- Si export a SAP falla: 3 reintentos (cada 1h)
- Si falla luego de 3 reintentos: Notificación a administrador
- Si datos inconsistentes: Reporte generado, requiere validación manual

---

## Plantilla de Análisis Mínimo

Para hacer Análisis rápido (2-3 días), capturar:

### Sección 1: Contexto
- Cliente, escala, timeline
- Usuarios afectados
- Integradores necesarios

### Sección 2: Requerimientos Funcionales (3-5 máximo)
- Cada uno con descripción clara
- Casos de uso principales

### Sección 3: Requerimientos Técnicos (3-5)
- Integración (con qué sistemas)
- Performance (volumen, concurrencia)
- Disponibilidad (SLA)

### Sección 4: Criterios de Aceptación
- Escenarios testables
- Condiciones de "listo para EFDT"

### Sección 5: Supuestos y Riesgos
- Qué asumimos que el cliente hará
- Qué puede salir mal

---

## Estimación: Análisis vs EFDT

```
Análisis de Requerimientos: 2-3 días
  ↓ (Aprobación del cliente: ~5-7 días)
EFDT: 3-5x más tiempo que análisis

Ejemplo:
- Análisis: 2 días
- EFDT: 5-7 días (1.5-3x más complejo)
```

**Nunca hacer EFDT sin Análisis previo aprobado.**

---

**Última actualización**: 2026-05-28  
**Versión**: 1.0  
**Estado**: Validado con proyectos reales
