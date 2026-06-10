# Therefore Solution Designer Guide

> Comprehensive reference for configuring categories, fields, access rights, cases, and other objects.

## Overview

The Solution Designer is the primary administration tool for:
- **Categories** -- Document storage structures with typed index fields
- **Case Definitions** -- Multi-document containers for business processes
- **Workflow Processes** -- Automated routing and approval flows
- **Indexing Profiles** -- Automated index data extraction rules
- **Capture Profiles** -- Scanning and import configurations
- **eForms** -- Electronic forms for data collection
- **Reports** -- Custom reporting definitions
- **Access Rights** -- Role-based and direct permissions
- **Keyword Dictionaries** -- Controlled vocabulary lists
- **Retention Policies** -- Document lifecycle management

---

## Categories

Every document is archived into exactly one category. Categories define:
1. **Index fields** (metadata schema)
2. **Dialog layout** for data entry
3. **Access rights**
4. Optional **workflow process** on archival
5. **Full-text search** configuration

### Category Properties
| Property | Description |
|----------|-------------|
| `Name` | Display name (multilingual) |
| `CtgryNo` | Unique numeric identifier |
| `GUID` | Globally unique identifier |
| `TableName` | Database table name |
| `FolderNo` | Parent folder |
| `FullTextMode` | Full-text indexing mode |
| `CheckInCommentsMode` | Check-in comments required/optional/disabled |
| `EmptyDocMode` | How to handle empty documents |
| `AutoAppendMode` | Auto-append behavior |
| `WorkflowProcessNo` | Workflow on archival |
| `WorkflowProcessNoUpdate` | Workflow on update |

### API Operations
- `GetCategoriesTree` -- Hierarchical structure
- `GetCategoryInfo` -- Full definition with fields, access masks

---

## Index Fields (TheCategoryField)

### Field Types

| Type | Description |
|------|-------------|
| `StringField` | Free text (VARCHAR) |
| `IntField` | Integer (INT) |
| `DateField` | Calendar dates (DATE) |
| `MoneyField` | Decimal/currency (DECIMAL) |
| `LogicalField` | Boolean (BIT) |
| `LabelField` | Display-only label |
| `NumericCounter` | Auto-incrementing integer |
| `TextCounter` | Auto-incrementing with format pattern (e.g., "INV-{0:D6}") |
| `TableField` | Container for sub-fields in rows |
| `CustomField` | Image fields, tab controls |

### Web API Index Data Type Mapping

| API Type | Key Property |
|----------|--------------|
| `StringIndexData` | `StringVal` |
| `IntIndexData` | `IntVal` |
| `DateIndexData` | `DateVal` (YYYY-MM-DD) |
| `DateTimeIndexData` | `DateTimeVal` (ISO 8601 + Z) |
| `MoneyIndexData` | `MoneyVal` (decimal) |
| `LogicalIndexData` | `LogicalVal` (boolean) |
| `SingleKeywordData` | `KeywordNo` (int) |
| `MultipleKeywordData` | `KeywordNoList` (int[]) |
| `TableIndexData` | `Rows` (array) |

### Field Configuration

**Validation:**
- `Mandatory` -- Required field
- `RegularExpr` -- Validation regex
- `DefaultVal` -- Default value (supports macros: `%USERNAME%`, `%DATE%`, `%TIME%`, `%DATETIME%`, `%FULLNAME%`, `%COMPUTERNAME%`)
- `IndexType` -- No index, normal, or unique

**Layout:**
- `Caption` -- Display label (multilingual)
- `PosX` / `PosY` / `Height` / `Width` -- Dialog position
- `TabOrderPos` -- Tab order
- `DisplayOrderPos` -- Column order in results
- `Visible` -- Shown in dialog

**Keywords:**
- `IsSingleKeyword` -- Single-select dropdown
- `IsMultipleKeyword` -- Multi-select
- `SelectFromDropDownBox` -- Dropdown vs list display
- `DontLoadValues` -- Lazy-load (performance)

**Dependencies:**
- `DependencyMode` -- How field depends on others
- `BelongsTo` -- Parent field
- `ForeignCol` -- Referenced foreign table column
- `KeepRedundant` -- Keep redundant copy

**Calculated Fields:**
- `Formula` -- Server-side calculation
- `Condition` -- Conditional formatting expression

---

## Keyword Dictionaries

Controlled vocabulary for index fields:
- **Simple list** -- Flat list of values
- **Hierarchical** -- Multi-level tree
- **Foreign table** -- Values from external database

### API Operations
| Operation | Description |
|-----------|-------------|
| `GetDictionaryInfo` | Dictionary details |
| `GetKeywordsByFieldNo` | Keywords for a field |
| `AddDictionaryKeyword` | Add keyword |
| `UpdateDictionaryKeyword` | Modify keyword |
| `DeleteDictionaryKeyword` | Remove keyword |
| `ValidateKeywords` | Validate field keywords |

---

## Dependent Fields

Master-detail relationships between fields. When user selects master value, dependent fields auto-populate from referenced table.

**Setup:**
1. Master field with keyword values
2. Dependent fields linked via `BelongsTo`
3. Each dependent maps to `ForeignCol` in referenced table

**API:** `FillDependentFields`, `ExecuteDependentFieldsQuery`, `QueryDependentFieldsDirect`, `PreprocessIndexData`

---

## Case Definitions

Cases group multiple documents for a business process (customer file, project folder, insurance claim).

- Has its own index fields (case-level metadata)
- Associated with one or more categories
- Optional workflow process
- Documents linked to cases, not embedded

### API Operations
| Operation | Description |
|-----------|-------------|
| `CreateCase` | Create case (CaseDefNo, IndexDataItems) |
| `GetCase` / `GetCaseDefinition` | Retrieve case/definition |
| `GetCaseDocuments` | List documents in case |
| `CloseCase` / `ReopenCase` / `DeleteCase` | Lifecycle |
| `SaveCaseIndexData` | Update case metadata |

---

## Access Rights

### Permission Model
1. **Role-based** (recommended) -- Permissions via roles assigned to users/groups
2. **Direct** (legacy) -- Permissions directly on users/groups per object

### Permission Levels
**Category:** Read, Create, Modify index data, Delete, Check out/in, View history, Export, Print, Full-text search
**Field:** Read, Write, Hide
**Case:** Read, Create, Modify, Close/Reopen, Delete, Add/remove documents
**Workflow:** Process owner, Start, View, Claim/Delegate
**Folder:** View, Create sub-folders, Modify

### Access Masks
Bitmask integers where each bit = specific permission. API returns `AccessMask` and `RoleAccessMask` on objects.

### API Operations
`GetObjectRights`, `HasPermissions`, `HasRolePermission`, `GetRolePermissions`, `GetRolePermissionConstants`

---

## eForms

Electronic forms for data collection. Submitted eForms create documents in categories.

### Web API Operations

| Operation | Description |
|-----------|-------------|
| `GetEForm` / `SaveEForm` | Load/save eForm |
| `SubmitEForm` | Submit for archival |
| `CopyEForm` / `DeleteEForm` | Manage eForms |
| `UploadEFormFile` | Attach file |
| `SearchEFormSubmission` | Query submissions |
| `VerifyReCaptchaToken` | Validate public forms |

### eForm Architecture: form.io Inside

Therefore eForms use **[form.io](https://www.form.io/)** (formio.js) as the underlying web form engine. The eForm definition (`FDef`) is a **standard form.io JSON schema**. This means:

- The form.io open-source documentation applies directly to Therefore eForm definitions
- New eForms can be built programmatically by writing valid form.io JSON
- The form.io Form Builder can be used to prototype layouts, then export JSON for Therefore

### Solution Designer Export XML Structure (`<EForm>`)

When exported via Solution Designer, each eForm is an `<EForm>` element:

```xml
<EForm>
  <FNo>-3</FNo>              <!-- Form number (negative = import placeholder) -->
  <FVer>1</FVer>             <!-- Version -->
  <FName>Form Title</FName>  <!-- Display name -->
  <FDef>{ ... }</FDef>       <!-- form.io JSON schema (the actual form definition) -->
  <DCrea>20260303...</DCrea> <!-- Creation date (YYYYMMDDHHmmssSSS) -->
  <FFold>-16</FFold>         <!-- Parent folder number -->
  <FCreUs>3</FCreUs>         <!-- Creator user number -->
  <FCreUsNam>DOMAIN\User</FCreUsNam> <!-- Creator username -->
  <IxProfNo>-2</IxProfNo>   <!-- Linked indexing profile number (optional) -->
  <Id>GUID</Id>              <!-- Unique GUID -->
</EForm>
```

### form.io JSON Schema (`FDef`)

The `FDef` field contains a standard form.io form definition. Top-level structure:

```json
{
  "components": [
    { "type": "panel", "title": "Section Title", "key": "...", "components": [...] },
    ...
  ]
}
```

### form.io Component Types Used in Therefore eForms

**Layout Components:**
| Type | Description | Key Properties |
|------|-------------|----------------|
| `panel` | Section container with title | `title`, `collapsible`, `components` |
| `columns` | Multi-column layout (Bootstrap grid) | `columns` (array of column configs) |
| `column` | Single column within columns | `width` (1-12), `offset`, `push`, `pull`, `components` |
| `table` | HTML table layout | `rows`, `numRows`, `numCols` |
| `tabs` | Tabbed sections | `components` (each = one tab) |
| `fieldset` | Grouped fields with border | `legend`, `components` |

**Input Components:**
| Type | Description | Key Properties |
|------|-------------|----------------|
| `textfield` | Single-line text | `inputFormat`, `allowMultipleMasks`, `showWordCount`, `showCharCount` |
| `textarea` | Multi-line text | `rows`, `editor` (plain/quill/ace) |
| `number` | Numeric input | `delimiter`, `requireDecimal`, `decimalLimit` |
| `select` | Dropdown/select | `data.values`, `data.url`, `valueProperty`, `selectValues` |
| `checkbox` | Boolean checkbox | `datagridLabel` |
| `radio` | Radio button group | `values` (array of `{label, value}`) |
| `selectboxes` | Multiple checkboxes | `values` (array of `{label, value}`) |
| `datetime` | Date/time picker | `enableDate`, `enableTime`, `format` |
| `email` | Email with validation | (inherits textfield) |
| `phoneNumber` | Phone with mask | `inputMask` |
| `currency` | Currency input | `currency` (USD, EUR, etc.) |
| `signature` | Signature pad | `width`, `height`, `penColor`, `backgroundColor` |
| `file` | File upload | `storage`, `url`, `filePattern`, `fileMaxSize` |
| `hidden` | Hidden field | `persistent` |

**Data Components:**
| Type | Description |
|------|-------------|
| `datagrid` | Repeatable rows (table input) |
| `editgrid` | Editable grid with modal editing |
| `container` | Groups fields under one key |

**Advanced:**
| Type | Description |
|------|-------------|
| `htmlelement` | Raw HTML content |
| `content` | Rich text content |
| `button` | Submit/action button |

### Common Component Properties

Every component shares these base properties:

```json
{
  "label": "Display Label",
  "key": "uniqueFieldKey",        // data key (used in submission data & indexing profile scripts)
  "type": "textfield",
  "input": true,                   // true = collects data, false = layout only
  "tableView": true,               // show in data table views
  "mask": false,
  "alwaysEnabled": false,
  "encrypted": false,
  "validate": {
    "required": false,
    "customMessage": "",
    "json": "",                    // JSON Logic validation
    "minLength": null,
    "maxLength": null,
    "min": null,
    "max": null,
    "pattern": ""                  // regex pattern
  },
  "conditional": {
    "show": "",                    // true/false/"" — show/hide
    "when": "",                    // key of trigger field
    "eq": "",                      // value to match
    "json": ""                     // JSON Logic condition
  },
  "customConditional": "",         // JavaScript conditional
  "logic": [],                     // advanced logic rules
  "properties": {},                // custom key-value properties
  "attributes": {},                // HTML attributes
  "tags": [],
  "reorder": false
}
```

### Indexing Profile Integration

eForms are linked to **Indexing Profiles** (`<IxProfNo>`) that map form.io field keys to Therefore category index fields. The indexing profile scripts use `Json.GetValue("data.<key>")` to read submitted form values:

```javascript
// Example: Indexing profile script reads form.io field keys
var street = Json.GetValue("data.lieferadresseStrasse");
var city = Json.GetValue("data.lieferadresseOrt");
var address = street + " " + city;
```

The `data.<key>` path matches the `key` property of each form.io component.

### form.io Documentation Resources

- **Components JSON Schema**: https://github.com/formio/formio.js/wiki/Components-JSON-Schema
- **Form JSON Overview**: https://help.form.io/userguide/forms/form-building/form-json
- **Individual Component Wikis**: https://github.com/formio/formio.js/wiki/<ComponentName>-Component (e.g., TextField-Component, Columns-Component)
- **Form Components Reference**: https://help.form.io/userguide/forms/form-building/form-components
- **formio.js GitHub**: https://github.com/formio/formio.js

### Creating New eForms Programmatically

To create a new eForm for Solution Designer import:
1. Build a valid form.io JSON (`components` array)
2. Use existing eForms as style reference (Therefore may not use all form.io features)
3. Wrap in `<EForm>` XML with unique negative `FNo`, `FName`, `Id` (GUID), `FFold`
4. Create a matching `<IxProfile>` if the form should archive to a category
5. Ensure `key` values in form.io components match what the indexing profile script expects via `Json.GetValue("data.<key>")`

---

## Folders & Tree Views

Organizational tree for categories, case definitions, workflows.

| Operation | Description |
|-----------|-------------|
| `GetFolder` / `SaveFolder` / `DeleteFolder` | CRUD |
| `SetParentFolder` | Move folder |
| `GetAllTreeViews` | List tree views |
| `GetTreeViewChildNodes` | Navigate tree |

---

## Retention Policies

- Documents under retention cannot be deleted until period expires
- Based on date field values
- `EraseAllObjects` / `EraseObjects` -- Permanently remove deleted items

---

## Multilingual Support

- Category names, descriptions, field captions can be translated
- `GetCurrentLCID` / `SetCurrentLCID` -- Switch language
- `GetAvailableLCIDs` -- Discover available translations
- LCID: 1033=English US, 1031=German, 1036=French

---

## User Management

| Operation | Description |
|-----------|-------------|
| `GetConnectedUser` | Authenticated user info |
| `ExecuteUsersQuery` | Search users/AD |
| `GetUserDetails` | User/group details |
| `SetUserPassword` / `ResetUserPwd` | Password management |
| `MoveUserLicense` / `SignOut` | License management |

---

## Scripting

Therefore supports **VBScript** and **JavaScript** (both based on the Microsoft scripting engine / Windows Script Host). Scripts can be used in three contexts:

### 1. Workflow Scripts (Task Index Update)
Scripts execute during workflow processing to manipulate index data, perform calculations, or call external systems.

- **Context**: Runs in a workflow task node of type "Script Task" or "Task Index Update"
- **Languages**: VBScript, JavaScript (JScript)
- **Capabilities**: Read/write index data fields, access document properties, call external COM objects, perform calculations, set workflow routing
- **Trigger**: Executes automatically when the workflow reaches the script task node

**Common use cases:**
- Calculate field values from other fields
- Set index data based on business rules
- Call external systems via COM/HTTP
- Validate data and control workflow routing
- Format or transform field values

### 2. Indexing Profile Scripts (Content Connector)
Scripts in indexing profiles automate index data extraction for the **Therefore Content Connector** (automated file import).

- **Context**: Runs during automated document import/indexing
- **Languages**: VBScript, JavaScript (JScript)
- **Capabilities**: Extract and transform metadata from file properties, folder paths, file names, or file content
- **Trigger**: Executes for each document processed by the Content Connector

**Common use cases:**
- Parse file names to extract index values (e.g., invoice number from filename)
- Map folder paths to category fields
- Transform date formats
- Apply business rules during automated import
- Set default values based on source location

### 3. Capture Client Scripts (Indexing Profiles)
Scripts in **Therefore Capture Client** indexing profiles process scanned or imported documents.

- **Context**: Runs during manual or batch scanning/import in the Capture Client
- **Languages**: VBScript, JavaScript (JScript)
- **Capabilities**: Process OCR results, barcode values, and other captured data; manipulate index fields before archiving
- **Trigger**: Executes during the indexing step of the capture workflow

**Common use cases:**
- Post-process OCR-extracted text (cleanup, formatting)
- Validate and correct barcode-extracted values
- Calculate fields from captured data
- Apply conditional logic to set category or index values
- Reformat dates, numbers, or identifiers

### Scripting Engine Notes

- Both VBScript and JavaScript use the **Microsoft Windows Script Host (WSH)** engine
- Scripts have access to COM objects via `CreateObject()` (VBScript) or `new ActiveXObject()` (JavaScript)
- The scripting environment provides Therefore-specific objects for accessing index data, document properties, and workflow state
- Scripts run server-side in workflow context, client-side in Capture Client context
- Error handling is important -- unhandled errors in workflow scripts can cause workflow instance errors

### Reference
- **Online Help**: https://www.therefore.net/help/2025/en-us/AR/ar_workflow_scripting.html
- **Indexing Profile Scripts**: https://www.therefore.net/help/2025/en-us/AR/ar_indexing_profiles.html
- **Local PDF**: "Using Scripts with Indexing Profiles" (available in project files)

---

## System Administration

| Operation | Description |
|-----------|-------------|
| `GetWebAPIServerVersion` | Server version |
| `GetClientDiscoveryInfo` | Connection settings |
| `ClearLocalCache` | Flush WebAPI cache |
| `GetPublicSettingInt/String` | Public settings |
| `RenameObject` | Rename any object |
| `ExecuteStatisticsQuery` | System statistics |
