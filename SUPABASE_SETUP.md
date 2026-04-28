# Configuración de Supabase para Gestión de Usuarios

Este documento guía la configuración de Supabase para la gestión de usuarios y autenticación en TheJToolbox.

## 1. Crear Proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Haz clic en "New Project"
3. Completa los datos:
   - **Name**: TheJToolbox
   - **Database Password**: (guardar en lugar seguro)
   - **Region**: Selecciona la más cercana
4. Espera a que se complete la inicialización

## 2. Obtener Credenciales

1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` (VITE_SUPABASE_URL)
   - `anon public key` (VITE_SUPABASE_KEY)

## 3. Crear Tablas en la Base de Datos

Abre el **SQL Editor** en Supabase y ejecuta los siguientes scripts:

### Tabla de Usuarios

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'auditor')),
  department VARCHAR(100),
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Crear índices para búsqueda rápida
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_status ON users(status);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Tabla de Registros de Auditoría

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsqueda por usuario
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Tabla de Roles y Permisos

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles predefinidos
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrador del sistema', '["user_management", "system_config", "audit", "all"]'),
('manager', 'Gerente de operaciones', '["document_create", "document_edit", "report_view", "task_assign"]'),
('user', 'Usuario estándar', '["document_view", "request_create", "report_own"]'),
('auditor', 'Auditor del sistema', '["audit_view", "report_generate", "change_analysis"]');
```

## 4. Configurar Variables de Entorno

Copia el contenido de `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa los valores:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000
VITE_THEREFORE_BASE_URL=https://buildingcenter.thereforeonline.com/theservice/v0001/restun
```

## 5. Configurar Políticas de Row-Level Security (RLS)

En Supabase, ve a **Authentication** → **Policies** y habilita RLS en la tabla `users`:

```sql
-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Política: Los administradores pueden ver todos los usuarios
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política: Los administradores pueden actualizar cualquier usuario
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para audit_logs
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## 6. Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

## 7. Usar en la Aplicación

### Envolver la app con AuthProvider

En `src/main.jsx`:

```jsx
import { AuthProvider } from './context/AuthContext'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

### Usar useAuth en componentes

```jsx
import { useAuth } from './hooks/useAuth'

export default function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()

  return (
    <div>
      {isAuthenticated && <p>Bienvenido, {user.email}</p>}
    </div>
  )
}
```

## 8. Usar Servicios

### Authentication Service

```javascript
import { authService } from './services/authService'

// Sign up
const result = await authService.signUp('user@example.com', 'password', {
  fullName: 'John Doe',
  role: 'user'
})

// Sign in
const result = await authService.signIn('user@example.com', 'password')

// Sign out
await authService.signOut()
```

### User Service

```javascript
import { userService } from './services/userService'

// Get all users
const result = await userService.getAllUsers()

// Create user
const result = await userService.createUser('user@example.com', {
  fullName: 'John Doe',
  role: 'user',
  department: 'IT'
})

// Update user
const result = await userService.updateUser(userId, {
  role: 'manager'
})

// Delete user
const result = await userService.deleteUser(userId)
```

## 9. Estructura de Archivos

```
src/
├── config/
│   └── supabaseClient.js       # Cliente de Supabase
├── context/
│   └── AuthContext.jsx         # Context de autenticación
├── hooks/
│   └── useAuth.js              # Hook para usar AuthContext
├── services/
│   ├── authService.js          # Servicio de autenticación
│   └── userService.js          # Servicio de gestión de usuarios
└── views/
    ├── Login.jsx               # Página de login
    └── UserManager.jsx         # Gestión de usuarios
```

## 10. Troubleshooting

### Error: "Supabase URL and Key not provided"
- Verifica que `.env.local` contiene las variables correctas
- Reinicia el servidor de desarrollo

### Error: "user_id" not found in audit_logs
- Asegúrate de que la tabla `audit_logs` existe
- Verifica que las columnas están correctamente creadas

### RLS causando permisos denegados
- Ve a **Authentication** → **Policies**
- Verifica que las políticas están correctamente configuradas
- Para desarrollo, puedes deshabilitar temporalmente RLS (no en producción)

## 11. Próximos Pasos

- Integrar MFA (Multi-Factor Authentication)
- Agregar OAuth (Google, GitHub)
- Implementar rate limiting para login
- Agregar 2FA con autenticadores
- Configurar email de confirmación

## Documentación Oficial

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
