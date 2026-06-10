# Therefore Web API -- Endpoint Reference
> Auto-generated from Swagger (Therefore 2020)

Base Path: `https://<server>:<port>/theservice/v0001/restun`

---

## Tag: Case

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/CloseCase` | Closes the case with given case ID. | body: `CloseCaseParams` (CaseNo required) |
| POST | `/CreateCase` | Creates a new case, defines index data and returns case number. | body: `CreateCaseParams` (CaseDefNo required; IndexDataItems, DoFillDependentFields optional) |
| POST | `/DeleteCase` | Deletes the case with the specified case number. | body: `DeleteCaseParams` (CaseNo required) |
| POST | `/GetCase` | Gets the case with the specified case number. | body: `GetCaseParams` (CaseNo required) |
| POST | `/GetCaseDefinition` | Gets the case definition from the server. | body: `GetCaseDefinitionParams` (CaseDefNo required) |
| POST | `/GetCaseDocuments` | Gets a list of document numbers contained in the case. | body: `GetCaseDocumentsParams` |
| POST | `/GetCaseHistory` | Returns the history of the case. | body: `GetCaseHistoryParams` |
| POST | `/ReopenCase` | Reopens a closed case. | body: `ReopenCaseParams` (CaseNo required) |
| POST | `/SaveCaseIndexData` | Updates the case index data. | body: `SaveCaseIndexDataParams` |
| POST | `/SaveCaseIndexDataQuick` | Updates index data quickly, without LastChangeTime. Cannot update table fields. | body: `SaveCaseIndexDataQuickParams` |

---

## Tag: Category

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/GetCategoriesTree` | Returns tree of the categories. | body: `GetCategoriesTreeParams` |
| POST | `/GetCategoryInfo` | Returns the definition of a Therefore category. | body: `GetCategoryInfoParams` (CategoryNo required) |

---

## Tag: Document

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| GET | `/{tenant}/documents/{docNo}/{versionNo}/streams/{streamNo}/` | Download a file | path: docNo, versionNo (0=latest), streamNo (zero-based), tenant |
| POST | `/AddStreamsToDocument` | Adds file streams to an existing document. | body: `AddStreamsToDocumentParams` |
| POST | `/CheckInDocument` | Checks in the updated document. | body: `CheckInDocumentParams` (DocNo required) |
| POST | `/CheckOutDocument` | Checks out the document. | body: `CheckOutDocumentParams` (DocNo required) |
| POST | `/CreateDocument` | Creates and archives a new document to a category. | body: `CreateDocumentParams` (CategoryNo required) |
| POST | `/CreateLinkFile` | Creates a compound file containing a link to a document. | body: `CreateLinkFileParams` |
| POST | `/DeleteDocument` | Deletes an existing document. | body: `DeleteDocumentParams` (DocNo required) |
| POST | `/FillDependentFields` | Looks up referenced entries and fills dependent fields. | body: `FillDependentFieldsParams` |
| POST | `/GetConvertedDocStreams` | Returns file streams converted into desired format. | body: `GetConvertedDocStreamsParams` |
| POST | `/GetConvertedDocStreamsRaw` | Returns converted file streams as raw stream. | body: `GetConvertedDocStreamsRawParams` |
| POST | `/GetDocument` | Returns the document from the server. | body: `GetDocumentParams` (DocNo required) |
| POST | `/GetDocumentCheckoutStatus` | Returns check-out status of a document. | body: `GetDocumentCheckoutStateParams` (DocNo required) |
| POST | `/GetDocumentHistory` | Returns the history of the specified document. | body: `GetDocumentHistoryParams` (DocNo required) |
| POST | `/GetDocumentIndexData` | Returns index data of an existing document. | body: `GetDocumentIndexDataParams` (DocNo required) |
| POST | `/GetDocumentProperties` | Returns properties of an existing document. | body: `GetDocumentPropertiesParams` (DocNo required) |
| POST | `/GetDocumentStream` | Returns the file stream for any version. | body: `GetDocumentStreamParams` (DocNo, StreamNo required) |
| POST | `/GetDocumentStreamRaw` | Returns file stream as raw stream. | body: `GetDocumentStreamRawParams` (DocNo, StreamNo required) |
| POST | `/GetThumbnail` | Returns the thumbnail of an existing document. | body: `GetThumbnailParams` |
| POST | `/PreprocessIndexData` | Returns index data with defaults, calculated fields. | body: `PreprocessIndexDataParams` |
| POST | `/PreprocessTableRow` | Returns index data for a table row with defaults. | body: `PreprocessTableRowParams` (TableFieldNo required) |
| POST | `/SaveDocumentIndexData` | Updates index data of an existing document. | body: `SaveDocumentIndexDataParams` |
| POST | `/SaveDocumentIndexDataQuick` | Updates index data quickly, without LastChangeTime. | body: `SaveDocumentIndexDataQuickParams` |
| POST | `/StartCreateDocumentBatch` | Starts batch operation to create a document. | body: `StartCreateDocumentBatchParams` |
| POST | `/StartUpdateDocumentBatch` | Starts batch operation to update a document. | body: `StartUpdateDocumentBatchParams` |
| POST | `/SubmitCreateDocumentBatch` | Submits batch create operation. | body: `SubmitCreateDocumentBatchParams` |
| POST | `/SubmitUpdateDocumentBatch` | Submits batch update operation. | body: `SubmitUpdateDocumentBatchParams` |
| POST | `/TestCheckOutDocument` | Tests if check out is possible. | body: `TestCheckOutDocumentParams` |
| POST | `/UndoCheckOutDocument` | Frees locked document, changes are lost. | body: `UndoCheckOutDocumentParams` |
| POST | `/UpdateDocument` | Updates an existing document. | body: `UpdateDocumentParams` |
| POST | `/UploadDocStreamToBatch` | Uploads a file for a batch operation. | body: `UploadDocStreamToBatchParams` |

---

## Tag: EForms

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/CopyEForm` | Copies an eForm and all related child objects. | body: `CopyEFormParams` (SourceFormNo, NewFormName required) |
| POST | `/DeleteEForm` | Deletes an EForm. | body: `DeleteEFormParams` |
| POST | `/DeleteEFormDraftSubmission` | Deletes an eForm draft. | body: `DeleteEFormDraftSubmissionParams` |
| POST | `/GetEForm` | Loads an EForm. | body: `GetEFormParams` |
| GET | `/GetUploadedEFormFile/{sTenant}/{sFileId}` | Gets a previously saved eForm attachment. | path: sTenant, sFileId |
| POST | `/SaveEForm` | Saves or updates an EForm. | body: `SaveEFormParams` |
| POST | `/SaveEFormDefaultSubmission` | Saves default submission data. | body: `SaveEFormDefaultSubmissionParams` |
| POST | `/SaveEFormDraft` | Saves an eForm draft. | body: `SaveEFormDraftParams` |
| POST | `/SearchEFormSubmission` | Searches saved eForm submissions. | body: `SearchEFormSubmissionParams` |
| POST | `/SubmitEForm` | Submits an EForm. | body: `SubmitEFormParams` |
| POST | `/UploadEFormFile` | Uploads a file as eForm attachment. | body: stream (binary) |
| POST | `/VerifyReCaptchaToken` | Verifies a ReCaptcha token. | body: `VerifyReCaptchaParams` |

---

## Tag: Folder

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/DeleteFolder` | Deletes a folder. | body: `DeleteFolderParams` |
| POST | `/GetFolder` | Loads folder information. | body: `GetFolderParams` |
| POST | `/SaveFolder` | Saves a new folder. | body: `SaveFolderParams` |
| POST | `/SetParentFolder` | Moves a folder to another parent. | body: `SetParentFolderParams` |

---

## Tag: Keyword

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/AddDictionaryKeyword` | Adds a new keyword to a dictionary. | body: `AddDictionaryKeywordParams` |
| POST | `/DeleteDictionaryKeyword` | Deletes a keyword from a dictionary. | body: `DeleteDictionaryKeywordParams` |
| POST | `/GetDictionaryInfo` | Gets dictionary information. | body: `GetDictionaryInfoParams` |
| POST | `/GetKeywordsByFieldNo` | Gets keywords for an index data field. | body: `GetKeywordsByFieldNoParams` |
| POST | `/GetKeywordsByKeyDic` | Gets keywords by keyword dictionary. | body: `GetKeywordsByKeyDicParams` |
| POST | `/UpdateDictionaryKeyword` | Updates keyword name and/or status. | body: `UpdateDictionaryKeywordParams` |
| POST | `/ValidateKeywords` | Validates keywords for a field. | body: `ValidateKeywordsParams` |

---

## Tag: Link

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/GetLinkedObjects` | Gets list of objects linked to a given object. | body: `GetLinkedObjectsParams` |
| POST | `/GetLinkedWorkflowsForDoc` | Gets workflows for a given document. | body: `GetLinkedWorkflowsForDocParams` |
| POST | `/LinkCases` | Creates a link between two cases. | body: `LinkCasesParams` (CaseNoA, CaseNoB required) |
| POST | `/LinkDocAndWFInstance` | Links a document and a workflow instance. | body: `LinkDocAndWFInstanceParams` |
| POST | `/LinkDocuments` | Creates a link between two documents. | body: `LinkDocumentsParams` (DocNoA, DocNoB required) |
| POST | `/UnlinkCases` | Removes the link between two cases. | body: `UnlinkCasesParams` |
| POST | `/UnlinkDocAndWFInstance` | Removes document link from workflow instance. | body: `UnlinkDocAndWFInstanceParams` |
| POST | `/UnlinkDocuments` | Removes the link between two documents. | body: `UnlinkDocumentsParams` |

---

## Tag: Other

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/ClearLocalCache` | Clears the local WebAPI cache. | body: `ClearLocalCacheParams` |
| POST | `/EraseAllObjects` | Erases deleted documents and cases. | body: `EraseAllObjectsParams` |
| POST | `/EraseObjects` | Erases specified objects. | body: `EraseObjectsParams` |
| POST | `/GetAllTreeViews` | Gets tree view items for specific permissions. | body: `GetAllTreeViewsParams` |
| POST | `/GetClientDiscoveryInfo` | Loads discovery/connection info from server. | body: `GetClientDiscoveryInfoParams` |
| POST | `/GetConnectionToken` | Returns connection token for credentials. | body: `GetConnectionTokenParams` |
| POST | `/GetConnectionTokenFromADFSToken` | Returns token for provided ADFS token. | body: `GetConnectionTokenFromADFSTokenParams` |
| POST | `/GetDomainInfo` | Gets default domain and valid domain names. | body: `GetDomainInfoParams` |
| POST | `/GetJWTTokenParams` | Returns JWT for credentials. | body: `GetJWTTokenParams` |
| POST | `/GetObjectRights` | Gets permissions of a specified object. | body: `GetObjectRightsParams` |
| POST | `/GetObjects` | Gets a list of objects from the server. | body: `GetObjectsParams` |
| POST | `/GetPermissionConstants` | DEPRECATED: Gets permission constants. | body: `GetPermissionConstantsParams` |
| POST | `/GetPermissions` | DEPRECATED: Gets user permissions on object. | body: `GetPermissionsParams` |
| POST | `/GetPublicSettingInt` | Gets integer public setting by key. | body: `GetPublicSettingIntParams` |
| POST | `/GetPublicSettingString` | Gets string public setting by key. | body: `GetPublicSettingStringParams` |
| POST | `/GetReferencedTableInfo` | Gets table info for querying. | body: `GetReferencedTableInfoParams` |
| POST | `/GetRolePermissionConstants` | Gets role-based permission constants. | body: `GetRolePermissionConstantsParams` |
| POST | `/GetRolePermissions` | Gets role-based permissions on object. | body: `GetRolePermissionsParams` |
| POST | `/GetSettingInt` | Gets integer setting by key. | body: `GetSettingIntParams` |
| POST | `/GetSettingString` | Gets string setting by key. | body: `GetSettingStringParams` |
| GET | `/GetSystemCustomerId` | Gets customer ID of connected system. | (none) |
| POST | `/GetTreeViewChildNodes` | Gets child nodes of a tree view. | body: `GetTreeViewChildNodesParams` |
| POST | `/GetTreeViewChildNodesAndDocuments` | Gets child nodes and documents. | body: `GetTreeViewChildNodesAndDocumentsParams` |
| POST | `/GetTreeViewNodeDocuments` | Gets document nodes of a tree view. | body: `GetTreeViewNodeDocumentsParams` |
| POST | `/GetWebAPIServerVersion` | Gets Therefore Web API server version. | body: `GetWebAPIServerVersionParams` |
| POST | `/HandleESignaturePushNotification` | Handles eSignature push notification. | body: `HandleESignaturePushParams` |
| POST | `/HasPermissions` | Checks if user has permissions for object. | body: `HasPermissionsParams` |
| POST | `/HasRolePermission` | Checks role permission for object. | body: `HasRolePermissionParams` |
| POST | `/QueryDependentFieldsDirect` | Searches a Therefore database table. | body: `QueryDependentFieldsDirectParams` |
| POST | `/RenameObject` | Renames an object. | body: `RenameObjectParams` |
| POST | `/SetUserPassword` | Sets user's password. | body: `SetUserPasswordParams` |
| POST | `/UploadSessionAppendChunkRaw` | Uploads chunked data for upload session. | body: stream (binary) |
| POST | `/UploadSessionStart` | Starts a chunk upload session. | body: `UploadSessionStartParams` |

---

## Tag: Reporting

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/ExecuteReport` | Executes a report with parameters. | body: `ExecuteReportParams` |
| POST | `/GetReportDefinition` | Gets report definition by number. | body: `GetReportDefinitionParams` |

---

## Tag: Searching

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/ExecuteAsyncFullTextQuery` | Starts async full text query. | body: `ExecuteAsyncFullTextQueryParams` |
| POST | `/ExecuteAsyncMultiQuery` | Starts async multi query across categories. | body: `ExecuteAsyncMultiQueryParams` |
| POST | `/ExecuteAsyncSingleQuery` | Starts async single query. | body: `ExecuteAsyncSingleQueryParams` |
| POST | `/ExecuteDependentFieldsQuery` | Executes dependent field query. | body: `ExecuteDependentFieldsQueryParams` |
| POST | `/ExecuteFullTextQuery` | Searches document contents. | body: `ExecuteFullTextQueryParams` |
| POST | `/ExecuteMultiQuery` | Executes queries in multiple categories. | body: `ExecuteMultiQueryParams` |
| POST | `/ExecuteSimpleQuery` | Executes simple query. | body: `ExecuteSimpleQueryParams` |
| POST | `/ExecuteSingleQuery` | Executes single query. Mode: NormalQuery(0), CaseQuery(5). | body: `ExecuteSingleQueryParams` |
| POST | `/GetNextFullTextQueryRows` | Gets next rows from async full text query. | body: `GetNextFullTextQueryRowsParams` |
| POST | `/GetNextMultiQueryRows` | Gets next rows from async multi query. | body: `GetNextMultiQueryRowsParams` |
| POST | `/GetNextSingleQueryRows` | Gets next rows from async single query. | body: `GetNextSingleQueryRowsParams` |
| POST | `/GetQuerySpecification` | Returns valid operators, operands, formats. | body: `QuerySpecificationParams` |
| POST | `/ReleaseFullTextQuery` | Releases full text query resources. | body: `ReleaseFullTextQueryParams` (QueryID required) |
| POST | `/ReleaseMultiQuery` | Releases multi query resources. | body: `ReleaseMultiQueryParams` (QueryID required) |
| POST | `/ReleaseSingleQuery` | Releases single query resources. | body: `ReleaseSingleQueryParams` (QueryID required) |

---

## Tag: Task

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/CompleteTask` | Completes the task. | body: `CompleteTaskParams` (TaskNo, TaskDecision required) |
| POST | `/DeleteTask` | Deletes the task. | body: `DeleteTaskParams` |
| POST | `/ExecuteTaskInfoQuery` | Executes a task info query. | body: `ExecuteTaskInfoQueryParams` |
| POST | `/GetTask` | Gets Task details by task number. | body: `GetTaskParams` |
| POST | `/GetTaskInfo` | Gets TaskInfo details by task number. | body: `GetTaskInfoParams` |
| POST | `/SetTaskStatus` | Changes the status of the task. | body: `SetTaskStatusParams` |
| POST | `/StartTask` | Starts a new task. | body: `StartTaskParams` |
| POST | `/UpdateTask` | Saves changes to the Task. | body: `UpdateTaskParams` |
| POST | `/UpdateTaskComment` | Sets the comment of the task. | body: `UpdateTaskCommentParams` |

---

## Tag: User

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/ExecuteUsersQuery` | Searches for users in Therefore and/or AD. | body: `ExecuteUsersQueryParams` |
| POST | `/GetConnectedUser` | Returns info about the connected user. | body: `GetConnectedUserParams` |
| POST | `/GetUserDetails` | Returns details about user or group. | body: `GetUserDetailsParams` |
| POST | `/MoveUserLicense` | Moves license from another node. | body: `MoveUserLicenseRequest` |
| POST | `/ResetUserPwd` | Resets the password and notifies by email. | body: `ResetUserPwdParams` |
| POST | `/SignOut` | Releases license on current node. | body: `SignOutRequest` |

---

## Tag: WebClient

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/DeleteDashboard` | Deletes a Dashboard. | body: `DeleteDashboardParams` |
| POST | `/DeleteUserDashboards` | Deletes user-specific dashboard config. | body: `DeleteUserDashboardsParams` |
| POST | `/DeleteUserFavorites` | Deletes user-specific favorites. | body: `DeleteUserFavoritesParams` |
| POST | `/ExecuteStatisticsQuery` | Executes statistics query. | body: `ExecuteStatisticsQueryParams` |
| POST | `/GetDashboard` | Loads a Dashboard. | body: `GetDashboardParams` (DashboardNo required) |
| POST | `/GetFieldsSaveUsageOrder` | Gets field order for saving. | body: `GetFieldsSaveUsageOrderParams` |
| POST | `/GetFieldsSearchUsageOrder` | Gets field order for searching. | body: `GetFieldsSearchUsageOrderParams` |
| POST | `/GetUserDashboards` | Loads user-specific dashboard config. | body: `GetUserDashboardsParams` |
| POST | `/GetUserFavorites` | Loads user-specific favorites. | body: `GetUserFavoritesParams` |
| POST | `/GetViewingPageCount` | Gets page count for viewing. | body: `GetViewingPageCountParams` |
| POST | `/GetViewingPages` | Gets pages for viewing. | body: `GetViewingPagesParams` |
| POST | `/GetViewingThumbnails` | Gets thumbnails for streams. | body: `GetViewingThumbnailsParams` |
| POST | `/PrepareViewing` | Prepares viewing/conversion to HTML5. | body: `PrepareViewingParams` |
| POST | `/SaveDashboard` | Saves or updates a Dashboard. | body: `SaveDashboardParams` |
| POST | `/SaveUserDashboards` | Saves user-specific dashboard config. | body: `SaveUserDashboardsParams` |
| POST | `/SaveUserFavorites` | Saves user-specific favorites. | body: `SaveUserFavoritesParams` |

---

## Tag: Workflow

| Method | Path | Summary | Parameters |
|--------|------|---------|------------|
| POST | `/ClaimWorkflowInstance` | Claims the workflow instance. | body: `ClaimWorkflowInstanceParams` (InstanceNo, TokenNo required) |
| POST | `/ClearWorkflowInstanceErrors` | Clears errors of workflow instances. | body: `ClearWorkflowInstanceErrorsParams` |
| POST | `/DelegateWorkflowInstance` | Delegates to specified user. | body: `DelegateWorkflowInstanceParams` |
| POST | `/DeleteWorkflowInstance` | Deletes the workflow instance. | body: `DeleteWorkflowInstanceParams` |
| POST | `/DisclaimWorkflowInstance` | Disclaims workflow instance. | body: `DisclaimWorkflowInstanceParams` |
| POST | `/ExecuteWorkflowQueryForAll` | Queries all active processes. | body: `ExecuteWorkflowQueryForAllParams` |
| POST | `/ExecuteWorkflowQueryForProcess` | Queries for a given process. | body: `ExecuteWorkflowQueryForProcessParams` |
| POST | `/FinishCurrentWorkflowTask` | Finishes current task, routes to next. | body: `FinishCurrentWorkflowTaskParams` |
| POST | `/GetWorkflowInstance` | Gets workflow instance by number. | body: `GetWorkflowInstanceParams` |
| POST | `/GetWorkflowProcess` | Gets workflow process by number. | body: `GetWorkflowProcessParams` |
| POST | `/SetChecklistItemWorkflow` | Sets checklist item status. | body: `SetChecklistItemWorkflowParams` |
| POST | `/SetTextInfoWorkflow` | Sets free text information. | body: `SetTextInfoWorkflowParams` |
| POST | `/StartWorkflowInstance` | Starts a workflow instance. | body: `StartWorkflowInstanceParams` |

---

## Data Models — Index Data

| Model | Description |
|-------|-------------|
| `WSIndexDataDate` | Date field. Properties: DataISO8601Value (YYYY-MM-DD), FieldNo (required) |
| `WSIndexDataDateTime` | DateTime field. Properties: DataISO8601Value (ISO 8601 UTC), FieldNo (required) |
| `WSIndexDataInt` | Integer field. Properties: DataValue (int), FieldNo (required) |
| `WSIndexDataLogical` | Boolean field. Properties: DataValue (bool), FieldNo (required) |
| `WSIndexDataMoney` | Money/decimal field. Properties: DecimalDataValue (decimal), FieldNo (required) |
| `WSIndexDataMultipleKeyword` | Multiple keyword field. Properties: DataValue (string[]), FieldNo (required) |
| `WSIndexDataSingleKeyword` | Single keyword field. Properties: DataValue (string), FieldNo (required) |
| `WSIndexDataString` | String field. Properties: DataValue (string), FieldNo (required) |
| `WSIndexDataTable` | Table field. Properties: DataValue (WSTableFieldDataRow[]), FieldNo (required) |
| `WSTableFieldDataRow` | Table row. Properties: RowNo (int, null=new), DataRowItems |
| `WSTableFieldDataRowItem` | Table cell. Contains one of the index data types |
| `WSIndexDataItem` | Polymorphic wrapper containing one index data type |
| `WSIndexDataToPut` | Index data to send. Properties: LastChangeTime (required), IndexDataItems, DoFillDependentFields |
| `WSIndexDataToGet` | Index data returned. Properties: CategoryNo, DocNo, VersionNo, IndexDataItems, Title |
| `WSIndexDataToPutQuick` | Quick update (no table support). Properties: IndexDataItems |

## Data Models — Core Entities

| Model | Description |
|-------|-------------|
| `WSCase` | CaseNo, CaseDefinitionNo, IndexData, IsClosed, AccessMask, RoleAccessMask |
| `WSCaseDefinition` | CaseDefNo, Name, GUID, Categories, Fields, WorkflowProcessNo |
| `WSCategory` | CategoryNo, Name, Title, GUID, ParentFolderNo |
| `WSCategoryField` | FieldNo, ColName, Caption, FieldType (String=1, Int=2, Date=3, Label=4, Money=5, Logical=6, NumericCounter=8, TextCounter=9, Table=10, Custom=99), Mandatory, Visible, DefaultVal, RegularExpr, IsSingleKeyword, IsMultipleKeyword |
| `WSCheckOutStatus` | Checkout status of a document |
| `WSConversionOptions` | Document conversion options |
| `WSDocumentProperties` | Document attribute metadata |
| `WSStreamInfo` | File stream metadata |
| `WSStreamInfoWithData` | Stream metadata with binary data |
| `WSUser` | User information |
| `WSKeywordDictionary` | Keyword dictionary info |

## Data Models — Workflow

| Model | Description |
|-------|-------------|
| `WSWFInstance` | InstanceNo, ProcessNo, CurrTaskNo, AssignedTo, Claimed, TokenNo |
| `WSWFProcess` | ProcessNo, Name, CategoryNo, Activated, Enabled, AllowManualStart, Duration |
| `WSWFTask` | TaskNo, Name, Type, Duration, UserChoice, AllowMultiSelection |
| `WSWFTransition` | NextTaskNo, IsDefault, IsValid, ActionText, Description |
| `WSWFChecklistItem` | Workflow checklist item |
| `WSWFHistoryEntry` | Workflow history entry |
| `WSWorkflowQueryResult` | ProcessNo, ProcessName, ResultRows, Columns |
| `WSWorkflowResultRow` | WorkflowNo, InstanceNo, TokenNo, IndexValues, Status |

## Data Models — Query Results

| Model | Description |
|-------|-------------|
| `WSQueryResult` | ResultRows, ProcessNo, CategoryNo, CaseDefinitionNo, Columns |
| `WSQueryResultRow` | DocNo, VersionNo, IndexValues, Status (CheckedIn=0, CheckedOutByUser=1, CheckedOut=2, CaseNormal=10, CaseClosed=11), AccessMask |
| `WSValidOperators` | Valid query operators |

## Data Models — Permissions

| Model | Description |
|-------|-------------|
| `WSAccessMask` | Permission access mask (uint64) |
| `WSRoleAccessMask` | Role-based permission access mask (uint64) |
| `WSPermissionConstants` | Legacy permission constants (Operator, Administrator, Access, CategoryArchive, DocView, DocEdit, DocDelete, etc.) |
| `WSRolePermissionConstants` | Role permission constants (Operator, Administrator, Access, CategoryArchive, DocumentViewInHitList, DocumentViewDocument, DocumentPrint, DocumentExport, etc.) |

## Key Message Models — Request Parameters

| Model | Key Properties |
|-------|----------------|
| `CreateDocumentParams` | CategoryNo (required), IndexDataItems, StreamsToUpload, ConversionOptions |
| `GetDocumentParams` | DocNo (required), VersionNo, IsStreamsInfoNeeded, IsIndexDataValuesNeeded |
| `UpdateDocumentParams` | DocNo (required), StreamsToUpload, IndexData |
| `ExecuteSingleQueryParams` | Query (required), Mode (0=NormalQuery, 5=CaseQuery) |
| `ExecuteFullTextQueryParams` | SearchString, CategoryNos, MaxRows |
| `StartWorkflowInstanceParams` | ProcessNo (required), DocNo |
| `FinishCurrentWorkflowTaskParams` | InstanceNo (required), TokenNo (required), NextTaskNo, Comment |
| `CreateCaseParams` | CaseDefNo (required), IndexDataItems, DoFillDependentFields |
| `CompleteTaskParams` | TaskNo (required), TaskDecision (Undefined=0, Positive=1, Negative=2) |
| `GetConnectionTokenParams` | (uses HTTP Basic credentials) |
| `GetConnectionTokenFromADFSTokenParams` | SecurityToken (required) |

## Key Message Models — Responses

| Model | Key Properties |
|-------|----------------|
| `CreateDocumentResponse` | DocNo (int), LastChangeTime |
| `GetDocumentResponse` | DocNo, IndexData, StreamsInfo, CheckOutStatus, AccessMask |
| `CheckOutDocumentResponse` | CurrentVersionNumber, CheckOutSucceeded, SomebodyElseName |
| `ClaimWorkflowInstanceResponse` | IsAlreadyClaimed, ClaimedByUserName |
| `CreateCaseResponse` | CaseNo, LastChangeTime |
| `GetConnectionTokenResponse` | Token (string) |
| `ExecuteSingleQueryResponse` | QueryResult (WSQueryResult) |
| `ExecuteAsyncSingleQueryResponse` | QueryID (int) |
| `StartWorkflowInstanceResponse` | InstanceNo |
| `GetWorkflowInstanceResponse` | Instance, HistoryEntries, ChecklistItems, NextTasks |
| `GetCategoryInfoResponse` | Fields, AccessMask, RoleAccessMask, FullTextMode |
