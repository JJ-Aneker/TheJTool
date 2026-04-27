import { FormOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function EFormGenerator() {
  return (
    <Placeholder
      icon={<FormOutlined />}
      title="Generador de eForms"
      description="Herramienta para crear, editar y gestionar formularios electrónicos basados en form.io. Permite definir esquemas JSON y exportar/importar eForms en Therefore™."
      status="development"
    />
  )
}
