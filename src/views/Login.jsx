import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Spin, Space, Tabs, Alert } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const { login, signup, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Si ya está autenticado, redirigir al home
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
        // La redirección ocurre automáticamente via useEffect cuando isAuthenticated cambia
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
        fullName: values.fullName,
        phone: values.phone,
        department: values.department
      })
      if (result.success) {
        message.success('Usuario creado exitosamente. Por favor inicia sesión.')
        setActiveTab('login')
        form.resetFields()
      } else {
        message.error(result.error || 'Error al crear usuario')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, var(--accent-primary) 0%, #2850d4 100%)'
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
      background: 'linear-gradient(135deg, var(--accent-primary) 0%, #2850d4 100%)',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>TheJToolbox</h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>Therefore™ Administration Panel</p>
        </div>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'login',
                label: 'Iniciar Sesión',
                children: (
                  <Spin spinning={loading}>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleLogin}
                      autoComplete="off"
                    >
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Email requerido' },
                          { type: 'email', message: 'Email inválido' }
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="usuario@buildingcenter.com"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Contraseña"
                        name="password"
                        rules={[{ required: true, message: 'Contraseña requerida' }]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Tu contraseña"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          block
                          loading={loading}
                        >
                          Iniciar Sesión
                        </Button>
                      </Form.Item>

                      <div style={{ textAlign: 'center' }}>
                        <a href="#forgot">¿Olvidaste tu contraseña?</a>
                      </div>
                    </Form>
                  </Spin>
                )
              },
              {
                key: 'signup',
                label: 'Registrarse',
                children: (
                  <Spin spinning={loading}>
                    <Alert
                      message="Registro de Nuevo Usuario"
                      description="Completa el formulario para crear una nueva cuenta. Un administrador tendrá que aprobar tu registro."
                      type="info"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />

                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSignup}
                      autoComplete="off"
                    >
                      <Form.Item
                        label="Nombre Completo"
                        name="fullName"
                        rules={[{ required: true, message: 'Nombre requerido' }]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="Juan Jiménez García"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Email requerido' },
                          { type: 'email', message: 'Email inválido' }
                        ]}
                      >
                        <Input
                          prefix={<MailOutlined />}
                          placeholder="usuario@buildingcenter.com"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Teléfono"
                        name="phone"
                        rules={[{ required: true, message: 'Teléfono requerido' }]}
                      >
                        <Input
                          prefix={<PhoneOutlined />}
                          placeholder="+34 912 345 678"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Contraseña"
                        name="password"
                        rules={[
                          { required: true, message: 'Contraseña requerida' },
                          { min: 8, message: 'Mínimo 8 caracteres' }
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Mínimo 8 caracteres"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Confirmar Contraseña"
                        name="confirmPassword"
                        rules={[{ required: true, message: 'Confirma tu contraseña' }]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Repite tu contraseña"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          block
                          loading={loading}
                        >
                          Registrarse
                        </Button>
                      </Form.Item>
                    </Form>
                  </Spin>
                )
              }
            ]}
          />
        </Card>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'white',
          fontSize: '12px'
        }}>
          <p>TheJToolbox ©2025 | Powered by Aneker · Therefore™ Integration</p>
        </div>
      </div>
    </div>
  )
}
