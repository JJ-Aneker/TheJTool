# EFDT Generator — Módulo para TheJTool

Módulo de generación automática de documentos EFDT para Canon España · Therefore™.

## Ficheros a añadir al repo TheJTool

```
api/
  analyze.js                          ← Vercel Function: Claude extrae datos del briefing
  build-docx.js                       ← Vercel Function: genera el .docx
  _lib/
    knowledge/
      ratios.js                       ← Ratios de estimación validados
      textos_estandar.js              ← Literatura fija (confidencialidad, disclaimers...)
      verticales.js                   ← Estructuras por vertical (HR, NotifAPP, Facturas...)

src/
  views/
    EFDTGenerator.jsx                 ← Vista React principal
  styles/
    efdt-generator.css                ← Estilos del módulo
```

## Cambios en ficheros existentes

Ver `APP_JSX_DIFF.md` para los 4 cambios mínimos en `App.jsx`.

## Dependencia npm a añadir

```bash
npm install docx
```

O añadir manualmente en `package.json`:
```json
"docx": "^9.6.1"
```

## Variable de entorno en Vercel

```
ANTHROPIC_API_KEY=sk-ant-...
```

Si ya la tienes configurada en el proyecto Vercel para otros módulos, no hace falta añadirla de nuevo.

## Flujo de uso

1. Usuario accede a `/efdt` (requiere autenticación — heredada del proyecto)
2. Sube documentos de briefing (PDF, Word, email HTML, TXT)
3. Selecciona vertical y tipo de documento
4. Añade instrucciones adicionales opcionales
5. Claude analiza el briefing y extrae datos estructurados del proyecto
6. Usuario revisa y valida los datos extraídos
7. Se genera el `.docx` con formato EFDT corporativo Canon
8. Usuario descarga el documento listo para revisar y entregar

## Verticales soportadas

- **notifapp**: Gestión de Notificaciones AAPP
- **hr**: Expedientes de Empleados
- **facturas**: Facturas de Proveedores (con Smart Capture)
- **sage**: Integración Therefore™ + SAGE X3
- **evolutivo**: Change Request / Evolutivo
- **generico**: Proyecto genérico Therefore™

## Notas

- El módulo es completamente autónomo — no depende de APIs externas excepto Anthropic
- Todo el conocimiento (ratios, textos, estructuras) está embebido en `api/_lib/knowledge/`
- El documento generado usa los estilos corporativos Canon (Tungsten Reveal EXT, Montserrat, rojo #C00000)
- Después de abrir el .docx en Word: Ctrl+A → F9 para actualizar el índice de contenidos
