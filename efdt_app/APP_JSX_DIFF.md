# Cambios en App.jsx — Añadir módulo EFDT Generator

## 1. Añadir import del icono (línea ~16, junto a los otros iconos)

```jsx
// AÑADIR a la lista de imports de @ant-design/icons:
ThunderboltOutlined,
```

## 2. Añadir import de la vista (línea ~30, junto a los otros imports de vistas)

```jsx
import EFDTGenerator from './views/EFDTGenerator'
```

## 3. Añadir item al menú (dentro de getMenuItems(), después del item 'docs')

Sustituir:
```jsx
{
  key: 'docs',
  icon: <FileTextOutlined />,
  label: 'Documentación de Proyectos',
  path: '/docs'
},
```

Por:
```jsx
{
  key: 'docs',
  icon: <FileTextOutlined />,
  label: 'Documentación de Proyectos',
  path: '/docs'
},
{
  key: 'efdt',
  icon: <ThunderboltOutlined />,
  label: 'Generador EFDT',
  path: '/efdt'
},
```

## 4. Añadir la ruta (dentro de <Routes>, después de la ruta /docs)

Sustituir:
```jsx
<Route path="/docs" element={<Placeholder icon={<FileTextOutlined />} title="Documentación de Proyectos" description="Próximamente: Documentación del proyecto" />} />
```

Por:
```jsx
<Route path="/docs" element={<Placeholder icon={<FileTextOutlined />} title="Documentación de Proyectos" description="Próximamente: Documentación del proyecto" />} />
<Route path="/efdt" element={<EFDTGenerator />} />
```

---

Eso es todo. 4 cambios mínimos, sin tocar nada más.
