# Therefore Reporter — Setup Guide

## Overview

The Therefore Reporter module allows users to:
- Create profiles for monitoring Therefore servers
- Extract real-time metrics (documents, cases, users, workflows)
- Track server health and usage

## Prerequisites

- Supabase project configured
- Therefore servers with Web API enabled
- Valid credentials for Therefore servers

## Step 1: Create Tables in Supabase

Execute these SQL scripts in **Supabase SQL Editor** in order:

### 1.1 Create `tenants` table

Copy the contents of `SUPABASE_TENANTS_TABLE.sql` into Supabase SQL Editor and execute.

**This creates:**
- `tenants` table with fields: id, nombre, url, tenant, usuario, password, shared, owner_id, created_at, updated_at
- RLS policies to control access:
  - Users see their own tenants + shared tenants
  - Admins see all tenants
  - Only owners or admins can edit/delete

### 1.2 Create `reporter_profiles` table

Copy the contents of `SUPABASE_REPORTER_PROFILES_TABLE.sql` into Supabase SQL Editor and execute.

**This creates:**
- `reporter_profiles` table linking users to tenants
- Fields: id, user_id, tenant_id, nombre, descripcion, created_at, updated_at
- RLS policies:
  - Users see only their own profiles
  - Users can create/edit/delete only their own

## Step 2: Configure Therefore Servers

For each Therefore server you want to monitor, prepare:

1. **Server URL**: e.g., `https://buildingcenter.thereforeonline.com`
2. **Tenant ID**: e.g., `buildingcenter`
3. **API User**: A user account with query permissions
4. **API Password**: User's password

## Step 3: Use in Application

### Create a Tenant

1. Go to **Gestión de Tenants** module
2. Click **Nuevo Tenant**
3. Fill in:
   - Nombre: Display name for the server
   - URL: Full server URL
   - Tenant ID: Therefore tenant identifier
   - Usuario: API user
   - Contraseña: API password
   - Compartir: Toggle to make visible to other users (optional)
4. Save

### Create a Reporter Profile

1. Go to **Therefore Reporter** module
2. Click **Nuevo Perfil**
3. Fill in:
   - Nombre del Perfil: Name for this profile (e.g., "Production Monitoring")
   - Servidor (Tenant): Select from list
   - Descripción: Optional notes
4. Save

### View Extracted Data

1. Select a profile from the table
2. Click eye icon (👁️)
3. App extracts and displays:
   - **Documentos**: Document count
   - **Casos**: Case count
   - **Usuarios**: User count
   - **Workflows**: Workflow instance count

## Step 4: Troubleshooting

### Error: "Table reporter_profiles does not exist"

- Execute `SUPABASE_REPORTER_PROFILES_TABLE.sql` in Supabase SQL Editor

### Error: "Credenciales inválidas"

- Verify the API user has:
  - Query permissions (ExecuteSingleQuery, ExecuteSimpleQuery)
  - User query permissions (ExecuteUsersQuery)
  - Workflow query permissions (ExecuteWorkflowQueryForAll)
- Test credentials manually with curl:
  ```bash
  curl -X POST "https://buildingcenter.thereforeonline.com/theservice/v0001/restun/GetConnectionToken" \
    -u "admin@empresa.com:password" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

### Error: "Permission denied"

1. Check RLS policies are enabled in Supabase:
   - Go to table → **RLS** tab
   - Confirm policies show green checkmarks ✓

2. Verify you're logged in with the account that owns the profile

3. For shared tenants, ensure `shared = true` in the tenants table

### Data shows as 0

- The API user may lack query permissions in Therefore
- Check Therefore user role has "Query" permissions
- Some endpoints may require additional Therefore licensing

## Architecture

```
ThereforeReporter.jsx (UI)
    ↓
thereforeService.js (API calls)
    ↓
Therefore Web API (https://.../theservice/v0001/restun)
    ↓
Therefore Server (documents, cases, users, workflows)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/views/ThereforeReporter.jsx` | Main UI component |
| `src/views/TenantManager.jsx` | Tenant CRUD management |
| `src/services/thereforeService.js` | Therefore API client |
| `SUPABASE_TENANTS_TABLE.sql` | Tenant table schema + RLS |
| `SUPABASE_REPORTER_PROFILES_TABLE.sql` | Profile table schema + RLS |

## Security Notes

- Passwords are stored in Supabase with RLS policies
- Only users can see their own profiles and tenants
- Shared tenants have `shared = true` flag
- Admins (with `is_admin` JWT claim) can override RLS

## API Endpoints Used

The Therefore Reporter uses these Therefore Web API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GetConnectionToken` | Authenticate and get session token |
| `ExecuteSimpleQuery` | Count documents |
| `ExecuteSingleQuery` (Mode 5) | Count cases |
| `ExecuteUsersQuery` | Count users |
| `ExecuteWorkflowQueryForAll` | Count workflows |

---

**Next Steps**: Execute the SQL scripts above, create a tenant, and create your first reporter profile!
