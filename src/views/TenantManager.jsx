import { CloudOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function TenantManager() {
  return (
    <Placeholder
      icon={<CloudOutlined />}
      title="Gestión de Tenants"
      description="Administra múltiples instancias de Therefore™ Online. Visualiza, configura y sincroniza instancias como buildingcenter y naturgy."
      status="development"
    />
  )
}
