// src/components/LanguageSwitcher.jsx
import { GlobalOutlined } from '@ant-design/icons'
import { Dropdown, Button } from 'antd'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
  }

  const items = [
    {
      key: 'es',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇪🇸</span>
          <span>{t('language.spanish')}</span>
          {i18n.language === 'es' && <span style={{ color: '#1677ff' }}>✓</span>}
        </div>
      ),
      onClick: () => changeLanguage('es')
    },
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🇬🇧</span>
          <span>{t('language.english')}</span>
          {i18n.language === 'en' && <span style={{ color: '#1677ff' }}>✓</span>}
        </div>
      ),
      onClick: () => changeLanguage('en')
    }
  ]

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
      <Button
        type="text"
        icon={<GlobalOutlined style={{ fontSize: '18px' }} />}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {i18n.language === 'es' ? '🇪🇸' : '🇬🇧'}
      </Button>
    </Dropdown>
  )
}
