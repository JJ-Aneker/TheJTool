import { useState } from 'react'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import HelpDrawer from './HelpDrawer'

export default function HelpButton({ section, style = {} }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title="Ayuda" placement="left">
        <button
          className="help-btn"
          onClick={() => setOpen(true)}
          style={style}
          aria-label="Abrir ayuda"
        >
          <QuestionCircleOutlined />
        </button>
      </Tooltip>
      <HelpDrawer sectionKey={section} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
