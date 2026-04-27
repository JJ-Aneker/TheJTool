import { FileTextOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function ProjectDocs() {
  return (
    <Placeholder
      icon={<FileTextOutlined />}
      title="Documentación de Proyectos"
      description="Gestiona y visualiza documentación de proyectos basados en Therefore™. Incluye guides, eForms templates, scripts y configuraciones."
      status="development"
    />
  )
}
