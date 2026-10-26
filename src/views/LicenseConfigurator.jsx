import { useState, useEffect } from 'react'
import { Table, Button, Input, InputNumber, Select, Card, Tabs, Space, Modal, Form, message as antMessage, Spin, Statistic, Row, Col, Tag } from 'antd'
import { PlusOutlined, SaveOutlined, DownloadOutlined, DeleteOutlined, HistoryOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import * as XLSX from 'xlsx'

const { TextArea } = Input
const { Option } = Select

export default function LicenseConfigurator() {
  const { user } = useAuth()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [edicion, setEdicion] = useState('onpremise') // onpremise, online, suscripcion
  const [items, setItems] = useState([]) // Catálogo de items
  const [selectedItems, setSelectedItems] = useState([]) // Items seleccionados con cantidades
  const [servicios, setServiciosState] = useState([])
  const [techPartners, setTechPartners] = useState([])

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [quotations, setQuotations] = useState([])

  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Servicios disponibles
  const serviciosDisponibles = [
    { descripcion: 'Consultoría', pvp_jornada: 880 },
    { descripcion: 'Implementación', pvp_jornada: 705 },
    { descripcion: 'Formación', pvp_jornada: 705 },
    { descripcion: 'Gestión Proyecto', pvp_jornada: 705 },
    { descripcion: 'Prueba de Concepto', pvp_jornada: 880 }
  ]

  // Cargar items del catálogo
  useEffect(() => {
    loadItems()
  }, [edicion])

  const loadItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('therefore_license_items')
        .select('*')
        .eq('edicion', edicion)
        .eq('activo', true)
        .order('descripcion')

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Error cargando items:', err)
      message.error('Error cargando catálogo')
    } finally {
      setLoading(false)
    }
  }

  const loadQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from('therefore_quotations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotations(data || [])
    } catch (err) {
      console.error('Error cargando cotizaciones:', err)
    }
  }

  const addItem = (item) => {
    const exists = selectedItems.find(i => i.codigo === item.codigo)
    if (exists) {
      setSelectedItems(selectedItems.map(i =>
        i.codigo === item.codigo
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      ))
    } else {
      setSelectedItems([...selectedItems, { ...item, cantidad: 1 }])
    }
    antMessage.success('Artículo agregado')
  }

  const updateQuantity = (codigo, cantidad) => {
    if (cantidad <= 0) {
      setSelectedItems(selectedItems.filter(i => i.codigo !== codigo))
    } else {
      setSelectedItems(selectedItems.map(i =>
        i.codigo === codigo ? { ...i, cantidad } : i
      ))
    }
  }

  const removeItem = (codigo) => {
    setSelectedItems(selectedItems.filter(i => i.codigo !== codigo))
  }

  const addServicio = () => {
    setServiciosState([...servicios, {
      id: Date.now(),
      descripcion: '',
      jornadas: 1,
      pvp_jornada: 0
    }])
  }

  const updateServicio = (id, field, value) => {
    setServiciosState(servicios.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const removeServicio = (id) => {
    setServiciosState(servicios.filter(s => s.id !== id))
  }

  // Cálculos
  const totalLicencias = selectedItems.reduce((sum, item) =>
    sum + (item.pvp * item.cantidad), 0
  )

  const totalCSS = selectedItems.reduce((sum, item) =>
    sum + (item.css_pvp * item.cantidad), 0
  )

  const totalServicios = servicios.reduce((sum, serv) =>
    sum + (serv.pvp_jornada * serv.jornadas), 0
  )

  const totalGeneral = totalLicencias + totalCSS + totalServicios

  // Guardar cotización
  const handleSave = async (values) => {
    try {
      setLoading(true)

      const quotation = {
        user_id: user.id,
        nombre: values.nombre,
        cliente: values.cliente,
        oportunidad: values.oportunidad,
        account_manager: values.account_manager,
        edicion,
        items: selectedItems,
        servicios,
        tech_partners: techPartners,
        total_licencias: totalLicencias,
        total_css: totalCSS,
        total_servicios: totalServicios,
        total_general: totalGeneral,
        notas: values.notas
      }

      const { error } = await supabase
        .from('therefore_quotations')
        .insert([quotation])

      if (error) throw error

      message.success('Cotización guardada')
      setSaveModalOpen(false)
      form.resetFields()
    } catch (err) {
      console.error('Error guardando:', err)
      message.error('Error al guardar cotización')
    } finally {
      setLoading(false)
    }
  }

  // Cargar cotización
  const loadQuotation = (quotation) => {
    setEdicion(quotation.edicion)
    setSelectedItems(quotation.items || [])
    setServiciosState(quotation.servicios || [])
    setTechPartners(quotation.tech_partners || [])
    setHistoryModalOpen(false)
    antMessage.success('Cotización cargada')
  }

  // Exportar a Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Hoja de items
    const itemsData = selectedItems.map(item => ({
      'Código': item.codigo,
      'Descripción': item.descripcion,
      'Cantidad': item.cantidad,
      'PVP': item.pvp,
      'CSS': item.css_pvp,
      'Subtotal Licencias': item.pvp * item.cantidad,
      'Subtotal CSS': item.css_pvp * item.cantidad
    }))

    const ws1 = XLSX.utils.json_to_sheet(itemsData)
    XLSX.utils.book_append_sheet(wb, ws1, 'Licencias')

    // Hoja de servicios
    if (servicios.length > 0) {
      const serviciosData = servicios.map(serv => ({
        'Servicio': serv.descripcion,
        'Jornadas': serv.jornadas,
        'PVP/Jornada': serv.pvp_jornada,
        'Subtotal': serv.jornadas * serv.pvp_jornada
      }))
      const ws2 = XLSX.utils.json_to_sheet(serviciosData)
      XLSX.utils.book_append_sheet(wb, ws2, 'Servicios')
    }

    // Hoja de resumen
    const resumenData = [
      { 'Concepto': 'Total Licencias', 'Importe': totalLicencias.toFixed(2) },
      { 'Concepto': 'Total CSS', 'Importe': totalCSS.toFixed(2) },
      { 'Concepto': 'Total Servicios', 'Importe': totalServicios.toFixed(2) },
      { 'Concepto': 'TOTAL GENERAL', 'Importe': totalGeneral.toFixed(2) }
    ]
    const ws3 = XLSX.utils.json_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(wb, ws3, 'Resumen')

    XLSX.writeFile(wb, `Therefore_Cotizacion_${edicion}_${new Date().toISOString().split('T')[0]}.xlsx`)
    antMessage.success('Excel exportado')
  }

  // Limpiar configuración
  const clearConfiguration = () => {
    Modal.confirm({
      title: '¿Limpiar configuración?',
      content: 'Se perderán todos los items y servicios seleccionados',
      onOk: () => {
        setSelectedItems([])
        setServiciosState([])
        setTechPartners([])
        antMessage.info('Configuración limpiada')
      }
    })
  }

  // Categorías únicas
  const categories = ['all', ...new Set(items.map(i => i.categoria || 'Sin categoría').filter(Boolean))]

  // Filtrar items
  const filteredItems = items.filter(item => {
    const matchSearch = !searchText ||
      item.descripcion?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(searchText.toLowerCase())

    const matchCategory = selectedCategory === 'all' ||
      (item.categoria || 'Sin categoría') === selectedCategory

    return matchSearch && matchCategory
  })

  const catalogColumns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true
    },
    {
      title: 'PVP',
      dataIndex: 'pvp',
      key: 'pvp',
      width: 100,
      align: 'right',
      render: (val) => `${val?.toFixed(2)}€`
    },
    {
      title: 'CSS',
      dataIndex: 'css_pvp',
      key: 'css_pvp',
      width: 100,
      align: 'right',
      render: (val) => `${val?.toFixed(2)}€`
    },
    ...(edicion === 'onpremise' ? [{
      title: 'Puntos',
      dataIndex: 'puntos',
      key: 'puntos',
      width: 80,
      align: 'center'
    }] : []),
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => addItem(record)}
        >
          Agregar
        </Button>
      )
    }
  ]

  const selectedColumns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion'
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 120,
      render: (val, record) => (
        <InputNumber
          min={0}
          value={val}
          onChange={(v) => updateQuantity(record.codigo, v)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'PVP Unit.',
      dataIndex: 'pvp',
      key: 'pvp',
      width: 100,
      align: 'right',
      render: (val) => `${val?.toFixed(2)}€`
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (_, record) => `${(record.pvp * record.cantidad).toFixed(2)}€`
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.codigo)}
        />
      )
    }
  ]

  return (
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* HEADER */}
      <div className="header-main">
        <div>
          <h1 className="header-title">💼 Configurador de Licencias Therefore™</h1>
          <p className="header-subtitle">Genera cotizaciones de licencias OnPremise, Online y Suscripción · Maestro de artículos · Export Excel</p>
        </div>
        <div className="header-actions">
          <HelpButton section="licenseConfigurator" />

          <Select
            value={edicion}
            onChange={setEdicion}
            style={{ width: 150 }}
          >
            <Option value="onpremise">OnPremise</Option>
            <Option value="online">Online</Option>
            <Option value="suscripcion">Suscripción</Option>
          </Select>

          <Button
            icon={<HistoryOutlined />}
            onClick={() => {
              loadQuotations()
              setHistoryModalOpen(true)
            }}
            className="btn-default"
          >
            Historial
          </Button>

          <Button
            icon={<SaveOutlined />}
            onClick={() => setSaveModalOpen(true)}
            disabled={selectedItems.length === 0}
            className="btn-default"
          >
            Guardar
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={exportToExcel}
            disabled={selectedItems.length === 0}
            className="btn-default"
          >
            Exportar Excel
          </Button>

          <Button
            danger
            onClick={clearConfiguration}
            disabled={selectedItems.length === 0}
            className="btn-default"
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: 'auto', paddingRight: '4px' }}>
        <Row gutter={16}>
          {/* Catálogo */}
          <Col span={14}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📦 Catálogo de Artículos</span>
                  <Tag color="blue">{edicion.toUpperCase()}</Tag>
                </div>
              }
              size="small"
            >
              <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
                <Input.Search
                  placeholder="Buscar por código o descripción..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: '100%' }}
                >
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>
                      {cat === 'all' ? 'Todas las categorías' : cat}
                    </Option>
                  ))}
                </Select>
              </Space>

              <Table
                dataSource={filteredItems}
                columns={catalogColumns}
                rowKey="codigo"
                size="small"
                pagination={{ pageSize: 10 }}
                loading={loading}
                scroll={{ y: 400 }}
              />
            </Card>
          </Col>

          {/* Configuración */}
          <Col span={10}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><ShoppingCartOutlined /> Configuración</span>
                  <Tag color="green">{selectedItems.length} items</Tag>
                </div>
              }
              size="small"
            >
              <Table
                dataSource={selectedItems}
                columns={selectedColumns}
                rowKey="codigo"
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={4} align="right">
                        <strong>Total Licencias:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong>{totalLicencias.toFixed(2)}€</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell />
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={4} align="right">
                        <strong>Total CSS:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong>{totalCSS.toFixed(2)}€</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />

              <div style={{ marginTop: 16 }}>
                <Row gutter={8}>
                  <Col span={8}>
                    <Statistic title="Licencias" value={totalLicencias} precision={2} suffix="€" />
                  </Col>
                  <Col span={8}>
                    <Statistic title="CSS" value={totalCSS} precision={2} suffix="€" />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="TOTAL"
                      value={totalGeneral}
                      precision={2}
                      suffix="€"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Modal Guardar */}
      <Modal
        title="Guardar Cotización"
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input placeholder="Ej: Cotización Banco XX - OnPremise" />
          </Form.Item>
          <Form.Item name="cliente" label="Cliente">
            <Input placeholder="Nombre del cliente" />
          </Form.Item>
          <Form.Item name="oportunidad" label="Oportunidad SFDC">
            <Input placeholder="OPP-12345" />
          </Form.Item>
          <Form.Item name="account_manager" label="Account Manager">
            <Input placeholder="Nombre del AM" />
          </Form.Item>
          <Form.Item name="notas" label="Notas">
            <TextArea rows={3} placeholder="Notas adicionales..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Historial */}
      <Modal
        title="Historial de Cotizaciones"
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={quotations}
          rowKey="id"
          size="small"
          columns={[
            {
              title: 'Nombre',
              dataIndex: 'nombre',
              key: 'nombre'
            },
            {
              title: 'Cliente',
              dataIndex: 'cliente',
              key: 'cliente'
            },
            {
              title: 'Edición',
              dataIndex: 'edicion',
              key: 'edicion',
              render: (val) => <Tag>{val.toUpperCase()}</Tag>
            },
            {
              title: 'Total',
              dataIndex: 'total_general',
              key: 'total',
              render: (val) => `${val?.toFixed(2)}€`
            },
            {
              title: 'Fecha',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (val) => new Date(val).toLocaleDateString()
            },
            {
              title: '',
              key: 'action',
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={() => loadQuotation(record)}
                >
                  Cargar
                </Button>
              )
            }
          ]}
        />
      </Modal>
    </div>
  )
}
