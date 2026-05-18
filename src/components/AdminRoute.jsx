import { Navigate } from 'react-router-dom'
import { Spin, Result, Button } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const { isAdmin } = useRole()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Spin size="large" />
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
