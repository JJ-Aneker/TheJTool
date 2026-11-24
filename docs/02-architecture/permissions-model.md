# Application Permissions Model

## Overview

**Supabase Project Admin** ≠ **Application Admin**

- **Supabase Admin**: You (project owner) - Infrastructure only
- **Application Roles**: Multiple users with granular permissions in your app

---

## Roles in Application

### 1. **Admin**
- Full access to all modules
- Can manage users and roles
- Can view all data

### 2. **Manager**
- Can manage tenants
- Can view reports
- Cannot manage users

### 3. **User**
- Can create own templates/profiles
- Can view shared resources
- Cannot manage others' resources

### 4. **Viewer**
- Read-only access
- Can view templates, reports
- Cannot create or edit

---

## Permissions Table Structure

### `roles` table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE,           -- 'admin', 'manager', 'user', 'viewer'
  description TEXT,
  created_at TIMESTAMPTZ
);
```

### `role_permissions` table
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id),
  permission VARCHAR(100),           -- 'view_users', 'edit_tenants', 'view_profiles', etc.
  created_at TIMESTAMPTZ
);
```

### Example Permissions

```
USERS MODULE:
- view_users
- create_users
- edit_users
- delete_users

TENANTS MODULE:
- view_tenants
- create_tenants
- edit_tenants
- delete_tenants

PROFILES MODULE:
- view_profiles
- create_profiles
- edit_profiles
- share_profiles

TEMPLATES MODULE:
- view_templates
- create_templates
- edit_templates
- delete_templates

REPORTS MODULE:
- view_reports
- create_reports
- export_reports
```

---

## Profiles Table Structure

```sql
ALTER TABLE profiles ADD COLUMN role_id UUID REFERENCES roles(id);

-- OR simpler: Store role name directly
ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
```

---

## Implementation

### usePermission() Hook

```javascript
const { can, loading } = usePermission()

// Check specific permission
can('view_users')      // true/false
can('edit_tenants')    // true/false
can('delete_users')    // true/false
```

### Protect Routes

```javascript
<ProtectedRoute permission="view_users">
  <UserManager />
</ProtectedRoute>
```

### Hide UI Elements

```javascript
function TenantList() {
  const { can } = usePermission()
  
  return (
    <>
      {can('view_tenants') && <Table />}
      {can('create_tenants') && <Button>Nuevo Tenant</Button>}
      {can('delete_tenants') && <DeleteButton />}
    </>
  )
}
```

---

## Role Definitions (Example)

### Admin
- Permissions: All (wildcard or explicit list)
- Can: View everything, edit everything, manage users

### Manager
- Permissions: 
  - view_users
  - view_tenants, create_tenants, edit_tenants
  - view_reports
  - view_templates (shared only)

### User
- Permissions:
  - view_profiles (own)
  - create_profiles, edit_profiles (own)
  - view_templates (own + shared)
  - create_templates, edit_templates (own)

### Viewer
- Permissions:
  - view_profiles (shared)
  - view_templates (shared)
  - view_reports (published)

---

## RLS With Permissions

### Example: Only managers can view tenants

```sql
CREATE POLICY "Users with view_tenants permission can view"
  ON tenants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      JOIN role_permissions rp ON p.role = rp.permission
      WHERE rp.permission = 'view_tenants'
    )
  );
```

---

## Next Steps

1. Create `roles` table with predefined roles
2. Create `role_permissions` table with module permissions
3. Implement `usePermission()` hook
4. Wrap routes with `ProtectedRoute permission="..."`
5. Hide/show UI based on permissions
6. Add RLS policies for data-level security

---

**Current Status**: Planning phase
**Priority**: Medium (after role-based access is working)
