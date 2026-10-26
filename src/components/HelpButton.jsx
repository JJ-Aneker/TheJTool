import { useState } from 'react'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import HelpDrawer from './HelpDrawer'

export default function HelpButton({ section, style = {} }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title={t('common.help')} placement="left">
        <button
          className="help-btn"
          onClick={() => setOpen(true)}
          style={style}
          aria-label={t('common.help')}
        >
          <QuestionCircleOutlined />
        </button>
      </Tooltip>
      <HelpDrawer sectionKey={section} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
