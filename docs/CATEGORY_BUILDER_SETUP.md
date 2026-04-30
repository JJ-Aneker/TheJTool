# Category Builder Setup Guide

## Overview

The Category Builder is a React component for creating and managing Therefore™ category templates with Supabase backend storage. It provides a user-friendly interface for:

- Creating and editing category templates
- Importing/exporting category XML
- Managing template versions
- Sharing templates between users
- Template organization and search

## Architecture

### Component Structure

```
CategoryBuilder.jsx
├── Template editor (left panel)
├── Template manager sidebar (right panel)
└── Templates modal (for browsing all templates)
```

### Database Schema

The templates are stored in the `category_templates` table with:

- **id** (UUID): Primary key
- **template_id** (VARCHAR): Unique identifier for duplicate prevention (UPSERT logic)
- **name** (VARCHAR): Template name
- **description** (TEXT): Optional description
- **xml_definition** (TEXT): The Therefore™ category XML
- **csv_data** (TEXT): Optional CSV data for field definitions
- **compartido** (BOOLEAN): Share flag (false = private, true = shared)
- **created_by** (UUID): Reference to auth.users
- **created_at** (TIMESTAMPTZ): Creation timestamp
- **updated_at** (TIMESTAMPTZ): Last update timestamp

### Access Control (RLS Policies)

- **SELECT**: Users see their own templates + shared templates; admins see all
- **INSERT**: Only authenticated users can create templates
- **UPDATE**: Only creator or admin can update
- **DELETE**: Only creator or admin can delete

## Setup Instructions

### 1. Create Supabase Table

Execute the SQL script in Supabase SQL Editor:

```bash
# Copy the entire contents of:
docs/SUPABASE_CATEGORY_TEMPLATES_TABLE.sql

# Paste into Supabase > SQL Editor > New Query
# Run the query
```

### 2. Enable RLS Policies

The SQL script automatically creates all required Row Level Security policies. Verify in:
- Supabase Dashboard > category_templates > RLS

### 3. Component Integration

The CategoryBuilder is already integrated into App.jsx:

```jsx
import CategoryBuilder from './views/CategoryBuilder'

// Route configured:
<Route path="/category-builder" element={<CategoryBuilder />} />
```

## Features

### Create/Edit Templates

1. Fill in the template name (required)
2. Add optional description
3. Upload XML file or paste XML content
4. Click "Guardar Plantilla" to save

### Manage Templates

- **Search**: Filter templates by name or description
- **Load**: Click edit button to load template into editor
- **Share**: Toggle compartido to make template visible to other users
- **Duplicate**: Create a copy of any template (owned or shared)
- **Download**: Export template as XML file
- **Delete**: Remove template permanently

### Admin Features

- Admins can view all templates
- Admins can edit/delete any template
- Set `is_admin: true` in user JWT claims for admin access

## User Isolation

- Users only see templates they created
- Users can see templates marked as `compartido = true`
- Admins see all templates regardless of ownership
- Deletion is restricted to owners (except admins)

## Duplicate Prevention

The `template_id` field ensures no duplicates:
- When duplicating a template, a new `template_id` is generated with timestamp
- When creating new templates, the ID is generated from user + timestamp

## Styling

The component uses the centralized CSS variables from `design-tokens.css`:

- Colors: `--accent-primary`, `--bg-card`, `--border-default`
- Spacing: Standard 8px/12px/16px/24px scale
- Responsive: Grid collapses to single column on mobile

## Integration with Therefore™

### Cloning Categories

To programmatically clone a category template:

```python
from clonar_categoria import clonar_categoria

clonar_categoria(
    origen='downloaded_template.xml',
    destino='nueva_categoria.xml',
    nuevo_nombre='02 - Legal y Fiscal',
    nuevo_ctgry_id='Legal_Fiscal'
)
```

See: `docs/therefore/JJ-therefore-category-cloning-guide.md`

### Solution Designer Integration

1. Download the template XML from Category Builder
2. Import into Therefore Solution Designer
3. Modify fields/layout as needed
4. Publish through Therefore workflow

## Common Workflows

### Share a Template with Team

1. Create/edit the template
2. Click the share button (lock icon)
3. Other users will see it in "Mis Plantillas"

### Create Variant of Existing Template

1. Find the template in "Mis Plantillas"
2. Click duplicate (copy icon)
3. Modify as needed
4. Save with new name

### Export for Backup

1. Find template
2. Click download (arrow icon)
3. XML file saved to Downloads

## Troubleshooting

### Templates Not Loading

- Check if `category_templates` table exists in Supabase
- Verify RLS policies are enabled
- Ensure user is authenticated

### Cannot See Shared Templates

- Verify other user has set `compartido = true`
- Check that user is logged in
- Confirm RLS policies allow SELECT for compartido=true

### Cannot Edit Templates

- Only creator (or admin) can edit
- Ask template owner to share if needed

## Related Files

- **Component**: `src/views/CategoryBuilder.jsx`
- **Styles**: `src/styles/category-builder.css`
- **Database**: `docs/SUPABASE_CATEGORY_TEMPLATES_TABLE.sql`
- **Documentation**: `docs/therefore/JJ-therefore-category-cloning-guide.md`
