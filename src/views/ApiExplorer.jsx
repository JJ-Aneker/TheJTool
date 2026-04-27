import { ApiOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function ApiExplorer() {
  return (
    <Placeholder
      icon={<ApiOutlined />}
      title="Explorador API REST"
      description="Interfaz interactiva para explorar, documentar y probar los endpoints de la API REST de Therefore™. Incluye autenticación y ejemplos de requests."
      status="development"
    />
  )
}
