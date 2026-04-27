import { CopyOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function CategoryCloner() {
  return (
    <Placeholder
      icon={<CopyOutlined />}
      title="Clonador de Categorías"
      description="Replica estructuras de categorías existentes en Therefore™, regenerando GUIDs, nombres y manteniendo relaciones y validaciones."
      status="development"
    />
  )
}
