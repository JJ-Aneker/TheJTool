# Supabase RLS Setup Guide

## Applying the INSERT Policy for `profiles` Table

The signup flow requires an INSERT policy to allow new users to create their initial profile.

### Method 1: SQL Editor (Recommended)

1. **Open Supabase Dashboard** → Your project
2. **Navigate to**: SQL Editor (left sidebar)
3. **Paste this SQL**:

```sql
-- Add INSERT policy for signup
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

4. **Click "RUN"**
5. **Verify**: You should see `Success. No rows returned.`

---

### Method 2: Table Editor UI

1. **Navigate to**: Tables → profiles
2. **Click the shield icon** (top right) for RLS settings
3. **Click "New Policy"**
4. **Select**:
   - **Command**: INSERT
   - **Which rows can be inserted?**: (leave blank - means all rows)
   - **Add a WHERE condition**: `auth.uid() = user_id`
5. **Policy Name**: `Users can insert their own profile`
6. **Click "Save"**

---

## Verify the Policy

After applying, the `profiles` table should have these 4 policies:

1. ✅ SELECT - Enable read access
2. ✅ UPDATE - Users can update own profile  
3. ✅ UPDATE - Admins can update all profiles
4. ✅ INSERT - Users can insert their own profile

### Test Signup Flow

1. Log out completely
2. Go to `/signup.html`
3. Enter a new email and password
4. After signup → should create profile successfully
5. Log in with the new credentials
6. Check that profile loads correctly

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `Policy "Users can insert their own profile" already exists` | Policy already added | Skip - it's already applied |
| `pgrst: new row violates row level security policy` | RLS is still blocking inserts | Verify the policy was created correctly |
| `policy not found` | Wrong table name | Make sure you're on the `profiles` table |

---

## What This Policy Does

- ✅ Allows signup to create a profile: `user_id = auth.uid()`
- ✅ Blocks profile creation with someone else's `user_id`
- ✅ Works with `supabase.js` signup function automatically
