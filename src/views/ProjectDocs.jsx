import { useState } from 'react'
import { Tabs, Tree, List, Button, Space, Input, Modal, Form, message, Spin, Upload, Badge, Tag, Collapse, Empty } from 'antd'
import { FileTextOutlined, FolderOutlined, DownloadOutlined, UploadOutlined, DeleteOutlined, EditOutlined, PlusOutlined, FileMarkdownOutlined } from '@ant-design/icons'

export default function ProjectDocs() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [docs, setDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  const mockDocs = {
    guides: [
      {
        id: 1,
        title: 'eForm Import/Export Guide',
        category: 'Guides',
        file: 'JJ_-_eform-import-export-guide.md',
        size: '45 KB',
        modified: '2025-04-20',
        version: '1.2',
        tags: ['eForms', 'XML', 'Import/Export'],
        content: 'Guía completa para importar y exportar eForms. Contiene instrucciones detalladas y ejemplos.'
      },
      {
        id: 2,
        title: 'eForm Data Loading Guide',
        category: 'Guides',
        file: 'JJ-therefore-eforms-data-loading-guide.md',
        size: '52 KB',
        modified: '2025-04-15',
        version: '1.1',
        tags: ['eForms', 'Data Loading', 'API'],
        content: 'Guía para cargar datos en eForms usando la API REST.'
      },
      {
        id: 3,
        title: 'Category Cloning Guide',
        category: 'Guides',
        file: 'JJ-therefore-category-cloning-guide.md',
        size: '38 KB',
        modified: '2025-04-18',
        version: '1.3',
        tags: ['Categories', 'Cloning', 'XML'],
        content: 'Procedimiento completo para clonar categorías en Therefore™.'
      }
    ],
    templates: [
      {
        id: 4,
        title: 'eForm Template (Matrículas)',
        category: 'Templates',
        file: 'TheConfiguration_eformMatriculas_PLANTILLA.xml',
        size: '156 KB',
        modified: '2025-04-10',
        version: '2024.1',
        tags: ['eForms', 'Template', 'Matrículas'],
        content: 'Template oficial de eForm para matrículas.'
      },
      {
        id: 5,
        title: 'Category Template',
        category: 'Templates',
        file: 'TheConfiguration_categoria_PLANTILLA.xml',
        size: '234 KB',
        modified: '2025-04-12',
        version: '2024.1',
        tags: ['Category', 'Template', 'XML'],
        content: 'Template oficial de categoría con 116 campos.'
      }
    ],
    scripts: [
      {
        id: 6,
        title: 'Category Cloner Script',
        category: 'Scripts',
        file: 'clonar_categoria.py',
        size: '12 KB',
        modified: '2025-04-08',
        version: '1.0',
        tags: ['Python', 'Category', 'Automation'],
        content: 'Script Python para clonar categorías automáticamente.'
      },
      {
        id: 7,
        title: 'eForm Generator Script',
        category: 'Scripts',
        file: 'generar_eform.py',
        size: '18 KB',
        modified: '2025-04-09',
        version: '1.1',
        tags: ['Python', 'eForms', 'Automation'],
        content: 'Script Python para generar eForms desde templates.'
      }
    ],
    api: [
      {
        id: 8,
        title: 'Web API Endpoints',
        category: 'API',
        file: 'web-api-endpoints.md',
        size: '87 KB',
        modified: '2025-04-14',
        version: '2020+',
        tags: ['API', 'REST', 'Reference'],
        content: 'Referencia completa de endpoints de la API REST.'
      },
      {
        id: 9,
        title: 'API Common Headers',
        category: 'API',
        file: 'web-api-common-headers.md',
        size: '24 KB',
        modified: '2025-04-13',
        version: '2024.1',
        tags: ['API', 'Headers', 'Auth'],
        content: 'Headers comunes requeridos para llamadas API.'
      },
      {
        id: 10,
        title: 'API Patterns & Examples',
        category: 'API',
        file: 'web-api-patterns.md',
        size: '156 KB',
        modified: '2025-04-11',
        version: '1.5',
        tags: ['API', 'Examples', 'Code'],
        content: 'Patrones y ejemplos de código para usar la API.'
      }
    ]
  }

  const treeData = [
    {
      title: 'Guides',
      key: 'guides',
      icon: <FileMarkdownOutlined />,
      children: mockDocs.guides.map(doc => ({
        title: doc.title,
        key: `guide-${doc.id}`,
        icon: <FileTextOutlined />,
        data: doc
      }))
    },
    {
      title: 'Templates',
      key: 'templates',
      icon: <FolderOutlined />,
      children: mockDocs.templates.map(doc => ({
        title: doc.title,
        key: `template-${doc.id}`,
        icon: <FileTextOutlined />,
        data: doc
      }))
    },
    {
      title: 'Scripts',
      key: 'scripts',
      icon: <FolderOutlined />,
      children: mockDocs.scripts.map(doc => ({
        title: doc.title,
        key: `script-${doc.id}`,
        icon: <FileTextOutlined />,
        data: doc
      }))
    },
    {
      title: 'API Reference',
      key: 'api',
      icon: <FolderOutlined />,
      children: mockDocs.api.map(doc => ({
        title: doc.title,
        key: `api-${doc.id}`,
        icon: <FileTextOutlined />,
        data: doc
      }))
    }
  ]

  const getAllDocs = () => [
    ...mockDocs.guides,
    ...mockDocs.templates,
    ...mockDocs.scripts,
    ...mockDocs.api
  ]

  const selectDoc = (keys) => {
    if (keys.length === 0) return
    const key = keys[0]
    const allDocs = getAllDocs()
    const docId = parseInt(key.split('-')[1])
    const doc = allDocs.find(d => d.id === docId)
    if (doc) {
      setSelectedDoc(doc)
    }
  }

  const handleDownload = (doc) => {
    message.info(`Descargando ${doc.file}...`)
  }

  const handleDelete = (doc) => {
    Modal.confirm({
      title: `Eliminar ${doc.title}`,
      content: '¿Estás seguro?',
      okText: 'Sí',
      cancelText: 'No',
      onOk() {
        message.success('Documento eliminado')
      }
    })
  }

  const handleUpload = (file) => {
    message.loading('Subiendo documento...')
    setTimeout(() => {
      message.success('Documento subido exitosamente')
    }, 1500)
    return false
  }

  const filteredDocs = getAllDocs().filter(doc =>
    doc.title.toLowerCase().includes(searchText.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <FileTextOutlined /> Documentación de Proyectos Therefore™
      </h1>

      <Tabs items={[
          {
            key: 'browser',
            label: 'Explorador',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
                <div style={{ border: '1px solid var(--border-default)', borderRadius: '4px', padding: '8px' }}>
                  <h4 style={{ marginBottom: '12px' }}>Categorías</h4>
                  <Tree
                    treeData={treeData}
                    onSelect={selectDoc}
                    defaultExpandAll
                  />
                </div>

                <div>
                  {!selectedDoc ? (
                    <Empty description="Selecciona un documento" />
                  ) : (
                    <Card size="small">
                      <div style={{ marginBottom: '16px' }}>
                        <h3>{selectedDoc.title}</h3>
                        <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                          {selectedDoc.tags.map(tag => (
                            <Tag key={tag} style={{ marginRight: '8px' }}>
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        background: 'var(--bg-hover)',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        fontSize: '12px'
                      }}>
                        <div><strong>Archivo:</strong> {selectedDoc.file}</div>
                        <div><strong>Tamaño:</strong> {selectedDoc.size}</div>
                        <div><strong>Versión:</strong> {selectedDoc.version}</div>
                        <div><strong>Modificado:</strong> {selectedDoc.modified}</div>
                      </div>

                      <div style={{
                        background: 'var(--bg-hover)',
                        padding: '16px',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        minHeight: '200px',
                        lineHeight: '1.6'
                      }}>
                        {selectedDoc.content}
                      </div>

                      <Space>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(selectedDoc)}
                        >
                          Descargar
                        </Button>
                        <Button
                          icon={<EditOutlined />}
                        >
                          Editar
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(selectedDoc)}
                        >
                          Eliminar
                        </Button>
                      </Space>
                    </Card>
                  )}
                </div>
              </div>
            )
          },
          {
            key: 'search',
            label: 'Búsqueda',
            children: (
              <div>
                <Input
                  placeholder="Busca por título, etiqueta o palabra clave..."
                  prefix={<FileTextOutlined />}
                  size="large"
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ marginBottom: '24px' }}
                  allowClear
                />

                {filteredDocs.length === 0 ? (
                  <Empty description="No se encontraron documentos" />
                ) : (
                  <List
                    dataSource={filteredDocs}
                    renderItem={(doc) => (
                      <List.Item
                        extra={
                          <Space>
                            <Button
                              size="small"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownload(doc)}
                            />
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(doc)}
                            />
                          </Space>
                        }
                      >
                        <List.Item.Meta
                          avatar={<FileTextOutlined style={{ fontSize: '20px' }} />}
                          title={<strong>{doc.title}</strong>}
                          description={
                            <div>
                              <div style={{ marginBottom: '8px' }}>
                                {doc.tags.map(tag => (
                                  <Tag key={tag} size="small" style={{ marginRight: '4px' }}>
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {doc.file} • {doc.size} • v{doc.version} • {doc.modified}
                              </span>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )
          },
          {
            key: 'upload',
            label: 'Subir',
            children: (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Upload
                  beforeUpload={handleUpload}
                  multiple
                  drag
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ fontSize: '48px' }} />
                  </p>
                  <p className="ant-upload-text">Arrastra archivos aquí o haz clic para seleccionar</p>
                  <p className="ant-upload-hint">
                    Soporta: .md, .pdf, .xml, .py, .json
                  </p>
                </Upload>
              </div>
            )
          }
        ]} />
    </div>
  )
}
