import { useState, useEffect } from 'react'
import { Form, Input, Button, message, Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState('login')
  const { login, signup, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const result = await login(values.email, values.password)
      if (result.success) {
        message.success('Login exitoso')
      } else {
        message.error(result.error || 'Error en el login. Verifica email y contraseña.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const result = await signup(values.email, values.password, {
        fullName: `${values.nombre} ${values.apellidos}`,
        phone: values.phone,
        department: values.department
      })
      if (result.success) {
        message.success('Usuario creado exitosamente. Por favor inicia sesión.')
        setActiveView('login')
        form.resetFields()
      } else {
        message.error(result.error || 'Error al crear usuario')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverPassword = async (values) => {
    setLoading(true)
    try {
      message.loading('Enviando enlace de recuperación...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      message.success('Enlace enviado a tu correo electrónico')
      form.resetFields()
      setActiveView('login')
    } finally {
      setLoading(false)
    }
  }

  const renderLoginView = () => (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        autoComplete="off"
        style={{ marginTop: '24px' }}
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Email requerido' },
            { type: 'email', message: 'Email inválido' }
          ]}
        >
          <Input
            placeholder="Correo electrónico"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Contraseña requerida' }]}
        >
          <Input
            type="password"
            placeholder="Contraseña"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ height: '40px', fontSize: '14px', fontWeight: '600' }}
          >
            Entrar
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', fontSize: '13px' }}>
          <a
            onClick={() => {
              setActiveView('recover')
              form.resetFields()
            }}
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', marginRight: '8px' }}
          >
            ¿Olvidaste tu contraseña?
          </a>
          <span style={{ color: 'var(--text-secondary)' }}>|</span>
          <a
            onClick={() => {
              setActiveView('signup')
              form.resetFields()
            }}
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', marginLeft: '8px' }}
          >
            Crear cuenta
          </a>
        </div>
      </Form>
    </Spin>
  )

  const renderSignupView = () => (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSignup}
        autoComplete="off"
        style={{ marginTop: '24px' }}
      >
        <Form.Item
          name="nombre"
          rules={[{ required: true, message: 'Nombre requerido' }]}
        >
          <Input
            placeholder="Nombre"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item
          name="apellidos"
          rules={[{ required: true, message: 'Apellidos requeridos' }]}
        >
          <Input
            placeholder="Apellidos"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[{ required: true, message: 'Teléfono requerido' }]}
        >
          <Input
            placeholder="Teléfono"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Email requerido' },
            { type: 'email', message: 'Email inválido' }
          ]}
        >
          <Input
            placeholder="Correo electrónico"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Contraseña requerida' },
            { min: 8, message: 'Mínimo 8 caracteres' }
          ]}
        >
          <Input
            type="password"
            placeholder="Contraseña"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          rules={[{ required: true, message: 'Confirma tu contraseña' }]}
        >
          <Input
            type="password"
            placeholder="Confirmar contraseña"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ height: '40px', fontSize: '14px', fontWeight: '600' }}
          >
            Crear cuenta
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', fontSize: '13px' }}>
          <a
            onClick={() => {
              setActiveView('login')
              form.resetFields()
            }}
            style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </a>
        </div>
      </Form>
    </Spin>
  )

  const renderRecoverView = () => (
    <Spin spinning={loading}>
      <div style={{ marginTop: '24px', textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
          Introduce tu correo y recibirás un enlace para restaurarla.
        </p>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleRecoverPassword}
        autoComplete="off"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Email requerido' },
            { type: 'email', message: 'Email inválido' }
          ]}
        >
          <Input
            placeholder="Correo electrónico"
            size="large"
            style={{ height: '40px' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ height: '40px', fontSize: '14px', fontWeight: '600' }}
          >
            Enviar enlace
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', fontSize: '13px' }}>
          <a
            onClick={() => {
              setActiveView('login')
              form.resetFields()
            }}
            style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
          >
            ← Volver al inicio de sesión
          </a>
        </div>
      </Form>
    </Spin>
  )

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-canvas)'
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-canvas)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Modal/Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{
            marginBottom: '24px'
          }}>
            <img
              src="/assets/images/logo.png"
              alt="Logo"
              style={{
                width: '60px',
                height: '60px'
              }}
            />
          </div>

          {/* Content based on active view */}
          {activeView === 'login' && renderLoginView()}
          {activeView === 'signup' && renderSignupView()}
          {activeView === 'recover' && renderRecoverView()}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <p>© 2025 Aneker</p>
        </div>
      </div>
    </div>
  )
}
