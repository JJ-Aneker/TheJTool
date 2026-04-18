# Therefore Glossary

## A

**Access Mask** -- Bitmask integer representing permissions on an object. Each bit = specific permission. Both `AccessMask` (direct) and `RoleAccessMask` (role-based) exist.

**Archive** -- Storing a document into a category. Document receives unique `DocNo`, is assigned to category, index data is stored.

**Auto-Append** -- Mode where new pages/streams are appended to existing document instead of creating new version.

## B

**Base36** -- Compact encoding of DocNo using 0-9 and A-Z. Convert: `TheApplication.GetBase36()` / `GetDocNoFromBase36()`.

**Batch Upload** -- Uploading multiple documents in one session via `StartCreateDocumentBatch`, `UploadDocStreamToBatch`, `SubmitCreateDocumentBatch`.

## C

**Capture Client** -- Application for scanning, importing files, setting index data before archiving.

**Case** -- Container grouping multiple related documents for a business process. Has own index data, lifecycle (open/closed). Identified by `CaseNo`.

**Case Definition** -- Template/schema for a case type. Defines case-level index fields, associated categories, optional workflow. Identified by `CaseDefNo`.

**Category** -- Fundamental document storage structure. Every document belongs to exactly one category. Defines index fields, dialog layout, access rights, optional workflow. Identified by `CtgryNo`/`CategoryNo`.

**Check-In** -- Saving changes to a checked-out document, creating new version.

**Check-Out** -- Locking document for exclusive editing. Released by Check-In or UndoCheckOut.

**Claim** -- Taking ownership of a group-assigned workflow instance.

**ColName** -- Internal database column name for an index field. Stable identifier for API use.

**Compound File** -- Internal format storing a document and its streams (file attachments).

**Connection Token** -- Auth token from `GetConnectionToken`, used with `UseToken: 1` header.

**Conversion Options** -- File format conversion settings: SingleTIFF, SinglePDF, MultipageTIFF, MultipagePDF, SearchablePDF, SearchablePDFA, JPEG.

**Content Connector** -- Therefore service for automated file import from file system, email, or other sources into categories. Supports indexing profiles with scripting (VBScript/JavaScript) for metadata extraction.

**Counter Field** -- Auto-incrementing field. `NumericCounter` (integer). `TextCounter` (format pattern, e.g., "INV-{0:D6}").

## D

**Delegate** -- Reassigning a workflow instance to a different user.

**Dependent Field** -- Field auto-populated from parent field selection via foreign table lookup.

**DocNo** -- Unique numeric identifier for every archived document.

**Document** -- Object consisting of file streams + index data. Belongs to one category.

**Document Stream** -- Single file within a compound document. Identified by `StreamNo` (zero-based).

## E

**eForm** -- Electronic form for data collection. Submissions create documents in categories.

## F

**FieldNo** -- Numeric identifier of an index field within a category.

**FieldType** -- Data type: StringField, IntField, DateField, LabelField, MoneyField, LogicalField, NumericCounter, TextCounter, TableField, CustomField.

**Folder** -- Organizational container in the Therefore tree structure for categories, case definitions, etc.

**Full-Text Search** -- Content indexing enabling search within document text (not just index fields).

## G

**GUID** -- Globally Unique Identifier for categories, fields, processes, tasks. Stable across exports/imports.

## I

**Index Data** -- Metadata (field values) for a document or case. Key-value pairs with typed data.

**Index Field** -- Single metadata field within a category definition. See: TheCategoryField.

**Indexing Profile** -- Configuration automating index data extraction via OCR zones, barcodes, or pattern matching.

## J

**JWT Token** -- JSON Web Token from `GetJWTToken` for token-based auth.

## K

**Keyword** -- Predefined value in a keyword dictionary for controlled data entry.

**Keyword Dictionary** -- Managed list of allowed values. Types: flat list, hierarchical tree, foreign table.

## L

**LCID** -- Locale Identifier. 1033=English US, 1031=German, 1036=French.

## M

**Mandatory Field** -- Index field that must have a value before archiving.

## N

**Navigator** -- Primary Therefore desktop client for browsing, searching, managing documents.

## O

**OCR** -- Optical Character Recognition for text extraction from scanned images.

## P

**Permission** -- Specific right on an object (read, write, delete, check-out, export, print).

**Process (Workflow)** -- See: Workflow Process.

**Process Owner** -- User with full control over all instances of a workflow process.

## Q

**Query** -- Search request against categories. Specifies conditions, sort, grouping, selected fields.

**Query Mode** -- NormalQuery(0)=documents, FileQuery(1)=foreign table, WorkflowQuery(4)=instances, CaseQuery(5)=cases.

## R

**Retention Policy** -- Rules for mandatory document retention periods.

**Role** -- Named set of permissions assigned to users/groups for centralized access management.

## S

**Shared Link** -- Time-limited URL for document access without Therefore credentials.

**Scripting** -- Therefore supports VBScript and JavaScript (Microsoft WSH engine) in three contexts: (1) Workflow scripts (Task Index Update nodes), (2) Indexing Profile scripts for the Content Connector, (3) Capture Client indexing profile scripts. Scripts can access index data, document properties, and COM objects.

**Solution Designer** -- Primary administration tool for configuring the Therefore system.

**Stream** -- See: Document Stream.

## T

**Table Field** -- Field type containing sub-fields in rows (grid/table within index data).

**Task (Standalone)** -- Non-workflow task assigned to users. Managed via `StartTask`, `CompleteTask`.

**Task (Workflow)** -- Step within a workflow process. Manual (user action) or automatic (system).

**Tenant** -- Organizational unit in multi-tenant deployments. Specified via `TenantName` header.

**Therefore Online** -- Cloud-hosted Therefore at `<tenant>.thereforeonline.com`.

**Token (Workflow)** -- Execution thread in workflow. Parallel branches create additional tokens.

**Transition** -- Directed connection between two workflow tasks.

## U

**Undo Check-Out** -- Releasing document lock without saving changes.

## V

**Version** -- Document revision. Each check-in creates new version. `VersionNo = 0` = latest.

**Viewer** -- Document viewing application with annotations, redactions, multi-format support.

## W

**Watermark** -- Image overlay on documents during viewing/printing. Configured per category.

**Web API** -- REST/SOAP service at `/theservice/v0001/restun/` (user auth) or `/restwin/` (Windows auth). ~140+ endpoints.

**Web Client** -- Browser-based Therefore client.

**Workflow** -- Automated process routing documents through tasks based on business rules.

**Workflow Designer** -- Component of Solution Designer for visual workflow design.

**Workflow Flags** -- Filter for queries: DefaultInstances(0), RunningInstances(1), FinishedInstances(2), AllInstances(3), ErrorInstances(4), OverdueInstances(8).

**Workflow Instance** -- Single execution of a process tied to a document. Identified by `InstanceNo`.

**Workflow Process** -- Defined task/transition sequence for automation. Identified by `ProcessNo`.

---

## Numeric Identifiers Quick Reference

| ID | Object | Notes |
|----|--------|-------|
| `DocNo` | Document | Unique document number |
| `VersionNo` | Version | 0 = latest |
| `StreamNo` | Stream | Zero-based index |
| `CtgryNo` / `CategoryNo` | Category | |
| `FieldNo` | Index Field | Within category |
| `FieldID` | Index Field | Unique identifier |
| `CaseNo` | Case | |
| `CaseDefNo` | Case Definition | |
| `ProcessNo` | Workflow Process | |
| `InstanceNo` | Workflow Instance | |
| `TokenNo` | Workflow Token | 0 = auto-find |
| `TaskNo` | Workflow Task | |
| `FolderNo` | Folder | |
| `UserNo` | User | |
