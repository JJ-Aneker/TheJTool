import { Drawer, Button } from 'antd'
import { QuestionCircleOutlined, BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { HELP_SECTIONS } from '../help/helpContent'
import '../styles/manual.css'

export default function HelpDrawer({ sectionKey, open, onClose }) {
  const navigate = useNavigate()
  const section = HELP_SECTIONS[sectionKey]

  if (!section) return null

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
            Ver manual completo
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
