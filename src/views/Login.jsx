import { useState, useEffect } from 'react'
import { Form, Input, Button, message, Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { MESSAGES } from '../constants/messages'
import { handleError } from '../utils/errorHandler'

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
        message.success(MESSAGES.AUTH.LOGIN_SUCCESS)
      } else {
        message.error(result.error || MESSAGES.AUTH.LOGIN_ERROR)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error(MESSAGES.AUTH.PASSWORD_MISMATCH)
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
        message.success(MESSAGES.AUTH.REGISTER_SUCCESS)
        setActiveView('login')
        form.resetFields()
      } else {
        message.error(result.error || MESSAGES.AUTH.REGISTER_ERROR)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverPassword = async (values) => {
    setLoading(true)
    try {
      message.loading(MESSAGES.INFO.PROCESSING)
      await new Promise(resolve => setTimeout(resolve, 1500))
      message.success(MESSAGES.AUTH.RESET_LINK_SENT)
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
            style={{ height: 'var(--height-input)' }}
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
            style={{ height: 'var(--height-input)' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ height: '40px', fontSize: '14px', fontWeight: '600', width: '100%' }}
          >
            {loading ? '⏳ Entrando...' : 'Entrar'}
          </button>
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
            style={{ height: 'var(--height-input)' }}
          />
        </Form.Item>

        <Form.Item
          name="apellidos"
          rules={[{ required: true, message: 'Apellidos requeridos' }]}
        >
          <Input
            placeholder="Apellidos"
            size="large"
            style={{ height: 'var(--height-input)' }}
          />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[{ required: true, message: 'Teléfono requerido' }]}
        >
          <Input
            placeholder="Teléfono"
            size="large"
            style={{ height: 'var(--height-input)' }}
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
            style={{ height: 'var(--height-input)' }}
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
            style={{ height: 'var(--height-input)' }}
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
            style={{ height: 'var(--height-input)' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ height: '40px', fontSize: '14px', fontWeight: '600', width: '100%' }}
          >
            {loading ? '⏳ Creando...' : 'Crear cuenta'}
          </button>
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
            style={{ height: 'var(--height-input)' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ height: '40px', fontSize: '14px', fontWeight: '600', width: '100%' }}
          >
            {loading ? '⏳ Enviando...' : 'Enviar enlace'}
          </button>
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
                width: '75px',
                height: '100px'
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
