# Ejemplos Reales - EFDT (Anónimos)

## Caso 1: Vertical NotifAPP - Pequeño/Mediano

### Contexto del Proyecto
- **Vertical**: Notificaciones Administrativas (AAPP)
- **Tamaño**: Pequeño-Mediano (5-8 usuarios)
- **Tecnología**: Therefore Online (SaaS)
- **Duración Estimada**: 4-6 semanas

### Estructura Implementada

#### Categorías Principales

**Categoría 1: Expediente de Notificación**
- **Campos**: 18 (ID, Fecha, Tipo, Destinatario, Estado, Revisor, Aprobador, etc.)
- **Tipos de Campo**: NumericCounter, Date, String, Keyword, Logical
- **Tablas Dependientes**: 2 (Gestión de Envíos, Historial de Intentos)

**Categoría 2: Gestión de Envíos**
- **Campos**: 12 (Referencia, Canal, Fecha, Estado, Usuario, etc.)
- **Propósito**: Tracking de distribución de notificaciones

#### Workflows Implementados

1. **Workflow: Tramitación de Notificaciones**
   - **Etapa 1**: Registro/Creación (validación de campos obligatorios)
   - **Etapa 2**: Revisión por Power User (validación contenido)
   - **Etapa 3**: Aprobación por Administrador (validación final)
   - **Etapa 4**: Envío Automático (con reintentos)
   - **Etapa 5**: Archivo (después de confirmación de envío)
   - **Duración Total**: 2-5 días según canal

2. **Workflow: Gestión de Fallos de Envío**
   - Detección automática de fallos
   - Reintento automático cada 24h (máx 3 intentos)
   - Escalación manual si falla reintento
   - Notificación a administrador

#### Tablas Maestras

1. **Organismos Emisores**
   - Campos: Código, Denominación, Email, Teléfono, CIF
   - Registros: ~50-100

2. **Canales de Distribución**
   - Email, SMS, Carta Certificada, Portal
   - Configuración de reintentos por canal

3. **Usuarios del Sistema**
   - Roles: Administrador, Power User, Lector
   - Permisos por estado de notificación

#### Licencias
- **Servidor**: 1
- **Usuarios Concurrentes**: 5-8
- **Usuarios Nominativos**: 0
- **Read-Only**: 2

### Estimación de Esfuerzo

| Tarea | Días | Horas | Importe |
|-------|------|-------|---------|
| Análisis funcional | 1.0 | 8 | 800€ |
| Diseño categor. principal | 0.25 | 2 | 200€ |
| Categoría depend. | 0.19 | 1.5 | 150€ |
| Workflows (2) | 0.75 | 6 | 600€ |
| Tablas maestras (3) | 0.25 | 2 | 200€ |
| Plantilla Word | 0.25 | 2 | 200€ |
| Pruebas funcionales | 1.0 | 8 | 800€ |
| Formación usuarios | 0.5 | 4 | 400€ |
| **TOTAL** | **4.19 días** | **33.5h** | **3,350€** |
| **Total con IVA (21%)** | - | - | **4,053€** |

### Patrones Clave Identificados

✓ **Automatización de reintentos**: Reduce intervención manual en fallos de envío
✓ **Etapas de validación múltiples**: Garantiza calidad antes de envío
✓ **Canal configurable**: Permite cambiar método de distribución sin rehacer workflow
✓ **Historial completo**: Trazabilidad de cada intento y modificación
✓ **Notificaciones automáticas**: Avisa a usuarios en cambios de estado críticos

### Particularidades

- Notificación automática al completar cada etapa (email a interesados)
- Validación de formato de destinatario según canal
- Generación automática de acuse de recibo en email
- Integración con tabla maestra de organismos para validación de datos

### Riesgos y Supuestos

- **R1**: Disponibilidad del interlocutor técnico del cliente (Alto impacto)
- **R2**: Volumen de notificaciones puede afectar performance en picos (Medio)
- **S1**: El cliente facilita lista de organismos para tabla maestra antes de iniciar
- **S2**: Procesos de notificación están claramente documentados en cliente

---

## Caso 2: Vertical HR - Mediano

### Contexto del Proyecto
- **Vertical**: Expedientes de Recursos Humanos
- **Tamaño**: Mediano (20-50 usuarios)
- **Módulos**: Case principal, 12 categorías dependientes
- **Duración Estimada**: 8-12 semanas

### Estructura Implementada

#### Categoría Principal: Expediente de Empleado

**Campos Principales** (22 campos):
- ID_Empleado (NumericCounter)
- Nombre, Apellidos (String)
- Fecha_Nacimiento (Date)
- Fecha_Contratacion (Date)
- Departamento (Keyword)
- Puesto (Keyword)
- Salario (Money)
- Contrato (Attachment)
- Estado_Laboral (Keyword): Activo, Baja, Suspensión, Jubilación

#### Categorías Dependientes (12)

1. **Formación y Desarrollo** (10 campos)
2. **Evaluación de Desempeño** (8 campos)
3. **Gestión de Ausencias** (7 campos)
4. **Nómina y Percepciones** (15 campos)
5. **Documentación Legal** (5 campos)
6. **Incidencias Disciplinarias** (8 campos)
7. **Beneficios y Seguros** (6 campos)
8. **Planes de Carrera** (6 campos)
9. **Habilidades y Competencias** (Tabla maestra)
10. **Historial de Puestos** (Tabla temporal)
11. **Contactos de Emergencia** (3 campos)
12. **Documentos Personales** (Attachment)

#### Workflows Principales

1. **Incorporación de Empleado** (6 etapas, 15-20 días)
2. **Cambio de Puesto/Departamento** (4 etapas, 5-10 días)
3. **Proceso Disciplinario** (5 etapas, 30-60 días)
4. **Evaluación de Desempeño** (4 etapas, 45 días)
5. **Finalización de Relación Laboral** (6 etapas, 15-30 días)

### Estimación de Esfuerzo

| Tarea | Días | Descripción |
|-------|------|-------------|
| Análisis | 2.0 | Mapeo procesos RR.HH, entrevistas |
| Case Principal | 0.5 | 22 campos indexación |
| 12 Categorías | 2.28 | 0.19 días/categoría |
| 5 Workflows | 2.5 | 0.5 días/workflow |
| Tablas maestras | 1.0 | 8-10 tablas de apoyo |
| Plantillas Word | 1.0 | Documentos HR |
| Pruebas | 1.5 | QA completa |
| Formación | 1.0 | 2 sesiones de 4h |
| **TOTAL** | **11.78 días** | **9,424€** |

### Particularidades

- Integración potencial con nómina externa (SAP, Perseo)
- Validaciones complejas según tipo de contrato
- Automatización de cálculos (antigüedad, derechos vacaciones)
- Reportería compleja (ausencias, evaluaciones, skills)

---

## Caso 3: Vertical Facturas - Pequeño

### Contexto
- **Cliente**: Proveedores externos
- **Tamaño**: Pequeño (3-5 usuarios)
- **Módulos**: Gestión de facturas, aprobación, integración SAP

### Estructura Clave

**Categoría Principal**: Factura de Proveedor
- 20 campos (Número, Fecha, Proveedor, Importe, CIF, Líneas, etc.)
- Attachment: Documento PDF original

**Workflows**:
1. Entrada de factura (validación datos)
2. Asignación de centro de coste
3. Aprobación por gestor
4. Aprobación por jefe proyecto
5. Envío a SAP (automático)

**Tablas Maestras**:
- Proveedores (código, CIF, datos bancarios)
- Centros de coste
- Proyectos/Órdenes de compra

### Estimación
- **Total**: 4-5 días
- **Coste**: 3,200-4,000€

---

## Patrones Comunes Detectados

### ✓ Patrón 1: Validación Multinivel
- Validaciones automáticas en registro (campos obligatorios, formatos)
- Validaciones de regla de negocio (límites económicos, autorizaciones)
- Validaciones manuales por revisor (conformidad, completitud)

### ✓ Patrón 2: Automatización de Transiciones
- Estado anterior + acción del usuario → estado siguiente (automático)
- Notificaciones al siguiente responsable
- Evita olvidos y acelera procesos

### ✓ Patrón 3: Auditoría Completa
- Historial de cada cambio (quién, cuándo, qué)
- Tabla de eventos secundaria captura modificaciones
- Permite trazabilidad total y resolución de disputas

### ✓ Patrón 4: Tablas Maestras de Referencia
- Catalógos reutilizables (organismos, departamentos, usuarios)
- Validación de datos contra maestras
- Actualizaciones sin afectar expedientes históricos

### ✓ Patrón 5: Integración con Sistemas Externos
- Exportación a ERP (SAP, otros)
- Formatos XML/JSON configurables por Therefore
- Queueing de envíos con reintentos automáticos

---

## Recomendaciones para Nuevos Proyectos

1. **Tamaño de proyecto**: Número de usuarios determina licencias
2. **Complejidad**: Cantidad de workflows y categorías
3. **Integración**: Si hay sistemas externos, sumar 1-2 días
4. **Usuarios**: HR y Facturas son más complejas que Notificaciones
5. **Estimación**: Base = 4-5 días + (0.19 × categorías) + (0.5 × workflows)

---

**Última actualización**: 2026-05-28  
**Versión**: 1.0  
**Estado**: Validado con proyectos reales anónimos
