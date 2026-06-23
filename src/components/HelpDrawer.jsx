import { Drawer, Button } from 'antd'
import { QuestionCircleOutlined, BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getHelpSections } from '../help/helpContent'
import '../styles/manual.css'

export default function HelpDrawer({ sectionKey, open, onClose }) {
  const navigate = useNavigate()
  const { i18n, t } = useTranslation()
  const sections = getHelpSections(i18n.language)
  const section = sections[sectionKey]

  if (!section) return null

  const footerLabel = i18n.language === 'en' ? 'View full manual' : 'Ver manual completo'

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QuestionCircleOutlined style={{ color: 'var(--accent-primary)' }} />
          <span>{section.title}</span>
        </div>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: '16px 20px', overflowY: 'auto' },
        header: {
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          color: 'var(--text-primary)'
        },
        content: { background: 'var(--bg-surface)' },
        mask: { background: 'rgba(0,0,0,0.25)' }
      }}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Button
            type="link"
            icon={<BookOutlined />}
            onClick={() => { onClose(); navigate(`/manual#${section.id}`) }}
            style={{ color: 'var(--accent-primary)', fontSize: 13 }}
          >
            {footerLabel}
          </Button>
        </div>
      }
    >
      <p className="help-intro">{section.intro}</p>
      {section.sections.map(s => (
        <div key={s.id} className="help-section">
          <h4 className="help-section-title">{s.title}</h4>
          <div
            className="help-section-body"
            dangerouslySetInnerHTML={{ __html: s.body }}
          />
        </div>
      ))}
    </Drawer>
  )
}
