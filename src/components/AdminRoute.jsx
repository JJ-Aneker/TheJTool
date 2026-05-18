import { Navigate } from 'react-router-dom'
import { Spin, Result, Button } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'

/**
 * AdminRoute Component
 *
 * Protects routes that require admin access.
 * Checks role from 'profiles' table (NOT from JWT).
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isAdmin, loading: roleLoading } = useRole()

  const loading = authLoading || roleLoading

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Spin size="large" tip="Verificando permisos..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle="No tienes permisos para acceder a esta sección. Solo los administradores pueden verla."
        extra={
          <Button type="primary" onClick={() => window.location.href = '/'}>
            Volver al Inicio
          </Button>
        }
      />
    )
  }

  return children
}
