import { useState } from 'react'
import { Card, Form, Select, Input, Button, Space, Table, Alert, Spin, Tree, Collapse, Tabs, Tag, Empty } from 'antd'
import { ApiOutlined, PlayCircleOutlined, CopyOutlined } from '@ant-design/icons'
import axios from 'axios'

export default function ApiExplorer() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [response, setResponse] = useState(null)
  const [headers, setHeaders] = useState({})

  const API_ENDPOINTS = {
    documents: {
      category: 'Documentos',
      endpoints: [
        {
          id: 'GetDocumentInfo',
          name: 'GetDocumentInfo',
          method: 'GET',
          path: '/GetDocumentInfo',
          description: 'Obtiene información de un documento',
          params: [
            { name: 'DocNo', type: 'string', required: true, example: '12345' },
            { name: 'CategoryNo', type: 'string', required: true, example: '1' }
          ]
        },
        {
          id: 'GetDocumentIndexData',
          name: 'GetDocumentIndexData',
          method: 'GET',
          path: '/GetDocumentIndexData',
          description: 'Obtiene datos indexados de un documento',
          params: [
            { name: 'DocNo', type: 'string', required: true },
            { name: 'CategoryNo', type: 'string', required: true }
          ]
        },
        {
          id: 'SaveDocumentIndexData',
          name: 'SaveDocumentIndexData',
          method: 'POST',
          path: '/SaveDocumentIndexData',
          description: 'Guarda datos indexados de un documento',
          params: [
            { name: 'DocNo', type: 'string', required: true },
            { name: 'CategoryNo', type: 'string', required: true },
            { name: 'IndexData', type: 'object', required: true }
          ]
        }
      ]
    },
    categories: {
      category: 'Categorías',
      endpoints: [
        {
          id: 'GetCategoryInfo',
          name: 'GetCategoryInfo',
          method: 'GET',
          path: '/GetCategoryInfo',
          description: 'Obtiene información de una categoría',
          params: [
            { name: 'CategoryNo', type: 'string', required: true, example: '1' }
          ]
        },
        {
          id: 'GetCategoryFields',
          name: 'GetCategoryFields',
          method: 'GET',
          path: '/GetCategoryFields',
          description: 'Obtiene campos de una categoría',
          params: [
            { name: 'CategoryNo', type: 'string', required: true }
          ]
        }
      ]
    },
    workflows: {
      category: 'Workflows',
      endpoints: [
        {
          id: 'ExecuteWorkflow',
          name: 'ExecuteWorkflow',
          method: 'POST',
          path: '/ExecuteWorkflow',
          description: 'Ejecuta un workflow',
          params: [
            { name: 'WorkflowNo', type: 'string', required: true },
            { name: 'InstanceNo', type: 'string', required: true }
          ]
        }
      ]
    },
    eforms: {
      category: 'eForms',
      endpoints: [
        {
          id: 'GetEFormTemplate',
          name: 'GetEFormTemplate',
          method: 'GET',
          path: '/GetEFormTemplate',
          description: 'Obtiene un template de eForm',
          params: [
            { name: 'EFormNo', type: 'string', required: true }
          ]
        },
        {
          id: 'SaveEForm',
          name: 'SaveEForm',
          method: 'POST',
          path: '/SaveEForm',
          description: 'Guarda un eForm',
          params: [
            { name: 'EFormNo', type: 'string', required: true },
            { name: 'FDef', type: 'object', required: true }
          ]
        }
      ]
    }
  }

  const treeData = Object.entries(API_ENDPOINTS).map(([key, category]) => ({
    title: category.category,
    key: key,
    children: category.endpoints.map(ep => ({
      title: `${ep.method} ${ep.path}`,
      key: ep.id,
      data: ep
    }))
  }))

  const selectEndpoint = (keys) => {
    if (keys.length === 0) return

    const key = keys[0]
    for (const category of Object.values(API_ENDPOINTS)) {
      const endpoint = category.endpoints.find(ep => ep.id === key)
      if (endpoint) {
        setSelectedEndpoint(endpoint)
        form.setFieldsValue({
          method: endpoint.method,
          path: endpoint.path
        })
        break
      }
    }
  }

  const executeRequest = async (values) => {
    setLoading(true)
    try {
      // Simular request
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-therefore-version': '2024.1'
        },
        data: {
          success: true,
          message: `Endpoint ${selectedEndpoint?.path} ejecutado correctamente`,
          data: {
            example: 'Respuesta simulada',
            timestamp: new Date().toISOString()
          }
        }
      }

      setResponse(mockResponse)
    } catch (error) {
      setResponse({
        status: 500,
        statusText: 'Error',
        data: { error: error.message }
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <ApiOutlined /> Explorador API REST Therefore™
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
          {/* Sidebar con endpoints */}
          <div style={{ border: '1px solid var(--border-default)', borderRadius: '4px', padding: '8px' }}>
            <h4 style={{ marginBottom: '12px' }}>Categorías</h4>
            <Tree
              treeData={treeData}
              onSelect={selectEndpoint}
              defaultExpandAll
              showIcon
            />
          </div>

          {/* Panel principal */}
          <div>
            {!selectedEndpoint ? (
              <Empty description="Selecciona un endpoint de la izquierda" />
            ) : (
              <Spin spinning={loading}>
                <Tabs items={[
                  {
                    key: 'details',
                    label: 'Detalles',
                    children: (
                      <div>
                        <h4 style={{ marginBottom: '12px' }}>{selectedEndpoint.name}</h4>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                          {selectedEndpoint.description}
                        </p>

                        <div style={{
                          background: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '4px',
                          marginBottom: '16px'
                        }}>
                          <Tag color={selectedEndpoint.method === 'GET' ? 'blue' : 'green'}>
                            {selectedEndpoint.method}
                          </Tag>
                          <code style={{ marginLeft: '8px' }}>{selectedEndpoint.path}</code>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(selectedEndpoint.path)}
                            style={{ marginLeft: '8px' }}
                          />
                        </div>

                        <h5>Parámetros</h5>
                        <Table
                          dataSource={selectedEndpoint.params}
                          columns={[
                            { title: 'Nombre', dataIndex: 'name', key: 'name' },
                            {
                              title: 'Tipo',
                              dataIndex: 'type',
                              key: 'type',
                              render: (type) => <Tag>{type}</Tag>
                            },
                            {
                              title: 'Requerido',
                              dataIndex: 'required',
                              key: 'required',
                              render: (required) =>
                                required ? <Tag color="red">Sí</Tag> : <Tag>No</Tag>
                            },
                            {
                              title: 'Ejemplo',
                              dataIndex: 'example',
                              key: 'example',
                              render: (example) => example ? <code>{example}</code> : '-'
                            }
                          ]}
                          pagination={false}
                          size="small"
                        />
                      </div>
                    )
                  },
                  {
                    key: 'test',
                    label: 'Probar Endpoint',
                    children: (
                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={executeRequest}
                      >
                        <Form.Item
                          label="Método"
                          name="method"
                        >
                          <Input disabled />
                        </Form.Item>

                        <Form.Item
                          label="Ruta"
                          name="path"
                        >
                          <Input disabled />
                        </Form.Item>

                        {selectedEndpoint.params.map(param => (
                          <Form.Item
                            key={param.name}
                            label={param.name}
                            name={param.name}
                            rules={param.required ? [{ required: true }] : []}
                          >
                            <Input placeholder={param.example} />
                          </Form.Item>
                        ))}

                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          htmlType="submit"
                          loading={loading}
                        >
                          Ejecutar Endpoint
                        </Button>
                      </Form>
                    )
                  },
                  {
                    key: 'response',
                    label: 'Respuesta',
                    children: response ? (
                      <div>
                        <div style={{
                          background: response.status === 200 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${response.status === 200 ? 'var(--accent-success)' : '#ef4444'}`,
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '12px'
                        }}>
                          <Tag color={response.status === 200 ? 'green' : 'red'}>
                            {response.status} {response.statusText}
                          </Tag>
                        </div>

                        <h5>Headers</h5>
                        <pre style={{
                          background: 'var(--bg-hover)',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          maxHeight: '150px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>

                        <h5 style={{ marginTop: '16px' }}>Body</h5>
                        <pre style={{
                          background: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          maxHeight: '300px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(response.data, null, 2)}
                        </pre>

                        <Button
                          type="default"
                          onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                          icon={<CopyOutlined />}
                          style={{ marginTop: '12px' }}
                        >
                          Copiar Respuesta
                        </Button>
                      </div>
                    ) : (
                      <Empty description="Ejecuta un endpoint para ver la respuesta" />
                    )
                  }
                ]} />
              </Spin>
            )}
          </div>
        </div>
    </div>
  )
}
