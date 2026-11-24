# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18 + Vite + Ant Design 5 + Supabase + Express backend. AWS Bedrock for document generation.

## Users

Equipo mixto de consultoría Therefore™: comerciales que generan propuestas y cotizaciones, e implementadores técnicos que configuran eForms, categorías y customizaciones. Expertise variada desde usuarios ocasionales hasta expertos Therefore™. Uso semanal a diario dependiendo del rol y fase de proyecto.

## Product Purpose

TheJay centraliza herramientas que antes estaban dispersas (Therefore™ Solution Designer, Word, Excel, cliente Therefore™) en una única aplicación web. Permite a equipos de consultoría trabajar más rápido sin saltar entre aplicaciones: desde generar documentos comerciales con IA hasta configurar estructuras técnicas de Therefore™.

El éxito se mide en reducción de tiempo por tarea (cotización, documento técnico, configuración de categoría) y eliminación de errores por trabajo manual repetitivo.

## Positioning

A diferencia de trabajar directamente en las herramientas nativas de Therefore™, TheJay unifica el flujo completo de consultoría en un solo lugar: preparar propuestas comerciales → configurar estructuras técnicas → ejecutar consultas → generar documentación. No es un reemplazo de Solution Designer sino una capa de aceleración sobre él.

## Operating Context

- **Proyectos de implementación Therefore™**: configuración inicial de categorías, eForms, workflows para nuevos clientes
- **Propuestas comerciales**: generación de cotizaciones OnPremise/Online/Suscripción con interpretación de lenguaje natural
- **Consultas y reportes**: ejecución de consultas SQL contra instancias Therefore™ de clientes
- **Documentación técnica**: generación automática de documentos DOCX con AWS Bedrock a partir de datos estructurados
- **Gestión multi-tenant**: cada usuario trabaja con múltiples instancias Therefore™ (clientes diferentes)

## Capabilities and Constraints

**Capacidades**:
- Configurador de licencias Therefore™ con parsing de lenguaje natural (AWS Bedrock)
- Generador de documentos técnicos/comerciales con templates y contenido generado por IA
- Constructor visual de eForms (formularios electrónicos Therefore™)
- Clonador de categorías Therefore™ desde templates nativos XML
- Reporter de consultas contra API REST de Therefore™
- Gestión de tenants, usuarios, verticales
- Cuestionarios IT para relevamiento de proyectos
- Multi-idioma (español/inglés)
- Dark/Light theme

**Restricciones técnicas**:
- Importación/exportación de XML nativo de Therefore™: nunca construir desde cero, siempre clonar templates
- Autenticación HTTP Basic o token contra Therefore™ Web API
- Campo `FDef` en eForms contiene JSON RAW (nunca escapar comillas)
- Offset system crítico para IDs en XMLs multi-categoría (evitar colisiones SQL 2627)

**Terminología Therefore™**:
- Category (CtgryNo): estructura de almacenamiento con campos tipados
- eForm: formulario electrónico basado en form.io
- Document (DocNo): archivo + índices
- Case (CaseNo): contenedor de documentos relacionados
- Workflow Instance: ejecución de proceso

## Brand Commitments

**Nombre**: theJay / TheJay (ambas formas se usan indistintamente)

**Logo**: Imagen actual en `/assets/images/logo.png` debe mantenerse. Aparece en sidebar con dimensiones específicas (37×50px en desktop, 28×38px en mobile).

**Relación visual con Therefore™**: Mantener coherencia con la marca Therefore™ (Canon) sin copiar su identidad. TheJay es herramienta de consultoría, no producto Canon.

## Evidence on Hand

- Sistema de tokens de diseño completo en `src/styles/design-tokens.css` con dark/light theme
- Múltiples vistas funcionales: LicenseConfigurator, CategoryBuilder, DocumentGenerator, ThereforeReporter, EFormBuilder
- Documentación técnica Therefore™ en `docs/therefore/` (endpoints, patrones, guías)
- Templates nativos: `TheConfiguration_eformMatriculas_PLANTILLA.xml`, `TheConfiguration_categoria_PLANTILLA.xml`
- Scripts Python de clonación: `generar_eform.py`, `clonar_categoria.py`

**Ausencias que no se deben fabricar**:
- No hay testimonios de clientes reales
- No hay métricas públicas de adopción
- No hay casos de estudio documentados formalmente

## Product Principles

1. **Template-first, never from scratch**: Las configuraciones Therefore™ (eForms, categorías) se clonan de templates nativos exportados, nunca se construyen manualmente. Los XMLs generados a mano fallan consistentemente.

2. **Aceleración sin abstracción total**: No se oculta la complejidad de Therefore™, se facilita. Los usuarios expertos siguen viendo estructura real (XML, campos, tipos) pero con ayudas visuales e IA.

3. **Multi-tenant por diseño**: Cada funcionalidad asume que un usuario trabaja con múltiples instancias Therefore™ simultáneamente. Los selectores de tenant son omnipresentes.

4. **IA como asistente, no como oráculo**: El lenguaje natural en licencias y la generación de documentos son aceleradores que el usuario valida y ajusta, no verdades absolutas que se aplican ciegamente.

5. **Expertise mixta como norma**: La UI no asume expertise uniforme. Tooltips, ejemplos y validaciones conviven con atajos y campos avanzados para expertos.

## Accessibility & Inclusion

No hay estándar WCAG explícitamente requerido, pero la aplicación debe funcionar con navegación por teclado (muchos usuarios técnicos prefieren teclado sobre mouse) y mantener ratios de contraste adecuados en ambos themes (dark/light).
