# Cambios Necesarios en UserManager

## ✅ Implementado (Backend)

1. **`routes/admin.js`** - Endpoints para activar/aprobar usuarios:
   - `POST /api/admin/activate-user` - Confirmar email manualmente
   - `POST /api/admin/approve-user` - Aprobar usuario
   - `POST /api/admin/activate-and-approve-user` - Ambas acciones
   - `GET /api/admin/user-status/:userId` - Estado completo del usuario

2. **`src/services/adminService.js`** - Funciones cliente para llamar a los endpoints

## 📝 Pendiente (Frontend - UserManager.jsx)

### Cambios necesarios:

```javascript
// 1. Añadir import
import { activateUserEmail, approveUser, activateAndApproveUser } from '../services/adminService'

// 2. Añadir state para email confirmation status
const [usersWithStatus, setUsersWithStatus] = useState([])

// 3. Modificar loadUsers() para obtener también auth status
// Necesitamos llamar a getUserStatus para cada usuario

// 4. Añadir nueva columna "Email Confirmado"
{
  title: 'Email',
  dataIndex: 'email_confirmed',
  key: 'email_confirmed',
  render: (confirmed) => (
    <Tag icon={confirmed ? <CheckCircleOutlined /> : <MailOutlined />} 
         color={confirmed ? 'cyan' : 'orange'}>
      {confirmed ? 'Confirmado' : 'Pendiente'}
    </Tag>
  )
}

// 5. Añadir botones en columna Actions
{
  title: 'Acciones Rápidas',
  key: 'quick_actions',
  render: (_, record) => (
    <>
      {!record.email_confirmed && (
        <Tooltip title="Activar email manualmente">
          <Button size="small" onClick={() => handleActivateEmail(record)}>
            ✓ Activar
          </Button>
        </Tooltip>
      )}
      {!record.approved && (
        <Tooltip title="Aprobar usuario">
          <Button size="small" type="primary" onClick={() => handleApproveUser(record)}>
            ✓ Aprobar
          </Button>
        </Tooltip>
      )}
      {!record.email_confirmed && !record.approved && (
        <Button size="small" type="primary" onClick={() => handleActivateAndApprove(record)}>
          ✓ Activar y Aprobar
        </Button>
      )}
    </>
  )
}

// 6. Implementar handlers
const handleActivateEmail = async (user) => {
  const result = await activateUserEmail(user.user_id)
  if (result.success) {
    message.success('Email activado')
    loadUsers()
  } else {
    message.error(result.error)
  }
}

const handleApproveUser = async (user) => {
  const result = await approveUser(user.user_id)
  if (result.success) {
    message.success('Usuario aprobado')
    loadUsers()
  } else {
    message.error(result.error)
  }
}

const handleActivateAndApprove = async (user) => {
  const result = await activateAndApproveUser(user.user_id)
  if (result.success) {
    message.success('Usuario activado y aprobado')
    loadUsers()
  } else {
    message.error(result.error)
  }
}
```

## 🎯 Resultado Esperado

Tabla de usuarios mostrará:
- ✅ Nombre
- ✅ Email  
- ✅ Email Confirmado (Nueva columna)
- ✅ Aprobado
- ✅ Rol
- ✅ Acciones (Edit, Password, Delete)
- ✅ Acciones Rápidas (Activar, Aprobar, Activar+Aprobar)

Estados posibles:
1. ❌ Email pendiente + ❌ No aprobado → Botón "✓ Activar y Aprobar"
2. ✓ Email confirmado + ❌ No aprobado → Botón "✓ Aprobar"
3. ❌ Email pendiente + ✓ Aprobado → Botón "✓ Activar"
4. ✓ Email confirmado + ✓ Aprobado → Sin botones (activo)

