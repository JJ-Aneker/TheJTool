# Therefore SDK API Reference (.NET API 3.0)

> Namespace: `Therefore.API`
> The Therefore API 3.0 is a COM/.NET programming interface for integrating Therefore DMS into external applications.

## Core Classes

### TheApplication
Entry-point utility class.

| Method | Description |
|--------|-------------|
| `CaptureArchive` | Sends command to Capture Client to archive current batch |
| `CaptureScan` | Starts Capture Client, scans page/batch, sets index data |
| `GetBase36` | Returns base-36 representation of a document number |
| `GetDocNoFromBase36` | Reads document number from base-36 representation |
| `NavigatorFind` | Starts Navigator and opens a query |

### TheServer
Controls and manages all queries and transactions to/from the Therefore server.

**DCOM/COM connection (JScript/VBScript):** Must be established before any other DCOM object access:
```javascript
var theServer = new ActiveXObject("TheApi.TheServer");
theServer.Connect(41);
// Now TheDocument, TheWFInstance etc. can be used
```
ProgID: `TheApi.TheServer`. The `Connect(41)` call initializes the connection to the local Therefore server.

**Methods:**
| Method | Description |
|--------|-------------|
| `Connect(nServerType)` | Connect to Therefore server. Use `41` for local server. |
| `ClearCacheInfo(nServerNo, nType, nID, nSubObjNo)` | Clears the server cache for the specified object type. `nServerNo=0` for local server. `nType` is a `TheChacheInfoType` enum value. `nID` and `nSubObjNo` are object identifiers (0 for all). |

**TheChacheInfoType Enumeration** (for `ClearCacheInfo` nType parameter):

| Name | Value | Description |
|------|-------|-------------|
| All | 0 | Clear the entire cache |
| License | 1 | Clear the license information |
| Server | 2 | Clear the server cache |
| Category | 3 | Clear the category definitions |
| Media | 4 | Clear the storage media cache |
| FormInfo | 6 | Clear the form info cache |
| StorageGroup | 7 | Clear the storage group cache |
| User | 8 | Clear the user cache |
| QueryTemplate | 9 | Clear the query template information |
| Query | 10 | Clear the query information |
| Folder | 11 | Clear the folder structure |
| WorkflowProcess | 12 | Clear the cached workflow processes |
| WorkflowWorker | 13 | Clear the workflow worker cache |
| DocumentPermission | 14 | Clear the document permission cache |
| View | 15 | Clear the tree view cache |
| UniversalConnectorProfile | 18 | Clear the Universal Connector profiles cache |
| Templates | 19 | Clear the Template documents cache |
| SetupFiles | 20 | Clear the setup files cache |
| CaseDefinitionCache | 21 | Clear the case definitions |
| IndexDataCache | 22 | Clear the index data |
| PowerBIUploadCache | 23 | PowerBI data synchronization cache |
| CaseHeaderCache | 24 | Case header data cache |
| CloudDrivesCache | 25 | Cloud storage cache |
| FulltextIndexCache | 26 | Full-text search indexing cache |
| KeywordsCache | 27 | Keyword dictionary cache |
| CommonScriptCache | 28 | Indexing profile / common script cache |
| WFWaitForDocumentCache | 31 | Workflow task document waiting cache |
| eFormsCache | 32 | Electronic forms cache |
| DashboardCache | 33 | Dashboard display cache |
| RoleCache | 34 | Permission roles cache |

**Cache clearing example (JScript/DCOM):**
```javascript
var srv = new ActiveXObject("TheApi.TheServer");
srv.Connect(41);
// Clear workflow process cache after modifying TheWFTasks.Settings
srv.ClearCacheInfo(0, 12, 0, 0);
// Clear common script cache after modifying TheCommonScript.Script
srv.ClearCacheInfo(0, 28, 0, 0);
```

Ref: https://therefore.net/help/2025/en-us/AR/SDK/API/the_api_theserver_clearcacheinfo.html

---

## Document Classes

### TheDocument
Represents a Therefore compound file containing one or more document streams.

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `FilePath` | string | Complete path to the compound file |
| `IndexData` | TheIndexData | Document metadata (get/set) |
| `StreamCount` | int | Number of streams |
| `ViewerWnd` | handle | Window handle for Viewer |

**Methods:**
| Method | Description |
|--------|-------------|
| `AddStream` / `AddStreamEx` / `AddStreamsEx` | Add file(s) to compound file |
| `Archive` | Archive the document to the server |
| `CheckIn` | Commit updated document changes |
| `CheckOut` | Check out document |
| `Close` | Close the open compound file |
| `Create` | Generate a new compound file |
| `CreateCaseLink` / `CreateDocumentLink` | Link document to case/document |
| `DeleteCaseLink` / `DeleteDocumentLink` | Remove links |
| `Dispose` | Close file and remove from disk |
| `ExtractStream(streamNo, dir)` / `ExtractStreamsEx` | Export stream to disk. `dir`="" for system temp. Returns full file path (incl. original filename). |
| `GetStreamInfo(nStreamNo, out strStreamName, out nFormNo, out nAnnotationPage)` | Gets info on a stream. `strStreamName` = original filename, `nFormNo` = COLD form number (0 if none), `nAnnotationPage` = annotation page index (-1 if none). |
| `GetLinkedObjects` | Return TheLinkedObject collection |
| `GetThumbnail` | Retrieve document thumbnail |
| `Open` | Open a compound document file |
| `Retrieve(docNo, inbox, theServer)` | Retrieve document from server. `inbox`="" for default temp dir. Requires connected `TheServer` object. |
| `UndoCheckOut` | Release lock, discard changes |
| `View` | Launch Viewer |

---

## Index Data Classes

### TheIndexData
Maintains all metadata for a document or case.

**Key Properties:**
| Property | Description |
|----------|-------------|
| `Category` | Category of associated document |
| `CaseDefinition` | Case definition |
| `CaseNo` | Case number |
| `Count` | Number of entries |
| `CtgryNo` | Category number |
| `DocNo` | Document number |
| `LastChangeTime` | Timestamp of last change |
| `Title` | Document title |
| `VersionNo` | Version number |

**Key Methods:**
| Method | Description |
|--------|-------------|
| `GetValueByColName` / `GetValueByFieldNo` / `GetValueByFieldID` | Get field values |
| `SetValueByColName` / `SetValueByFieldNo` / `SetValueByFieldID` | Set field values |
| `SetKeywordByFieldNo` / `SetKeywordByColName` | Set keyword values |
| `GetTableValueByFieldNo` / `SetTableValueByFieldNo` | Table field access |
| `FillDependentFields` / `FillDependentFieldsEx` | Resolve dependent fields |
| `CalculateFields` | Evaluate calculated field formulas |
| `Load` | Load index data from server |
| `SaveChanges` | Persist index data changes |
| `EditIxData` | Open index data editor dialog |

---

## Category Classes

### TheCategory
Category definition loaded from the server.

**Key Properties (34 total):**
| Property | Description |
|----------|-------------|
| `CtgryNo` | Category number |
| `Name` | Category name |
| `FieldCount` | Total number of fields |
| `FolderNo` | Containing folder number |
| `GUID` | Category GUID |
| `IsFullTextEnabled` | Full-text search availability |
| `WorkflowProcessNo` | Triggered workflow process |

**Key Methods:**
| Method | Description |
|--------|-------------|
| `Load` / `LoadForEdit` | Load category definition |
| `GetFieldByColName` / `GetFieldByFieldNo` / `GetFieldByIndex` | Access fields |
| `CreateField` / `DeleteField` / `MoveField` | Modify fields |
| `SaveChanges` / `Unlock` | Persist and release |
| `GetKeywords` / `GetKeywordsSorted` | Get field keywords |

### TheCategoryField
Field within a category definition.

**Properties:**
| Property | Description |
|----------|-------------|
| `FieldNo` / `FieldID` / `ColName` | Identifiers |
| `FieldType` | StringField, IntField, DateField, MoneyField, LogicalField, etc. |
| `Caption` | Display label |
| `Length` / `Scale` | Size configuration |
| `Mandatory` | Required field flag |
| `DefaultVal` | Default value (supports macros) |
| `RegularExpr` | Validation regex |
| `IsSingleKeyword` / `IsMultipleKeyword` | Keyword type |
| `BelongsTo` | Parent for dependent fields |
| `ForeignCol` | Referenced foreign column |
| `Formula` | Calculation formula |
| `Condition` | Conditional formatting |

---

## Query Classes

### TheQuery
Searching within one category.

**Properties:**
| Property | Description |
|----------|-------------|
| `Category` | Category to search |
| `Conditions` | TheConditionList |
| `FullText` | Full text search value |
| `MaxRows` | Maximum results |
| `Mode` | NormalQuery(0), FileQuery(1), WorkflowQuery(4), CaseQuery(5) |

**Methods:**
| Method | Description |
|--------|-------------|
| `Execute` | Synchronous query |
| `ExecuteAsync` | Asynchronous query |
| `GetNextResultRows` | Get next page |
| `ReleaseQuery` | Release server resources |

### TheMultiQuery
Searches across multiple categories.

### TheFullTextQuery
Searches document contents using the indexing service.

### TheQueryResult / TheQueryResultRow
Result table with array of result rows.

---

## Case Classes

### TheCaseDefinition
Structure/configuration of a case type.

### TheCase
Case containing documents. Has `IndexData` member for case metadata.

---

## Workflow Classes

### TheWFProcess
Workflow process definition.

**Key Properties:** `ProcessNo`, `CategoryNo`, `CaseDefinitionNo`, `Name`, `Duration`, `Activated`, `Enabled`, `AllowManualStart`

**Methods:** `Load`, `GetStartTask`, `GetEndTask`, `GetTask`, `GetAllTaskNos`, `GetTransition`, `TransitionExists`

### TheWFInstance
Running workflow instance.

**Key Properties:** `InstanceNo`, `ProcessNo`, `TokenNo`, `CurrTaskNo`, `CurrTaskName`, `AssignedTo`, `Claimed`, `ProcessStartDate`, `ProcessDueDate`

**Methods:** `Load`, `ClaimInstance`, `UnClaimInstance`, `FinishCurrentTask`, `DelegateTo`, `DeleteInstance`, `LinkDocToInstance`, `RemoveDocFromInstance`, `SetChecklistItem`, `SetText`, `SaveInstance`

### TheWFTask
| Property | Description |
|----------|-------------|
| `TaskNo` | Task number |
| `Name` | Task name |
| `Type` | TheWFTaskType |
| `Duration` | Max duration in days |
| `UserChoice` | Requires user selection |
| `ChoiceCount` | Number of routing choices |

---

## Security Classes

| Class | Description |
|-------|-------------|
| `TheUser` | User in Therefore/AD |
| `TheUserList` | Collection of users |
| `TheRole` | Role for permission management |
| `TheRoleAccessMask` | Role-based access mask |

## Utility Classes

| Class | Description |
|-------|-------------|
| `TheKeyword` / `TheKeywordDictionary` | Keyword values and dictionaries |
| `TheLinkedObject` / `TheLinkedObjectList` | Document/case links |
| `TheConversionOptions` | File format conversion |
| `TheReferencedTable` | Foreign table definitions |
| `TheFolder` / `TheFolderItem` | Folder structure |
| `TheReportDefinition` / `TheReportExecution` | Reports |

## Key Enumerations

| Enum | Values |
|------|--------|
| `TheQueryMode` | NormalQuery(0), FileQuery(1), WorkflowQuery(4), CaseQuery(5) |
| `TheCategoryFieldType` | StringField, IntField, DateField, LabelField, MoneyField, LogicalField, NumericCounter, TextCounter, TableField, CustomField |
| `TheObjectType` | Document, Category, Case, Workflow, Folder, etc. |
| `TheWFTaskType` | Workflow task type classifications |

---

## Web API Index Data Types

| API Type | Field Types | Key Property |
|----------|-------------|--------------|
| `StringIndexData` | StringField, TextCounter | `StringVal` |
| `IntIndexData` | IntField, NumericCounter | `IntVal` |
| `DateIndexData` | DateField | `DateVal` (YYYY-MM-DD) |
| `DateTimeIndexData` | DateField with time | `DateTimeVal` (ISO 8601 + Z) |
| `MoneyIndexData` | MoneyField | `MoneyVal` (decimal) |
| `LogicalIndexData` | LogicalField | `LogicalVal` (boolean) |
| `SingleKeywordData` | Single keyword | `KeywordNo` (int) |
| `MultipleKeywordData` | Multiple keywords | `KeywordNoList` (int[]) |
| `TableIndexData` | TableField | `Rows` (array) |

## Web API Authentication

- **User auth (REST):** `https://<server>:<port>/theservice/v0001/restun/<Operation>`
- **Windows auth (REST):** `https://<server>:<port>/theservice/v0001/restwin/<Operation>`
- **Therefore Online:** `https://<tenant>.thereforeonline.com/theservice/v0001/restun/<Operation>`
- **SOAP Action:** `http://schemas.therefore.net/webservices/interop/v0001/messages/IThereforeService/<Operation>`
- **Auth:** HTTP Basic (user/pass) or Windows Integrated
- **API Version:** v0001

## Documentation Links

- **API Overview**: https://www.therefore.net/help/2025/en-us/AR/SDK/API/index.html
- **API Class Reference**: https://www.therefore.net/help/2025/en-us/AR/SDK/API/the_api_reference.html
- **Web API Overview**: https://www.therefore.net/help/2025/en-us/AR/SDK/WebAPI/index.html
- **Web API Reference**: https://www.therefore.net/help/2025/en-us/AR/SDK/WebAPI/the_webapi_reference.html
