# Therefore Reporter — Functionality Analysis

**Date**: 2026-05-19  
**Status**: Current implementation review against expected standalone HTML functionality

---

## Overview

The Therefore Reporter is a module that monitors Therefore™ DMS servers and extracts real-time metrics about documents, cases, users, and workflow instances. It allows users to:

1. **Create Reporter Profiles** — Associate a Therefore server with monitoring configuration
2. **Store Credentials** — Save Therefore server credentials securely in Supabase
3. **Extract Metrics** — Query a Therefore server and retrieve count metrics
4. **View Results** — Display extracted data in a card-based dashboard

---

## Current Architecture

### Component Structure

```
ThereforeReporter.jsx (Main UI)
    ├── Tab 1: "Mis Perfiles" (List of reporter profiles)
    │   └── Table with columns:
    │       ├── Nombre del Perfil
    │       ├── Servidor (Tenant)
    │       ├── URL del Servidor
    │       ├── Descripción
    │       ├── Creado (timestamp)
    │       └── Acciones (View, Edit, Delete)
    │
    └── Tab 2: "Datos Extraídos" (Report output)
        └── Card display showing:
            ├── Profile Name & Server Info
            └── 4 metric cards:
                ├── Documentos (count)
                ├── Casos (count)
                ├── Usuarios (count)
                └── Workflows (count)

thereforeService.js (API Client)
    ├── getConnectionToken() — Authenticate with Therefore server
    ├── getDocumentCount() — ExecuteSimpleQuery → count
    ├── getCaseCount() — ExecuteSingleQuery(Mode=5) → count
    ├── getUserCount() — ExecuteUsersQuery → count
    ├── getWorkflowCount() — ExecuteWorkflowQueryForAll → count
    └── extractReportData() — Parallel execution of all 4 counts

Database Layer
    ├── tenants table
    │   ├── id, nombre, url, tenant, usuario, password, shared
    │   └── RLS: Users see own + shared; admins see all
    │
    └── reporter_profiles table
        ├── id, user_id, tenant_id, nombre, descripcion, timestamps
        └── RLS: Users see only their own profiles
```

---

## Feature Breakdown

### 1. Profile Management

**Create New Profile**
- Button: "Nuevo Perfil"
- Modal form with fields:
  - `nombre` (required) — Profile display name
  - `tenant_id` (required) — Select from available tenants
  - `descripcion` (optional) — Free text notes
- Saves to `reporter_profiles` table
- Linked to current user via `user_id`

**Edit Profile**
- Eye icon action on each row
- Pre-populates form with current values
- Updates only: nombre, tenant_id, descripcion
- Does NOT modify tenant credentials (those are in tenants table)

**Delete Profile**
- Trash icon with confirmation dialog
- Removes row from database
- Removes from UI table

**List Profiles**
- Shows all profiles belonging to current user
- Displays tenant information (joined from tenants table)
- 10 rows per page pagination

---

### 2. Data Extraction

**When User Clicks "View Data" (Eye Icon)**

1. **Preparation**
   - Extract Therefore URL, username, password from linked tenant
   - Format URL: `{url}/theservice/v0001/restun`

2. **API Calls** (executed in parallel)
   ```
   Promise.all([
     getDocumentCount(),      // ExecuteSimpleQuery + count
     getCaseCount(),          // ExecuteSingleQuery(Mode=5) + count
     getUserCount(),          // ExecuteUsersQuery + count
     getWorkflowCount()       // ExecuteWorkflowQueryForAll + count
   ])
   ```

3. **Error Handling**
   - Shows warning banner if extraction fails
   - Still displays report card with zeros
   - User sees: "Error al extraer datos: [message]"
   - Examples: Invalid credentials, server unreachable, permission denied

4. **UI Transition**
   - Switch to "Datos Extraídos" tab automatically
   - Show loading spinner during extraction
   - Display results when complete

---

### 3. Data Persistence

**Two Database Tables**

#### `tenants` Table
```sql
- id (UUID)
- nombre (VARCHAR) — Display name
- url (VARCHAR) — Full server URL
- tenant (VARCHAR) — Therefore tenant ID
- usuario (VARCHAR) — API username
- password (VARCHAR) — API password (encrypted in transit)
- shared (BOOLEAN) — Visible to all users if true
- owner_id (UUID FK) — User who created it
- created_at, updated_at (TIMESTAMPTZ)
```

#### `reporter_profiles` Table
```sql
- id (UUID)
- user_id (UUID FK) — Profile owner
- tenant_id (UUID FK) → tenants(id)
- nombre (VARCHAR) — Profile name
- descripcion (TEXT) — Notes
- created_at, updated_at (TIMESTAMPTZ)
```

**Relationship**
- One tenant can be used by multiple profiles
- One user can have multiple profiles
- Profiles always reference ONE tenant

---

### 4. Authentication & Authorization

**Authentication Layer** (Supabase Auth)
- User logs in with email/password
- Supabase issues JWT token
- App maintains session

**Authorization Layer** (profiles table)
- `useRole()` hook checks `profiles.role`
- Not integrated yet with therefore reporter (no permission checks)
- Could restrict who can access reporter module (future)

**Tenant Visibility** (RLS in tenants table)
- Non-admin users see:
  - Tenants they created (`owner_id = current_user.id`)
  - Tenants marked shared (`shared = true`)
- Admin users see all tenants

**Profile Visibility** (RLS in reporter_profiles table)
- Users see only profiles where `user_id = current_user.id`
- No sharing mechanism yet
- Only owner can edit/delete

---

### 5. Therefore Web API Integration

**API Endpoints Called**

| Endpoint | Purpose | Query Type |
|----------|---------|-----------|
| `GetConnectionToken` | Authenticate, get session token | Auth |
| `ExecuteSimpleQuery` | Count documents in all categories | Query |
| `ExecuteSingleQuery(Mode=5)` | Count cases | Query |
| `ExecuteUsersQuery` | Count active users | Query |
| `ExecuteWorkflowQueryForAll` | Count workflow instances | Query |

**Authentication Method**
- HTTP Basic Auth: `Authorization: Basic base64(usuario:password)`
- Or token-based: Pass `UseToken: 1` header + token as password

**Token Caching**
- Tokens stored per-URL in memory: `this.tokens[url]`
- Reused for subsequent calls within session
- Cleared on logout (optional enhancement)

---

## Current Limitations

1. **Query Capabilities**
   - Count-only queries (no detailed data retrieval)
   - Cannot filter results
   - No field-level data extraction

2. **No Scheduling**
   - Reports extracted on-demand only
   - No automated/scheduled extractions
   - No report history or trends

3. **No Data Export**
   - Cannot export metrics to CSV/PDF
   - No report printing capability

4. **No Custom Queries**
   - Query parameters are hardcoded
   - Cannot build custom query dialects

5. **Limited Permissions**
   - No granular permission system for reporter module
   - No sharing of profiles between users
   - No audit logging of extractions

6. **CORS Considerations**
   - Direct browser → Therefore API calls may fail if CORS not configured
   - Workaround: Backend proxy (not yet implemented)

---

## User Flows

### Flow 1: First Time Setup

```
1. User logs in to app
2. Navigate to "Gestión de Tenants"
3. Click "Nuevo Tenant"
4. Enter Therefore server details:
   - Nombre: "Production Server"
   - URL: "https://buildingcenter.thereforeonline.com"
   - Tenant: "buildingcenter"
   - Usuario: "api_user"
   - Contraseña: "password123"
5. Click Save
6. Navigate to "Therefore Reporter"
7. Click "Nuevo Perfil"
8. Enter:
   - Nombre: "Main Monitoring"
   - Servidor: Select "Production Server" from dropdown
   - Descripción: "Daily production metrics"
9. Click Save → Profile appears in table
```

### Flow 2: Extract Metrics

```
1. User sees profile in "Mis Perfiles" tab
2. Click eye icon on profile row
3. App shows loading spinner
4. App makes 4 parallel API calls to Therefore server
5. Results display in "Datos Extraídos" tab
6. User sees 4 cards with counts:
   - Documentos: 1,254
   - Casos: 89
   - Usuarios: 42
   - Workflows: 156
```

### Flow 3: Edit/Delete Profile

```
Edit:
1. Click pencil icon on profile
2. Modal opens with current values
3. Modify nombre/tenant/descripcion
4. Click OK → updates database

Delete:
1. Click trash icon on profile
2. Confirmation dialog appears
3. Click OK → removes profile
```

---

## UI/UX Details

### Colors & Styling

**Metric Cards**
- Background: Ant Design Card default (dark in dark mode)
- Text: 24px bold number, accent color (primary blue)
- Label: 12px secondary text color
- Grid layout: 4 columns, 20px gap

**Tabs**
- Active tab underlined
- Content area: Flex layout with full height
- Smooth transitions between tabs

**Table**
- Sortable columns: nome, tenant_nombre, tenant_url, descripcion, created_at
- Fixed right column for actions
- Horizontal scroll: 1300px, vertical scroll: viewport-based
- Pagination: 10 rows per page

**Modal**
- Title: "Crear Nuevo Perfil" or "Editar Perfil"
- Width: 600px
- Fields stacked vertically
- OK button shows loading state during save

**Messages**
- Success: "Perfil creado/actualizado/eliminado correctamente"
- Error: Red banner with icon
- Warning: Yellow banner for extraction errors

---

## Error Scenarios

| Scenario | Message | Recovery |
|----------|---------|----------|
| No tenants available | Dropdown empty, cannot select | Create tenant first |
| Invalid credentials | "Credenciales inválidas" | Update tenant credentials |
| Server unreachable | "Error de autenticación: ..." | Check server URL/status |
| No token returned | "No token received from server" | Check Therefore server config |
| Query timeout | Returns 0 for that metric | Retry or check server load |
| User not authenticated | "Usuario no autenticado" | Log in |
| No permission | Hidden from menu (no current check) | Ask admin for access |

---

## Integration Points

### With Existing App

**Menu Integration**
- "Therefore Reporter" appears in sidebar/menu
- May require admin role (pending implementation)
- Links to `/therefore-reporter` route

**Authentication**
- Uses `useAuth()` hook for current user
- Uses `useRole()` hook for admin check
- JWT from Supabase Auth

**Database**
- Reads from `tenants` table (with RLS)
- Reads/writes `reporter_profiles` table (with RLS)
- Supabase client configured in `supabaseClient.js`

**Services**
- Uses `thereforeService.js` for API calls
- Uses `axios` for HTTP requests
- No backend proxy yet (direct browser API calls)

---

## Performance Characteristics

**Loading Profile List**
- Single query with join to tenants table
- Filtering done in app layer (not RLS)
- Time: ~200-500ms typical

**Extracting Metrics**
- 4 parallel API calls
- Total time: ~1-3 seconds (depends on Therefore server response time)
- Loading spinner shown during wait

**Token Caching**
- First call: ~500ms (authenticate + query)
- Subsequent calls: ~200-500ms (use cached token)
- Cache lives for session duration

---

## Testing Checklist

- [ ] Create profile with valid credentials → Metrics extract successfully
- [ ] Create profile with invalid credentials → Shows error message
- [ ] Edit profile name → Updates in table
- [ ] Delete profile → Removed from table
- [ ] User A cannot see User B's profiles → Only own profiles visible
- [ ] Shared tenant appears in User B's tenant dropdown → Permissions working
- [ ] Admin sees all tenants in manager → Admin privileges working
- [ ] Metrics update on tab switch → No stale data
- [ ] Modal closes after save → UX is clean
- [ ] Error message appears on extraction failure → Error handling works

---

## Comparison to Expected Functionality

This document represents the **current implementation** of the Therefore Reporter in TheJTool.

**To validate against the standalone HTML file:**
1. Review HTML file for any additional features not listed here
2. Check if data display format differs (tables vs cards, etc.)
3. Verify query parameters match (Mode values, Query syntax)
4. Confirm error handling matches expected behavior
5. Compare UI layout and flow to existing implementation
6. Identify any missing features or different workflows

---

**Next Steps for Validation**
1. Provide standalone HTML file
2. Map each feature in HTML to corresponding implementation in React
3. Identify gaps or differences
4. Create task list for any new features needed

