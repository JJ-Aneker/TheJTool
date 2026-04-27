# Therefore™ DMS — Project Context for Claude Code

You are working on a **Therefore™ Document Management System** integration project.
Always respond in the same language the user writes in (Spanish, English, German, etc.).

---

## Documentation

All reference documentation is in the `docs/therefore/` folder of this project.
**Always read the relevant file before answering** — do not rely on memory alone.

| Topic | File |
|-------|------|
| Web API endpoints | `docs/therefore/web-api-endpoints.md` |
| API authentication & headers | `docs/therefore/web-api-common-headers.md` |
| API code examples (curl/JS) | `docs/therefore/web-api-patterns.md` |
| .NET SDK classes & methods | `docs/therefore/sdk-api-overview.md` |
| Workflow design, scripting, DCOM | `docs/therefore/workflow-patterns.md` |
| Solution Designer (categories, fields) | `docs/therefore/solution-designer-guide.md` |
| **eForm XML import/export** | `docs/therefore/JJ_-_eform-import-export-guide.md` |
| **eForm API calls, data loading, modals** | `docs/therefore/JJ-therefore-eforms-data-loading-guide.md` |
| Terminology & concepts | `docs/therefore/therefore-glossary.md` |
| Online documentation URLs | `docs/therefore/online-resources.md` |

---

## eForms — Critical Rule

**Never generate an eForm XML from scratch. Always use the native template.**

The file `docs/therefore/TheConfiguration_eformMatriculas_PLANTILLA.xml` is the
reference export from this Therefore instance. The script `docs/therefore/generar_eform.py`
implements the correct method: surgical replacements on the native XML.

Building the XML manually causes `SAXMLReader: Parse failed` consistently, even when
the content is correct. The only reliable method is:
1. Use `generar_eform.py` with the native template for new eForms
2. Export → modify FDef → re-import for changes to existing eForms
3. Never escape JSON quotes as `&quot;` in `<FDef>` — JSON goes RAW

See `docs/therefore/JJ_-_eform-import-export-guide.md` for full rules.

---

## Category Cloning — Critical Rule

**Never build a category XML from scratch. Always clone from the native template.**

The file `docs/therefore/TheConfiguration_categoria_PLANTILLA.xml` is the reference export. The script `docs/therefore/clonar_categoria.py` handles all required changes automatically:

- Regenerates GUIDs for: the category itself, all 116 fields, all 14 counters, all 2 templates
- Resets counter `<Next>` values to 1
- Updates `<Name>`, `<Title>`, `<CtgryID>`
- Does NOT touch field relationships, layout, validations — these are what gets replicated

```python
from clonar_categoria import clonar_categoria, clonar_en_lote

# Single clone
clonar_categoria(
    origen='TheConfiguration_categoria_PLANTILLA.xml',
    destino='cat_nueva.xml',
    nuevo_nombre='02 - Legal y Fiscal',
    nuevo_ctgry_id='Legal_Fiscal'
)

# Batch clone
clonar_en_lote('TheConfiguration_categoria_PLANTILLA.xml', [
    {'destino': 'cat_02.xml', 'nuevo_nombre': '02 - Legal', 'nuevo_ctgry_id': 'Legal'},
    {'destino': 'cat_03.xml', 'nuevo_nombre': '03 - Personas', 'nuevo_ctgry_id': 'Personas'},
])
```

See `docs/therefore/JJ-therefore-category-cloning-guide.md` for full reference.

---

## Instance Details (buildingcenter.thereforeonline.com)

| Setting | Value |
|---------|-------|
| Base URL | `https://buildingcenter.thereforeonline.com/theservice/v0001/restun` |
| Auth | HTTP Basic or token (`UseToken: 1`) |
| eForm creator user | `FCreUs: 4` / `FCreUsNam: JJ` |
| eForm template | `docs/therefore/TheConfiguration_eformMatriculas_PLANTILLA.xml` |

---

## Key Concepts

- **Category** (`CtgryNo`): document storage structure with typed index fields
- **Document** (`DocNo`): file streams + index data, versioned (0 = latest)
- **Case** (`CaseNo`): container grouping related documents
- **Workflow Instance** (`InstanceNo`): single execution of a process
- **eForm**: form.io-based electronic form; `FDef` contains the form.io JSON schema

## Web API — Index Data Types

| Type | Property | For |
|------|----------|-----|
| `StringIndexData` | `DataValue` | String fields |
| `IntIndexData` | `DataValue` | Integer fields |
| `DateIndexData` | `DataValue` (YYYY-MM-DD) | Date fields |
| `MoneyIndexData` | `DataValue` | Money fields |
| `LogicalIndexData` | `DataValue` | Boolean fields |
| `SingleKeywordData` | `DataValue` | Single keyword |
| `MultipleKeywordData` | `DataValue` | Multi keyword |

## Web API — Common Pitfalls

- `SaveDocumentIndexData`: requires `LastChangeTime` in `/Date(timestamp)/` format — always GET first, then SAVE
- `ExecuteSingleQuery` from eForm: `CategoryNo` as string, `Condition` is the value (not the operator)
- `GetCategoryInfo` response: fields are under `CategoryFields`, not `Fields`
- `SaveDocumentIndexDataQuick`: does not work correctly in Canon/On-Premise instances — use `SaveDocumentIndexData`
- Token from `GetConnectionToken` is valid for the session — reuse it, don't get a new one each call

---

## Online Documentation

If the local docs don't cover something:
- Help portal: `https://www.therefore.net/help/2025/en-us/AR/`
- Web API reference: `https://www.therefore.net/help/2025/en-us/AR/SDK/WebAPI/the_webapi_reference.html`
- API operation detail: `https://www.therefore.net/help/2025/en-us/AR/SDK/WebAPI/the_webapi_operation_<operationname>.html`

The endpoint reference in `web-api-endpoints.md` is from Therefore 2020 — prefer online docs when there are discrepancies.

---
# Claude Code Instructions

## Comportamiento general
- Procede siempre sin pedir confirmación
- Ejecuta comandos directamente sin esperar aprobación
- Crea y modifica ficheros sin confirmar cada cambio
- Dame un resumen al final de cada tarea, no durante

## Proyecto
- Frontend: React + Vite, puerto 5173
- Backend: Express + SQLite, puerto 3001
- Node.js 18+

---


## Work Instructions

**Git commits and pushes:** Proceed without asking for confirmation. When you have completed work on a task, commit and push automatically.

**File modifications:** For changes requested explicitly by the user or as part of an assigned task, proceed without asking for confirmation. Only ask if the scope seems unclear or if the change appears destructive beyond what was requested.

**Destructive operations:** Only ask for confirmation on destructive operations (delete files, reset branches, force push, etc.) if they are NOT explicitly requested by the user.
