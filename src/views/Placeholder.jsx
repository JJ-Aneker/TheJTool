import { ArrowLeftOutlined } from '@ant-design/icons'

export default function Placeholder({ icon: Icon, title, description, status = 'development' }) {
  return (
    <div className="placeholder-view" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ marginBottom: '24px' }}>
        {Icon && <div style={{ fontSize: '64px', marginBottom: '16px' }}>{Icon}</div>}
      </div>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>{title}</h1>
      <p style={{ fontSize: '14px', marginBottom: '24px', maxWidth: '400px' }}>
        {description}
      </p>
      <div style={{
        display: 'inline-block',
        padding: '8px 16px',
        background: 'var(--kpi-amber)',
        borderRadius: '4px',
        color: 'var(--text-inverse)',
        marginBottom: '24px',
        fontSize: '12px'
      }}>
        Estado: {status === 'development' ? '🔨 En Desarrollo' : status}
      </div>
      <button
        className="btn-default"
        onClick={() => window.location.pathname = '/'}
        style={{ marginTop: '16px' }}
      >
        <ArrowLeftOutlined style={{ fontSize: '12px' }} /> Volver al Inicio
      </button>
    </div>
  )
}
