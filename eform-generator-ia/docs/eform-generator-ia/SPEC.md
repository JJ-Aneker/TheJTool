# Generador de eForms IA — Especificación

> Nuevo módulo independiente de TheJTool. **No modificar el módulo "eForm Builder" existente.**
> Destinatarios: técnicos y consultores Therefore™. Acceso en v1: **solo administradores**.

---

## 1. Objetivo

Permitir que un técnico describa en lenguaje natural un eForm ("Crea un eForm para el registro
de libros que además lea QRs") y obtenga un **XML listo para importar en Therefore Solution Designer**.

Flujo en dos pasos con la IA:

1. **Petición general → Prompt detallado** (editable por el usuario).
2. **Prompt detallado → JSON form.io** → el backend construye el XML de forma determinista
   a partir de una plantilla nativa, lo valida y lo devuelve.

La IA **nunca escribe el XML**. Solo produce el JSON de componentes form.io. El XML lo monta
el código (port a Node de `reference/generar_eform.py`).

---

## 2. Decisiones ya tomadas

| Tema | Decisión |
|------|----------|
| Ubicación backend | Backend propio de TheJTool (`server.js` / `routes/` y, si aplica, `api/` para Vercel) |
| Modelo IA | Claude Sonnet vía AWS Bedrock (reutilizar la integración Bedrock existente) |
| Historial | Supabase, nueva tabla `eform_generations` (script en `supabase/eform_generations.sql`) |
| Acceso | Solo administradores (reutilizar el mecanismo de rol existente en `profiles`) |
| eForm Builder actual | Se queda intacto. Este es un módulo nuevo e independiente |
| Diseño | Igual que el resto de módulos (tokens CSS centralizados, sidebar, modo claro/oscuro) |

---

## 3. Pantallas y flujo de usuario

### 3.1 Inicio (paso 1 — "Describe tu eForm")

- **Cabecera** con nombre del módulo y una frase: "Describe el formulario y la IA lo construye
  listo para importar en Therefore".
- **Bloque "Cómo funciona"** (3 pasos visuales): Describe → Revisa el prompt → Descarga el XML.
- **Bloque "Cuanto más detalle, mejor resultado"** con checklist:
  1. Nombre del formulario (y FormID si se quiere fijo)
  2. Campos: cuáles, tipo y obligatoriedad
  3. Valores de los desplegables
  4. Categoría destino: nombres de campos para que las *keys* coincidan
  5. Extras: condicionales, autorrelleno, validaciones (email, CIF, CP)
- **Ejemplos clicables** (rellenan el textarea): "Alta de cliente", "Recepción de vehículo en
  taller", "Registro de libros con lector QR", "Solicitud de vacaciones con datos del usuario".
- **Textarea** de petición (grande, con contador de caracteres e indicador de "nivel de detalle":
  bajo / medio / alto según longitud y presencia de palabras clave como obligatorio, desplegable…).
- **Entorno destino** (obligatorio): `Therefore Online` | `On-Premise`. Campos opcionales:
  tenant (Online) o URL base del servidor (On-Premise).
- **Bloques predefinidos** (chips multiselección). Cada chip añade al contexto el patrón probado
  correspondiente (ver `knowledge/patterns.md`):
  - 📷 Lector QR / códigos de barras
  - 👤 Autorrelleno con el usuario conectado
  - 🔍 Buscar en una categoría maestra
  - ✏️ Modal de actualización de datos
  - ✍️ Firma (canvas)
- **Plantilla nativa** (opcional): subir un XML exportado del Solution Designer del cliente.
  Si no se sube, se usa `reference/TheConfiguration_eformMatriculas_PLANTILLA.xml`.
  Mostrar aviso: "En On-Premise sube siempre una plantilla exportada de esa instancia
  (contiene metadatos como DefSubmNo; sin ellos la importación da error SQL 547)".
- **Categoría destino** (opcional): subir XML de categoría exportada. Se extraen los campos
  (ColName, Caption, tipo) y se muestran en una tabla. La IA usará esos ColName como *keys*.
- Botón **"Proponer prompt"**.

### 3.2 Preguntas aclaratorias (condicional)

Si la petición es vaga, la IA devuelve 2-3 preguntas cortas (con opciones sugeridas cuando
proceda). El usuario responde (o pulsa "Saltar") y se vuelve a pedir la propuesta.

### 3.3 Prompt detallado (paso 2 — "Revisa y ajusta")

- Textarea grande, editable, con el prompt detallado que propone la IA, estructurado en
  secciones (Nombre/FormID, Entorno, Secciones y campos, Desplegables, Lógica, Bloques,
  Mapeo a categoría, Notas).
- Campos editables: **Nombre del formulario (FName)** y **FormID** (validación
  `^[A-Za-z][A-Za-z0-9_]*$`, sin espacios ni acentos).
- Botones: "Volver", "Regenerar propuesta", **"Generar eForm"**.

### 3.4 Resultado (paso 3 — "Tu eForm")

- **Vista previa** renderizada con form.io (`formiojs` / `@formio/js`). Avisar de que la lógica
  JS específica de Therefore (onclick, llamadas API, cámara) no se ejecuta en la vista previa.
- **Panel de validación**: errores (bloquean la descarga) y avisos (no bloquean).
- **Pestañas**: Vista previa | JSON de componentes | Resumen de campos (tabla key/label/tipo/obligatorio).
- Botones: **Descargar XML** (`TheConfiguration_<FormID>.xml`), Copiar JSON, "Nuevo eForm".
- **Refinar**: caja de texto "¿Qué quieres cambiar?" ("añade un campo teléfono obligatorio")
  → llamada `refine` que parte del JSON actual. Se guarda como nueva versión.
- **Aviso de seguridad** si el JSON contiene credenciales (usuario/contraseña de cuenta de
  servicio, `btoa(`, `SVC_PASS`, `password`): "Estas credenciales quedarán visibles en el
  navegador de cualquier usuario del eForm".

### 3.5 Historial

- Lista de generaciones del usuario (fecha, FName, FormID, entorno, estado).
- Abrir una generación: recupera prompt, JSON y XML; permite descargar de nuevo o refinar.

---

## 4. Backend — endpoints

Prefijo sugerido: `/api/eform-ai`. Todos requieren usuario autenticado **con rol admin**
(verificar el JWT de Supabase como ya hacen otras rutas protegidas).

| Método | Ruta | Entrada | Salida |
|--------|------|---------|--------|
| POST | `/propose` | `{ request, environment, tenant?, serverUrl?, blocks[], categoryFields?[], answers?[] }` | `{ questions?: [{question, options?[]}], detailedPrompt?, suggestedFormName, suggestedFormId }` |
| POST | `/generate` | `{ detailedPrompt, formName, formId, environment, blocks[], categoryFields?[], templateXml? }` | `{ generationId, components, xml, validation: { errors[], warnings[] } }` |
| POST | `/refine` | `{ generationId, instruction }` | igual que `/generate` (nueva versión) |
| POST | `/parse-category` | `{ categoryXml }` | `{ categoryName, fields: [{ colName, caption, typeNo, typeName }] }` |
| GET | `/history` | — | lista resumida |
| GET | `/history/:id` | — | generación completa |

### 4.1 Llamadas a la IA (Bedrock, Claude Sonnet)

- **Reutilizar** el cliente/helper de Bedrock ya existente en el repo. Model ID configurable por
  variable de entorno `EFORM_AI_MODEL_ID` (por defecto el Sonnet que ya se use en el proyecto).
- **System prompt** = rol + `knowledge/eform-rules.md` + `knowledge/formio-components.md` +
  patrones de `knowledge/patterns.md` **solo de los bloques seleccionados** + contexto de entorno.
  El conocimiento debe quedar empaquetado en el código (módulo JS/import de texto), no leído
  con `fs` en tiempo de ejecución, para que funcione en Vercel.
- `/propose` devuelve JSON estricto: `{ questions | detailedPrompt, suggestedFormName, suggestedFormId }`.
  Solo devuelve `questions` si faltan datos esenciales y no se han enviado `answers`.
- `/generate` y `/refine` devuelven **solo** `{ "components": [ ... ] }`.
- Parseo tolerante (extraer el primer bloque JSON válido). Si no parsea → 1 reintento con el
  error. Si la validación da **errores** → 1 reintento enviando la lista de errores a la IA para
  que los corrija. Después, devolver lo que haya con su validación.
- `max_tokens` alto (≥ 16000) para eForms con HTML embebido. Revisar `maxDuration` de la
  función en `vercel.json` si el backend corre como serverless.

### 4.2 Generador de XML (determinista) — port de `generar_eform.py`

Implementar en Node un módulo (p. ej. `utils/eformXml.js`) con:

```
buildEformXml({ templateXml, formName, formId, components }) -> string
```

Reglas (ver también `knowledge/eform-rules.md`):

1. Partir **siempre** de la plantilla (subida o por defecto). Tomar el **primer** `<EForm>`.
2. Reemplazos quirúrgicos **solo** en: `FName`, `FDef`, `DCrea`, `Id`, `FormID`.
   Todo lo demás (incluidos `FCreUs`, `FCreUsNam`, `DefSubmNo`, `IxProfNo`, `FFold` si existen)
   queda intacto. Reemplazar dentro del bloque `<EForm>`, no en todo el fichero.
3. `FDef` = `JSON.stringify({ display: "form", settings: {}, components }, null, 2)`
   con `\n` → `\r\n`, y después **XML-escape de todo el string** en este orden:
   `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`. **No** escapar comillas (`"` va raw).
   La IA escribe el HTML de `htmlelement.content` en claro; el escape lo hace este paso.
   (No usar el helper `encode_html_for_content` de Python además de esto: produciría doble escape.)
4. `DCrea` = `YYYYMMDDHHmmss` + `000` (hora local).
5. `Id` = GUID nuevo en mayúsculas.
6. No añadir `<?xml ...?>` ni tags self-closing. Mantener la plantilla tal cual fuera del EForm.
7. Si el FormID ya existe en la instancia, Therefore dará conflicto: avisarlo en la UI.

Tests unitarios mínimos:
- Con la plantilla por defecto, el XML resultante contiene exactamente un `<EForm>`, el FDef
  des-escapado parsea con `JSON.parse`, y fuera del bloque `<EForm>` el fichero es idéntico a la plantilla.
- Un `htmlelement` con `<div onclick='x()'>` acaba como `&lt;div onclick='x()'&gt;` en el XML.
- `FCreUs`/`FCreUsNam` de la plantilla se conservan.

### 4.3 Validador (determinista)

`validateComponents(components, { environment, categoryFields }) -> { errors[], warnings[] }`

**Errores** (bloquean descarga):
- JSON no es un array de componentes / falta `type` o `key`.
- `key` duplicada o con espacios / caracteres no `[A-Za-z0-9_]`.
- `type` fuera de la lista permitida (`knowledge/formio-components.md`).
- No existe botón `submit` (`type: "button"`, `key: "submit"`).
- `htmlelement.content` contiene `<script`.
- Atributo `onclick` cuyo JS contiene `<` o `>`, o comillas dobles dentro del JS
  (convención: `onclick="..."` con JS solo en comillas simples; un `onclick='...'` que
  contenga `"` también es error).
- `customDefaultValue` / `calculateValue` con saltos de línea reales, `<`, `>` o `&&`.
- FormID inválido.

**Avisos**:
- Componente `signature` (poco fiable en Therefore → usar patrón firma canvas).
- `textfield` con `disabled: true` (provoca bucles en form.io → usar htmlelement o readonly vía JS).
- Credenciales detectadas en JS (`btoa(`, `password`, `SVC_PASS`, `Authorization: Basic`).
- `GetConnectionToken` en entorno On-Premise (devuelve HTTP 500 allí).
- Uso de `ExecuteSingleQuery` (bloqueado por CORS en algunos servidores → preferir `ExecuteMultiQuery`).
- Si hay `categoryFields`: keys de input que no coinciden con ningún ColName, y ColNames
  obligatorios no cubiertos.
- `email`/`phoneNumber` → recordar que en la categoría se mapean a campos String.

### 4.4 Parseo de XML de categoría

Extraer de `<Categories><Category>`: nombre y, por cada campo, `ColName`, `Caption` y `TypeNo`.
Mapear TypeNo: 1 String, 2 Int, 3 Date, 5 Money, 6 Logical, 8 Table (excluir de keys), otros
→ mostrar número. Verificar los nombres reales de los tags con un XML de categoría exportado
(hay ejemplos en el repo o en la documentación de Category Builder); si difieren, adaptar.

---

## 5. Supabase

Ejecutar `supabase/eform_generations.sql`. Tabla `eform_generations` con versionado simple
(`parent_id` para refinamientos). RLS: cada usuario ve lo suyo y solo admins pueden usar
el módulo. Adaptar la comprobación de admin al esquema real de `profiles`.

---

## 6. Fuera de alcance v1

- Importación directa en Therefore vía API (el usuario descarga e importa a mano).
- Generación de categoría/perfil de indexación asociado.
- Acceso para usuarios no admin.

---

## 7. Criterios de aceptación

1. El módulo aparece en el menú solo para administradores y respeta el diseño existente.
2. Con la petición "Crea un eForm para el registro de libros que además lea QRs" se obtiene un
   prompt detallado editable y, tras generar, un XML descargable sin errores de validación.
3. El XML generado con la plantilla por defecto supera los tests de 4.2.
4. Las generaciones se guardan y se pueden reabrir desde el historial.
5. El eForm Builder existente sigue funcionando sin cambios.
