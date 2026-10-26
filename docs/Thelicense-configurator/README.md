# Therefore™ License Configurator

Herramienta web para generar cotizaciones de licencias Therefore en sus tres modalidades: OnPremise, Online y Suscripción.

## Funcionalidades

✅ **Catálogo de artículos** - 122 items clasificados por edición
✅ **Configuración de licencias** - Agregar items y definir cantidades
✅ **Cálculo automático** - Totales de licencias, CSS y servicios
✅ **Guardar cotizaciones** - Almacenamiento en Supabase con RLS
✅ **Historial** - Recuperar cotizaciones anteriores
✅ **Export Excel** - Generar hojas de cálculo con la configuración

## Estructura de Datos

### Items de Licencias

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `codigo` | varchar(50) | Código del artículo (ej: THE.EA.001) |
| `descripcion` | text | Descripción del producto |
| `clase` | varchar(50) | Clase de artículo (THE.EA, THE.ON, THE.SU) |
| `categoria` | varchar(100) | Categoría (Licencias, CSS, Servicios) |
| `pvp` | decimal(10,2) | Precio de venta |
| `css_pvp` | decimal(10,2) | Precio CSS |
| `puntos` | int | Puntos de licencia (solo OnPremise) |
| `edicion` | varchar(20) | onpremise / online / suscripcion |
| `activo` | boolean | Si el item está disponible |

### Cotizaciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | varchar(200) | Nombre de la cotización |
| `cliente` | varchar(200) | Nombre del cliente |
| `edicion` | varchar(20) | Tipo de licencia |
| `oportunidad` | varchar(100) | Código de oportunidad SFDC |
| `account_manager` | varchar(100) | Responsable |
| `items` | jsonb | Array de items seleccionados |
| `servicios` | jsonb | Array de servicios |
| `tech_partners` | jsonb | Array de tech partners |
| `total_licencias` | decimal(10,2) | Total licencias |
| `total_css` | decimal(10,2) | Total CSS |
| `total_servicios` | decimal(10,2) | Total servicios |
| `total_general` | decimal(10,2) | Total general |
| `notas` | text | Observaciones |

## Instalación

### 1. Crear las tablas en Supabase

Ejecuta los siguientes scripts SQL en el editor de Supabase:

```bash
# Tabla de items (catálogo)
docs/Thelicense-configurator/supabase_items_table.sql

# Tabla de cotizaciones
docs/Thelicense-configurator/supabase_quotations_table.sql
```

### 2. Importar catálogo de items

```bash
# Asegúrate de tener las variables de entorno
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"

# Ejecutar script de importación
cd docs/Thelicense-configurator
node import_items_to_supabase.js
```

### 3. Verificar importación

En Supabase SQL Editor:

```sql
SELECT edicion, COUNT(*) as total
FROM therefore_license_items
GROUP BY edicion;
```

Debe mostrar:
- onpremise: 45 items
- online: 36 items
- suscripcion: 41 items

## Uso de la Herramienta

### Flujo de Trabajo

1. **Seleccionar edición** - OnPremise / Online / Suscripción
2. **Buscar artículos** - Por código o descripción
3. **Agregar al carrito** - Definir cantidades
4. **Agregar servicios** (opcional) - Consultoría, formación, etc.
5. **Guardar cotización** - Con datos del cliente y oportunidad
6. **Exportar Excel** - Generar archivo para envío

### Servicios Disponibles

- Consultoría: 880€/jornada
- Implementación: 705€/jornada
- Formación: 705€/jornada
- Gestión Proyecto: 705€/jornada
- Prueba de Concepto: 880€/jornada

## Archivos Fuente

Los configuradores Excel originales están en:

- `CIMS Configurador THEREFORE ON PREMISE - OPPXXXXXX CLIENTE v1.0 .xlsx`
- `CIMS Configurador THEREFORE ONLINE - OPPXXXXXX CLIENTE  v1.0.xlsx`
- `CIMS Configurador THEREFORE SUSCRIPCIÓN - OPPXXXXXX CLIENTE v1.0 .xlsx`

## Extracción de Datos

El script `extract_items.py` lee las hojas "Referencias" de los tres Excel y genera `license_items.json` con todos los artículos.

```bash
python docs/Thelicense-configurator/extract_items.py
```

## Seguridad

- **RLS Habilitado** - Row Level Security en ambas tablas
- **Aislamiento por usuario** - Cada usuario solo ve sus cotizaciones
- **Catálogo compartido** - Todos leen el mismo maestro de artículos
- **Solo admins editan items** - El catálogo es de solo lectura para usuarios normales

## Roadmap

- [ ] Añadir Tech Partners con precios
- [ ] Descuentos por volumen
- [ ] Plantillas de cotización
- [ ] Duplicar cotización existente
- [ ] Comparar cotizaciones
- [ ] Envío por email
- [ ] Generación de PDF
- [ ] Sincronización con SFDC

---

**Autor**: JJ  
**Última actualización**: 2026-10-26
