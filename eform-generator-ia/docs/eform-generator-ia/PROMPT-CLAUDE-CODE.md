# Prompt para Claude Code

Copia todo lo que hay dentro del bloque y pégalo en Claude Code (VSCode), con el repo
`C:\Github\TheJTool` abierto.

```text
Vamos a crear un módulo NUEVO e INDEPENDIENTE en TheJTool llamado "Generador de eForms IA".
Toda la especificación y el conocimiento están en docs/eform-generator-ia/.

REGLA PRINCIPAL: no modifiques el módulo "eForm Builder" existente ni su código. Puedes
LEERLO para inspirarte o reutilizar utilidades, pero si necesitas cambiar algo compartido,
pregúntame antes.

1. CONTEXTO (lee antes de nada)
   - CLAUDE.md (raíz del repo)
   - docs/eform-generator-ia/SPEC.md            ← especificación funcional y técnica
   - docs/eform-generator-ia/knowledge/*.md     ← reglas de eForms, componentes, patrones, prompts de IA
   - docs/eform-generator-ia/reference/          ← generar_eform.py (a portar a Node) y plantilla XML
   - docs/eform-generator-ia/supabase/eform_generations.sql
   Después explora el repo y localiza:
   - cómo se registra un módulo (rutas de React, sidebar, Home), y un módulo existente que
     sirva de modelo de diseño (tokens CSS, layout, componentes UI reutilizables)
   - cómo se protege una pantalla y una ruta de API para que solo accedan admins
     (Supabase Auth + tabla profiles con role)
   - la integración existente con AWS Bedrock (cliente, credenciales, model IDs)
   - cómo está montado el backend en local (server.js, routes/) y en Vercel (api/, vercel.json)

2. PLAN
   Antes de escribir código, preséntame un plan breve: ficheros nuevos, ficheros existentes
   que tocarías (solo registro de ruta/menú), dependencias npm nuevas (p. ej. formiojs para
   la vista previa, un parser XML si hace falta) y cómo funcionará igual en local y en Vercel.
   Espera mi OK.

3. IMPLEMENTACIÓN (por fases, en la rama feature/eform-generator-ia)
   Fase 1 — Backend determinista:
     - utils/eformXml.js: port de generar_eform.py según SPEC §4.2 (plantilla por defecto
       empaquetada en el código, escape XML del FDef completo, reemplazos solo en el bloque EForm).
     - utils/eformValidator.js según SPEC §4.3.
     - Parser de XML de categoría (SPEC §4.4).
     - Tests unitarios (SPEC §4.2) con el runner que ya use el repo (si no hay, propón uno ligero).
   Fase 2 — Backend IA:
     - Prompts de knowledge/ai-prompts.md como módulo JS; conocimiento empaquetado en código
       (nada de leer docs/ con fs en runtime).
     - Endpoints /api/eform-ai/* (SPEC §4) protegidos para admin, usando el cliente Bedrock
       existente y la variable EFORM_AI_MODEL_ID (por defecto el Claude Sonnet del proyecto).
     - Parseo tolerante del JSON, 1 reintento por JSON inválido y 1 reintento por errores de validación.
     - Guardado en Supabase (tabla eform_generations). Si el backend usa la service role key,
       filtra SIEMPRE por user_id del usuario autenticado.
   Fase 3 — Frontend:
     - Pantallas de SPEC §3 (Inicio, Preguntas, Prompt editable, Resultado, Historial),
       con el mismo diseño que el resto de módulos y modo claro/oscuro.
     - Entrada en el menú/Home visible solo para admins.
   Fase 4 — Verificación:
     - Ejecuta los tests.
     - Prueba de extremo a extremo con la petición
       "Crea un eForm para el registro de libros que además lea QRs" (entorno Online):
       debe salir un prompt detallado, y al generar, un XML sin errores de validación.
       Guarda ese XML en docs/eform-generator-ia/examples/ para que yo lo importe en Therefore.
     - Comprueba que el eForm Builder existente sigue funcionando.

4. ENTREGA
   - Haz commits pequeños por fase en feature/eform-generator-ia (no fusiones en main).
   - Al terminar, dame un resumen corto: qué se ha hecho, variables de entorno nuevas,
     pasos manuales pendientes (SQL de Supabase, variables en Vercel) y cómo probarlo.

Si algo de la especificación choca con cómo está hecho el repo, prioriza las convenciones del
repo y dímelo. Si te falta un dato (nombres de tablas, rol admin, model ID), búscalo en el
código primero y pregúntame solo si no lo encuentras.
```
