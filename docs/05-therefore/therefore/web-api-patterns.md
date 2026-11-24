# Therefore™ Web API — Common Patterns & Examples

> Curl examples for the most common operations. Replace `<server>`, `<user>`, `<pass>`, and `<tenant>`.

## Base URL Convention
```
BASE=https://<server>/theservice/v0001/restun
# For Windows Auth: .../restwin
# For Therefore Online: https://<tenant>.thereforeonline.com/theservice/v0001/restun
```

---

## 1. Authentication

### Get Connection Token
```bash
curl -X POST "$BASE/GetConnectionToken" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{}'
```
Response contains `Token` — use for subsequent requests with `UseToken: 1` header.

### Using Token in Subsequent Requests
```bash
curl -X POST "$BASE/<endpoint>" \
  -u "<user>:<token>" \
  -H "UseToken: 1" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 2. Document CRUD

### Create (Save) a Document
```bash
curl -X POST "$BASE/SaveDocument" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryNo": 123,
    "IndexDataItems": [
      { "TypeNo": 1, "StringVal": "Invoice 2024-001" },
      { "TypeNo": 2, "DateVal": "2024-01-15T00:00:00" }
    ],
    "Streams": [
      {
        "StreamName": "invoice.pdf",
        "StreamData": "<base64-encoded-data>",
        "ConvertTo": 0
      }
    ]
  }'
```

### Get Document Info
```bash
curl -X POST "$BASE/GetDocumentInfo" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "DocNo": 456,
    "VersionNo": 0,
    "WantStreamsInfo": true,
    "WantIndexData": true
  }'
```
`VersionNo: 0` = latest version.

### Download a File Stream
```bash
curl -X GET "$BASE/<tenant>/documents/456/0/streams/0/" \
  -u "<user>:<pass>" \
  -o "downloaded-file.pdf"
```

### Delete a Document
```bash
curl -X POST "$BASE/DeleteDocument" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{ "DocNo": 456 }'
```

### Update Index Data
```bash
curl -X POST "$BASE/UpdateIndexData" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "DocNo": 456,
    "IndexDataItems": [
      { "TypeNo": 1, "StringVal": "Updated Title" }
    ]
  }'
```

---

## 3. Searching / Queries

### Execute Query (Synchronous)
```bash
curl -X POST "$BASE/ExecuteQuery" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryNo": 123,
    "Conditions": [
      {
        "TypeNo": 1,
        "Operator": 1,
        "StringVal": "Invoice*"
      }
    ],
    "MaxRowCount": 50,
    "StartRow": 0
  }'
```

### Get Query Results (for large result sets)
```bash
# Step 1: Start async query
curl -X POST "$BASE/ExecuteQueryAsync" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "CategoryNo": 123,
    "Conditions": []
  }'
# Returns QueryToken

# Step 2: Fetch results page by page
curl -X POST "$BASE/GetQueryResults" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "QueryToken": "<token-from-step-1>",
    "MaxRowCount": 100,
    "StartRow": 0
  }'
```

### Quick Search (Full-Text)
```bash
curl -X POST "$BASE/QuickSearch" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "SearchString": "invoice 2024",
    "MaxRowCount": 25
  }'
```

---

## 4. Check-out / Check-in

### Check Out a Document
```bash
curl -X POST "$BASE/CheckOutDocument" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{ "DocNo": 456 }'
```

### Check In with Updated File
```bash
curl -X POST "$BASE/CheckInDocument" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "DocNo": 456,
    "Comment": "Updated figures",
    "Streams": [
      {
        "StreamNo": 0,
        "StreamName": "invoice-v2.pdf",
        "StreamData": "<base64-encoded-data>"
      }
    ]
  }'
```

### Undo Check-Out
```bash
curl -X POST "$BASE/UndoCheckOutDocument" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{ "DocNo": 456 }'
```

---

## 5. Batch Upload

### Upload Multiple Documents
```bash
# Upload each document individually with SaveDocument
# For high-volume scenarios, use the token pattern to avoid re-authenticating:

TOKEN=$(curl -s -X POST "$BASE/GetConnectionToken" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.Token')

for file in *.pdf; do
  DATA=$(base64 -w0 "$file")
  curl -X POST "$BASE/SaveDocument" \
    -u "<user>:$TOKEN" \
    -H "UseToken: 1" \
    -H "Content-Type: application/json" \
    -d "{
      \"CategoryNo\": 123,
      \"IndexDataItems\": [
        { \"TypeNo\": 1, \"StringVal\": \"$file\" }
      ],
      \"Streams\": [
        { \"StreamName\": \"$file\", \"StreamData\": \"$DATA\" }
      ]
    }"
done
```

---

## 6. Workflow & Tasks

### Get Task List
```bash
curl -X POST "$BASE/GetTaskList" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{ "MaxRowCount": 50 }'
```

### Complete a Task
```bash
curl -X POST "$BASE/CompleteTask" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "TaskNo": 789,
    "DecisionNo": 1,
    "Comment": "Approved"
  }'
```

### Start Workflow Instance
```bash
curl -X POST "$BASE/StartWorkflowInstance" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "WorkflowNo": 10,
    "DocNo": 456
  }'
```

---

## 7. Cases

### Create a Case
```bash
curl -X POST "$BASE/CreateCase" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{
    "CaseDefinitionNo": 5,
    "Title": "Customer Complaint #2024-100",
    "IndexDataItems": [
      { "TypeNo": 1, "StringVal": "High Priority" }
    ]
  }'
```

### Get Case Info
```bash
curl -X POST "$BASE/GetCaseInfo" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{ "CaseNo": 1001 }'
```

---

## 8. Category / Metadata

### Get Category Info
```bash
curl -X POST "$BASE/GetCategoryInfo" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{ "CategoryNo": 123 }'
```

### Get All Categories
```bash
curl -X POST "$BASE/GetAllCategories" \
  -u "<user>:<pass>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Common Operator Values (for Query Conditions)
| Operator | Meaning |
|----------|---------|
| 0 | Equal |
| 1 | Like (wildcard: `*`) |
| 2 | Greater than |
| 3 | Less than |
| 4 | Greater or equal |
| 5 | Less or equal |
| 6 | Not equal |
| 7 | Between |

## ConvertTo Values (for Streams)
| Value | Meaning |
|-------|---------|
| 0 | No conversion |
| 1 | TIFF |
| 2 | PDF |
| 3 | PDF/A |
