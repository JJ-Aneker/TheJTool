# Therefore Workflow Designer -- Patterns and API Reference

## Workflow Concepts

### Process
A defined sequence of tasks and transitions that automate document routing. Each process is associated with a category and optionally a case definition. Designed in the Solution Designer's Workflow Designer.

### Instance
A single execution of a process, tied to a specific document. Tracks current position (task), assignment, and history. Identified by `InstanceNo`.

### Token
An execution thread within a workflow instance. Linear workflows have one token. Parallel branches (AND-Split) create additional tokens. `TokenNo = 0` means auto-find.

### Task
A single step in the process -- manual (user action) or automatic (system action). Each task has type, duration, assignment rules, and routing choices.

### Choice & Transition
A **choice** is a routing decision (e.g., "Approve"/"Reject"). A **transition** connects two tasks, defining allowed routing paths.

---

## Node Types

### Manual Task Nodes
| Node | Purpose |
|------|---------|
| **User Task** | Standard task assigned to user/group for review and routing decision |
| **Multi-User Task** | Assigned to multiple users; can require all or first-come |
| **Manager Task** | Auto-assigned to line manager of a specified user |

### Automatic Task Nodes
| Node | Purpose |
|------|---------|
| **Email Notification** | Sends email to specified recipients |
| **Script Task** | Executes server-side script (VBScript or JavaScript, Microsoft WSH engine) |
| **Task Index Update** | Runs a VBScript/JavaScript to read/write index data fields during workflow processing |
| **Category Change** | Moves document to different category with field mapping |
| **REST Call** | HTTP request to external endpoint (GET/POST/PUT/DELETE) |
| **Set Index Data** | Updates document index fields automatically |
| **Create Document** | Creates new document, optionally copying data |
| **Create Case** | Creates new case and optionally links current document |
| **Timer/Wait** | Pauses workflow for duration or until date/time |
| **Conditional** | Routes based on index data conditions (no user interaction) |

### Control Flow Nodes
| Node | Purpose |
|------|---------|
| **Start Node** | Entry point (exactly one per process) |
| **End Node** | Termination point (can have multiple) |
| **AND-Split** | Splits into parallel branches (all execute) |
| **AND-Join** | Merges parallel branches (waits for all) |
| **OR-Split** | Conditional split (only matching branches activate) |
| **OR-Join** | Merges branches (proceeds when any arrives) |

---

## Common Patterns

### 1. Sequential Approval
```
Start -> Reviewer -> Approver -> End
```

### 2. Approval with Rejection Loop
```
Start -> Reviewer --[Approve]--> End
                  --[Reject]--> Submitter -> Reviewer (loop)
```

### 3. Parallel Review
```
Start -> AND-Split -> Reviewer A -> AND-Join -> Final Approver -> End
                   -> Reviewer B ->
                   -> Reviewer C ->
```

### 4. Conditional Routing
```
Start -> Conditional --[Amount > 10000]--> Senior Approver -> End
                     --[Amount <= 10000]--> Junior Approver -> End
```

### 5. Escalation Pattern
```
User Task (Duration: 3 days) --[Overdue]--> Manager Task -> End
                              --[Completed]--> Next Task -> End
```

### 6. Automated Processing Pipeline
```
Start -> OCR/Capture -> Set Index Data -> Category Change -> Email Notification -> End
```

---

## Workflow Web API Operations

### Instance Management
| Operation | Description |
|-----------|-------------|
| `StartWorkflowInstance` | Start new instance. Input: `ProcessNo`, `DocNo`. Returns: `InstanceNo` |
| `GetWorkflowInstance` | Load instance details including checklist, history, next tasks |
| `GetWorkflowProcess` | Load process definition |
| `DeleteWorkflowInstance` | Remove instance |

### Task Completion
| Operation | Description |
|-----------|-------------|
| `FinishCurrentWorkflowTask` | Complete task and route. Required: `InstanceNo`, `NextTaskNo`, `TokenNo` (0=auto). Optional: `NextUserNoList` |
| `SetChecklistItemWorkflow` | Mark checklist item completed |

### Assignment
| Operation | Description |
|-----------|-------------|
| `ClaimWorkflowInstance` | Claim instance assigned to group |
| `DisclaimWorkflowInstance` | Release claimed instance |
| `DelegateWorkflowInstance` | Reassign to different user |

### Querying
| Operation | Description |
|-----------|-------------|
| `ExecuteWorkflowQueryForAll` | Query all instances. Flags: Running(1), Finished(2), All(3), Error(4), Overdue(8) |
| `ExecuteWorkflowQueryForProcess` | Query specific process instances |

### Error Handling
| Operation | Description |
|-----------|-------------|
| `ClearWorkflowInstanceErrors` | Clear errors so instance can retry |

---

## .NET API Examples

```csharp
// Load a process definition
TheWFProcess process = new TheWFProcess();
process.Load(processNo);
TheWFTask startTask = process.GetStartTask();
int[] allTaskNos = process.GetAllTaskNos();

// Load and work with an instance
TheWFInstance instance = new TheWFInstance();
instance.Load(instanceNo);
instance.ClaimInstance();
instance.FinishCurrentTask(nextTaskNo, nextUserNo);

// Delegate
instance.DelegateTo(targetUserNo);

// Document linking
instance.LinkDocToInstance(docNo);
```

## REST API Examples

```bash
# Start workflow
curl -X POST "$BASE/StartWorkflowInstance" \
  -u "user:pass" -H "Content-Type: application/json" \
  -d '{ "DocNo": 456, "ProcessNo": 10 }'

# Get instance details
curl -X POST "$BASE/GetWorkflowInstance" \
  -u "user:pass" -H "Content-Type: application/json" \
  -d '{ "InstanceNo": 100, "TokenNo": 0, "LoadHistory": true }'

# Claim
curl -X POST "$BASE/ClaimWorkflowInstance" \
  -u "user:pass" -H "Content-Type: application/json" \
  -d '{ "InstanceNo": 100, "TokenNo": 0 }'

# Complete and route
curl -X POST "$BASE/FinishCurrentWorkflowTask" \
  -u "user:pass" -H "Content-Type: application/json" \
  -d '{ "InstanceNo": 100, "TokenNo": 0, "NextTaskNo": 5, "NextUserNoList": [42] }'

# Query running instances
curl -X POST "$BASE/ExecuteWorkflowQueryForAll" \
  -u "user:pass" -H "Content-Type: application/json" \
  -d '{ "WorkflowFlags": 1, "MaxRows": 100 }'
```

---

## Workflow Macros

Macros provide runtime context in workflow tasks (Script Tasks, Email Notifications, Set Index Data, etc.).

**In Script Tasks** (JScript/VBScript), macros are accessed as `WF.<MacroName>` properties:
```javascript
var docNo = WF.MainDocNo;         // Document number
var instanceNo = WF.InstanceNo;   // Workflow instance number
```

**In other task types** (Email, Set Index Data, REST Call), macros use `[@MacroName]` syntax:
```
Document: [@MainDocNo], Instance: [@InstanceNo]
```

### Available Macros

| Macro (Script: `WF.xxx`) | Template: `[@xxx]` | Returns |
|---------------------------|---------------------|---------|
| `WF.MainDocNo` | `[@MainDocNo]` | Therefore Document number |
| `WF.InstanceNo` | `[@InstanceNo]` | Workflow instance number |
| `WF.ProcessName` | `[@ProcessName]` | Workflow process name |
| `WF.Server` | `[@Server]` | Therefore Server DNS name |
| `WF.CurrentDate` | `[@CurrentDate]` | Today's date |
| `WF.CurrentDateTime` | `[@CurrentDateTime]` | Today's date and time |
| `WF.ProcessStartDate` | `[@ProcessStartDate]` | Workflow start date |
| `WF.ProcessStartDateTime` | `[@ProcessStartDateTime]` | Workflow start date and time |
| `WF.ProcessDueDate` | `[@ProcessDueDate]` | Process deadline date |
| `WF.ProcessDueDateTime` | `[@ProcessDueDateTime]` | Process deadline with time |
| `WF.TaskStartDate` | `[@TaskStartDate]` | Task start date |
| `WF.TaskStartDateTime` | `[@TaskStartDateTime]` | Task start date and time |
| `WF.TaskDueDate` | `[@TaskDueDate]` | Task deadline date |
| `WF.TaskDueDateTime` | `[@TaskDueDateTime]` | Task deadline with time |
| `WF.TaskNameFrom` | `[@TaskNameFrom]` | Previous task name |
| `WF.TaskNameTo` | `[@TaskNameTo]` | Next task name |
| `WF.InitiatorName` | `[@InitiatorName]` | Username of workflow initiator |
| `WF.InitiatorDispName` | `[@InitiatorDispName]` | Display name of initiator |
| `WF.InitiatorEmail` | `[@InitiatorEmail]` | Email of workflow initiator |
| `WF.AssignedToUserName` | `[@AssignedToUserName]` | Assigned user's username |
| `WF.AssignedToUserDispName` | `[@AssignedToUserDispName]` | Assigned user's display name |
| `WF.UserName` | `[@UserName]` | Acting user's username |
| `WF.UserDisplayName` | `[@UserDisplayName]` | Acting user's display name |
| `WF.UserEmail` | `[@UserEmail]` | Acting user's email |
| `WF.UserDomain` | `[@UserDomain]` | Acting user's domain |
| `WF.PrevTaskUserName` | `[@PrevTaskUserName]` | Previous task user's username |
| `WF.PrevTaskUserDispName` | `[@PrevTaskUserDispName]` | Previous task user's display name |
| `WF.PrevTaskUserEmail` | `[@PrevTaskUserEmail]` | Previous task user's email |
| `WF.PrevTaskUserDomain` | `[@PrevTaskUserDomain]` | Previous task user's domain |
| `WF.AdditionalInfo` | `[@AdditionalInfo]` | Workflow information text box |
| `WF.EformLink` | `[@EformLink]` | Link to associated eForm |
| `WF.WebClientDocLink` | `[@WebClientDocLink]` | URL to document in Web Access |
| `WF.WebClientLink` | `[@WebClientLink]` | URL to workflow in Web Access |
| `WF.WebPortalDocLink` | `[@WebPortalDocLink]` | URL to document in Portal |

### Task Index Update / Indexing Profile Script Context

In **Task Index Update** and **Indexing Profile** scripts, the scripting engine provides built-in objects for reading/writing index data fields. These scripts run server-side (Microsoft WSH engine).

#### Available Objects

| Object | Available In | Purpose |
|--------|-------------|---------|
| `IndexData` | Task Index Update, Indexing Profile | Read/write fields on the target document |
| `SourceIndexData` | Task Index Update (when source doc differs) | Read fields from the source document |

#### SetField / GetField — Field Access

Fields are accessed by their **FieldID** (the name configured in Solution Designer, e.g. "BETRAG", "RECHNR").

**JavaScript:**
```javascript
// Write a field
IndexData.SetField("BETRAG", 1234.56);
IndexData.SetField("STATUS", "Freigegeben");

// Read a field
var betrag = IndexData.GetField("BETRAG");
var rechnr = SourceIndexData.GetField("RECHNR");

// Set the category (by CtgryNo)
IndexData.SetCategory(6);
```

**VBScript:**
```vbscript
' Write a field
SetField "BETRAG", 1234.56
SetField "STATUS", "Freigegeben"

' Read a field
wert = GetField("RECHNR")
wert2 = SourceIndexData.GetField("RECHNUNGDAT")

' Set the category
SetCategory 6
```

#### Field Types
Fields have types defined in Solution Designer. The script engine handles type conversion automatically, but be aware of:
- **String**: Direct string assignment
- **Integer**: Numeric value, no decimals
- **Decimal**: Numeric with decimals (use `.` as separator in scripts)
- **Date**: Use date strings or date objects
- **DateTime**: Date + time
- **Logical**: `true`/`false` or `1`/`0`

Non-data field types (Label, Table, ImageFld, Tab) cannot be accessed via SetField/GetField.

#### DB Schema for Categories and Fields

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `TheCategory` | `CtgryNo`, `Title`, `Id` (GUID) | Category definitions |
| `TheCtgryFields` | `FieldNo`, `CtgryNo` (FK), `FieldID` (script name), `TypeNo` (FK) | Field definitions per category |
| `TheDataType` | `TypeNo`, `Name` | Field type names (1=String, 2=Integer, 3=Date, 4=Label, 5=Decimal, 6=Logical, 7=DateTime) |
| `TheIndexingProfile` | `IndexingProfileNo`, `CtgryNo`, `InitScript`, `ScriptLang` | Indexing profile scripts |
| `TheWFTasks` | `TaskNo`, `ProcessNo`, `Settings` (XML), `ScriptName` | Workflow task definitions |

The `Settings` XML in `TheWFTasks` contains the script in `<InitScript>` tags, wrapped in either:
- `<ixprofile>` (entity-encoded inner XML) for Task Index Update
- `<ixprof>` (plain XML) within `<callrestsequence>` for REST tasks

Category assignment is found via `<FieldNo>` entries in `<Assignment>` blocks within the decoded XML, resolved through `TheCtgryFields`.

#### Direct DB Writes — Important Notes

When modifying script content directly in the database (bypassing the Solution Designer), the **Therefore Server caches** workflow and script definitions in memory. Changes to DB tables will NOT be visible until the cache is cleared.

**Required steps after direct DB writes:**

1. **TheWFTasks.Settings** (workflow scripts): After updating, also set `TheWFProcessVersion.LastModified = GETDATE()` for the corresponding `ProcessNo`/`VersionNo`, then clear cache type `WorkflowProcess` (12).
2. **TheCommonScript.Script** (common scripts): After updating, clear cache type `CommonScriptCache` (28).
3. **TheIndexingProfile.InitScript** (indexing profiles): After updating, the cache may need clearing depending on usage context.

**Cache clearing via DCOM:**
```javascript
var srv = new ActiveXObject("TheApi.TheServer");
srv.Connect(41);
srv.ClearCacheInfo(0, 12, 0, 0);  // WorkflowProcess
srv.ClearCacheInfo(0, 28, 0, 0);  // CommonScriptCache
```

**Cache clearing via Therefore Console App:** Use the built-in cache management to manually clear specific cache types.

**DB write best practices:**
- Use `OPENROWSET(BULK '...', SINGLE_NCLOB)` for large text updates to avoid escaping issues (quotes, `GO` batch separators, sqlcmd variable expansion)
- Use `sp_executesql` with parameters (as Therefore itself does via `sp_prepare`/`sp_execute`) instead of string concatenation
- Always use the `-b` flag with `sqlcmd` so SQL errors are reported (without it, sqlcmd returns exit code 0 even on errors)
- Write SQL input files as UTF-16 LE with BOM for correct Unicode handling

---

### Script Task Context

In a **Script Task**, there is no pre-existing `TheInstance` object. To work with the workflow instance or document via DCOM API, create and load them manually using WF macros:

```javascript
// 1. MANDATORY: Connect to Therefore Server first (before any DCOM access)
var theServer = new ActiveXObject("TheApi.TheServer");
theServer.Connect(41);

// 2. Get context from WF macros
var docNo = WF.MainDocNo;
var instanceNo = WF.InstanceNo;

// 3. Now you can use DCOM objects:

// TheDocument — retrieve and extract streams
// Retrieve(docNo, inbox, theServer) — inbox="" for default temp dir
var doc = new ActiveXObject("TheApi.TheDocument");
doc.Retrieve(docNo, "", theServer);
// ExtractStream(streamNo, dir) — dir="" for system temp folder
// Returns the full file path (incl. original filename)
var filePath = doc.ExtractStream(0, "");
doc.Close();

// TheWFInstance — if you need workflow instance access
var instance = new ActiveXObject("TheApi.TheWFInstance");
instance.Load(instanceNo);
```

**Important:** `TheApi.TheServer` + `Connect(41)` must be called before creating any other Therefore DCOM objects (`Therefore.Document`, `Therefore.WFInstance`, etc.). Without this connection, DCOM calls will fail.

### Script Task Logging

**Never log via the workflow instance.** Use `WScript.Shell.LogEvent()` to write to the Windows Event Log:

```javascript
var shell = new ActiveXObject("WScript.Shell");
var DEBUG_ON = true;

// Event types: 1=Error, 2=Warning, 4=Info
if (DEBUG_ON) shell.LogEvent(4, "MyScript: info message");
shell.LogEvent(2, "MyScript: warning message");
shell.LogEvent(1, "MyScript: error message");
```

Logs appear in **Windows Event Viewer > Windows Logs > Application** (Source: WSH).
Set `DEBUG_ON = false` in production to suppress info-level messages.

### Error Handling Convention

Always use this catch pattern in Script Tasks — log the error, then re-throw as `new Error`:

```javascript
try {
    // ...
} catch (ex) {
    logError("FEHLER: " + ex.message);
    throw new Error("FEHLER: " + ex.message);
}
```

**Important:** Use `ex` as the catch variable. Always `throw new Error(...)` (not `throw ex`) so the workflow engine receives a clean error message.

Ref: https://www.therefore.net/help/2025/en-us/sd_r_workflow_workflowdesign_macros.html

---

## Configuration Details

### Notifications
- `DelegateMailText` -- Sent on delegation
- `NotificationMailText` -- Sent on error
- `OverdueMailText` -- Sent when overdue
- `NotifyOnError` -- Error notification email

### Duration & Escalation
- **Process duration** (`Duration`): Expected total time in days
- **Task duration** (`TheWFTask.Duration`): Max time per task
- **Auto-delete** (`DaysToDeleteInstances`): Cleanup after completion

### Security
- **Process owner** (`IsProcessOwner`): Full control over all instances
- **Claim/Disclaim**: Group-assigned tasks require claiming
- **Delegation control** (`DisabDeleg`): Per-task delegation setting
- **Password verification** (`AskForPwd`): Re-entry for security
- **Dynamic assignment** (`AssignFromFieldNo`): Based on index field value

---

## Workflow DLL Registration

Custom .NET workflow DLLs (implementing `ITheWorkflowAutomaticTask`) must be registered on the Therefore server so they appear in the Solution Designer's "Call DLL" task node.

### Requirements
- .NET Framework 4.8 class library
- `[assembly: ComVisible(true)]` in AssemblyInfo.cs
- Class implementing `Therefore.AddIn.ITheWorkflowAutomaticTask`

### Registration Steps

1. **Register COM assembly** via `regasm` (both x86 and x64):
```powershell
C:\Windows\Microsoft.NET\Framework\v4.0.30319\regasm.exe "MyWorkflow.dll" /codebase /tlb /nologo
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\regasm.exe "MyWorkflow.dll" /codebase /tlb /nologo
```

2. **Create Therefore registry key** so the DLL appears in Solution Designer:
```
HKEY_LOCAL_MACHINE\SOFTWARE\Therefore\WorkflowDlls\<DllName>
```

**Required values:**

| Value Name | Type | Description |
|------------|------|-------------|
| `ClassName` | REG_SZ | Fully qualified class name, e.g. `MyNamespace.Main` |
| `DisplayName` | REG_SZ | Name shown in Solution Designer |
| `Name` | REG_SZ | Internal name (typically same as DisplayName) |

**Important:** On x64 systems, the registry key must be under `HKLM\SOFTWARE\Therefore\WorkflowDlls\`, **NOT** under `HKLM\SOFTWARE\Wow6432Node\Therefore\WorkflowDlls\`.

### PowerShell Example (install)
```powershell
$regPath = 'HKLM:\SOFTWARE\Therefore\WorkflowDlls\MyWorkflow'
New-Item -Path $regPath -Force | Out-Null
Set-ItemProperty -Path $regPath -Name 'ClassName' -Value 'MyNamespace.Main'
Set-ItemProperty -Path $regPath -Name 'DisplayName' -Value 'MyWorkflow'
Set-ItemProperty -Path $regPath -Name 'Name' -Value 'MyWorkflow'
```

### PowerShell Example (uninstall)
```powershell
# Unregister COM
regasm.exe "MyWorkflow.dll" /unregister /nologo
# Remove registry key
Remove-Item -Path 'HKLM:\SOFTWARE\Therefore\WorkflowDlls\MyWorkflow' -Force
```

### Name Length Limitation
If Therefore language is set to **German**, the COM class name has a maximum length of **31 characters**. Workaround: change Therefore language to English or register the DLL manually via registry.

### ITheWorkflowAutomaticTask Interface
```csharp
public class Main : ITheWorkflowAutomaticTask
{
    // Called for each workflow instance reaching the "Call DLL" task
    public void ProcAutomaticInst(int nInstanceNo, int nTokenNo, string bstrTenant, string bstrParams)
    {
        // bstrParams contains XML-serialized settings from ShowSettingsDlg
        var server = new TheServerClass();
        server.Connect(TheClientType.WorkflowDLL);
        var wfInstance = new TheWFInstanceClass();
        wfInstance.Load(server, nInstanceNo);
        // ... process document ...
    }

    // Called when user opens settings in Solution Designer
    public string ShowSettingsDlg(int nObjectID, int nObjectType, string bstrTenant, string bstrParams)
    {
        // Show WinForms settings dialog, return XML-serialized settings
    }
}
```
