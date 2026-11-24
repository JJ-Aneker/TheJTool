# Security Architecture

## Overview

The application uses a **two-layer security model**:

1. **Authentication** (Who you are) → Handled by Supabase Auth
2. **Authorization** (What you can do) → Handled by `profiles` table

---

## Layer 1: Authentication (Supabase Auth)

**Purpose:** Verify user identity and manage passwords

**Responsibility of Supabase Auth:**
- Email/password login
- Password reset
- Session management
- JWT token generation

**What it does NOT manage:**
- ❌ User roles
- ❌ Permissions
- ❌ Feature access

---

## Layer 2: Authorization (profiles table)

**Purpose:** Define what authenticated users can do

**Stored in `profiles` table:**
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  role VARCHAR (50) DEFAULT 'user',  -- admin, manager, user, auditor
  approved BOOLEAN DEFAULT false,    -- Account status
  -- ... other fields
)
```

**The `profiles` table is the Single Source of Truth for:**
- ✅ User roles
- ✅ Permissions
- ✅ Feature access
- ✅ Account status

---

## How It Works

### 1. User Logs In

```
User enters email/password
    ↓
Supabase Auth validates credentials
    ↓
User authenticated (JWT issued)
    ↓
App reads role from profiles table
```

### 2. Access Control

```javascript
// Every authorization check reads from profiles table
const { isAdmin } = useRole()
// ✓ Fetches from DB, NOT from JWT metadata
```

### 3. Role Updates

```javascript
// Admin changes a user's role
updateUserRole(userId, 'admin')
    ↓
profiles table updated
    ↓
Next time user action accesses useRole(), 
new role is fetched from profiles table
```

---

## Why This Architecture?

### ✅ Benefits

1. **Single Source of Truth**: Role is always in `profiles` table
2. **Real-time Updates**: Changes take effect immediately (no JWT cache)
3. **Centralized Control**: All permissions in one place
4. **Easier Auditing**: Changes tracked in database
5. **Better Performance**: No JWT re-signing needed

### ❌ Avoid

- ❌ Storing roles in JWT metadata
- ❌ JWT claims as source of truth
- ❌ Client-side permission checking

---

## Implementation

### useRole() Hook

```javascript
// Always reads from profiles table
const { isAdmin, role, approved } = useRole()

// Returns:
// - isAdmin: boolean (role === 'admin')
// - role: string ('admin' | 'manager' | 'user' | 'auditor')
// - approved: boolean (account status)
// - loading: boolean (fetching from DB)
```

### Protected Routes

```javascript
// Admin-only pages use AdminRoute
<Route path="/users" 
  element={<AdminRoute><UserManager /></AdminRoute>} 
/>

// AdminRoute checks profiles.role, NOT JWT
```

### RLS Policies

Database-level security should also reference `profiles.role`:

```sql
-- Example RLS policy reading from profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (
    auth.uid() = user_id  -- Auth check
    OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'  -- Authorization check
  );
```

---

## Security Checklist

- ✅ No roles in JWT metadata
- ✅ All authorization reads from `profiles` table
- ✅ Changes to `profiles` take effect immediately
- ✅ RLS policies reference `profiles` table
- ✅ Supabase Auth is auth-only
- ✅ Client-side checks are supplemented by RLS

---

## Future Improvements

1. **Add audit logging** to track role changes
2. **Implement permission hierarchy** (admin > manager > user)
3. **Add temporal access** (time-limited permissions)
4. **Cache profiles data** client-side with auto-refresh
5. **WebSocket updates** for real-time permission changes

---

**Last Updated:** 2026-05-19
