import { AppstoreOutlined } from '@ant-design/icons'
import Placeholder from './Placeholder'

export default function CategoryBuilder() {
  return (
    <Placeholder
      icon={<AppstoreOutlined />}
      title="Category Builder"
      description="Constructor visual de categorías para Therefore™. Define campos tipados, validaciones, layouts y relaciones entre categorías."
      status="development"
    />
  )
}
