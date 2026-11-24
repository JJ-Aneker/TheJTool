import { Avatar, Dropdown, Space } from 'antd'
import { UserOutlined, LogoutOutlined, ProfileOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'

export default function UserDropdown() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const items = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Mi Perfil',
      onClick: handleProfileClick
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
      danger: true
    }
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Space style={{ cursor: 'pointer' }}>
        <Avatar
          size={32}
          icon={<UserOutlined />}
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
        <span style={{ fontSize: '14px' }}>
          {user.email}
        </span>
      </Space>
    </Dropdown>
  )
}
