import { SettingOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function WorkflowSettings() {
  return (
    <Placeholder
      icon={<SettingOutlined />}
      title="Configuración de Workflows"
      description="Diseña, configura y gestiona workflows automatizados en Therefore™. Define pasos, condiciones, notificaciones y scripting DCOM."
      status="development"
    />
  )
}
