import { useState, useEffect } from 'react'
import { Table, Button, Input, InputNumber, Select, Card, Drawer, Space, Modal, Form, message as antMessage, Divider, Typography, Statistic, Row, Col, Tag } from 'antd'
import { PlusOutlined, SaveOutlined, DownloadOutlined, DeleteOutlined, HistoryOutlined, ShoppingCartOutlined, AppstoreOutlined } from '@ant-design/icons'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import * as XLSX from 'xlsx'

const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography

export default function LicenseConfigurator() {
  const { user } = useAuth()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [edicion, setEdicion] = useState('onpremise') // onpremise, online, suscripcion

  // Datos de cabecera
  const [sfdcOpp, setSfdcOpp] = useState('')
  const [dealSupport, setDealSupport] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [accountManager, setAccountManager] = useState('')
  const [cliente, setCliente] = useState('')

  // Catálogo y selección
  const [items, setItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [catalogDrawerOpen, setCatalogDrawerOpen] = useState(false)

  // Tech Partners
  const [techPartners, setTechPartners] = useState([
    { nombre: 'Docuten', importe: 0 },
    { nombre: 'IO Digital X', importe: 0 },
    { nombre: 'Ivnosys', importe: 0 },
    { nombre: 'Doceo Software', importe: 0 },
    { nombre: 'Otros', importe: 0 }
  ])

  // Servicios
  const [servicios, setServicios] = useState([])

  // Suscripción (solo para edicion=suscripcion)
  const [cuotaAnual, setCuotaAnual] = useState(0)
  const [anosContrato, setAnosContrato] = useState(1)
  const [soporteLocal, setSoporteLocal] = useState(0)

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [quotations, setQuotations] = useState([])

  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCatalogItems, setSelectedCatalogItems] = useState([])

  const [serviciosModalOpen, setServiciosModalOpen] = useState(false)
  const [techPartnersModalOpen, setTechPartnersModalOpen] = useState(false)
  const [selectedServicios, setSelectedServicios] = useState([])
  const [tempTechPartners, setTempTechPartners] = useState([])

  // Servicios predefinidos
  const serviciosDisponibles = [
    { codigo: '739ZZ051', descripcion: 'Consultoría', pvp_jornada: 880 },
    { codigo: '739ZZ049', descripcion: 'Implementación', pvp_jornada: 705 },
    { codigo: '739ZZ048', descripcion: 'Formación', pvp_jornada: 705 },
    { codigo: '739ZZ047', descripcion: 'Oficina de Proyecto', pvp_jornada: 705 },
    { codigo: '739ZZ052', descripcion: 'Prueba de Concepto', pvp_jornada: 880 }
  ]

  // Tech Partners disponibles
  const techPartnersDisponibles = [
    { nombre: 'Docuten', descripcion: 'Firma electrónica y gestión documental' },
    { nombre: 'IO Digital X', descripcion: 'Transformación digital' },
    { nombre: 'Ivnosys', descripcion: 'Notificaciones electrónicas' },
    { nombre: 'Doceo Software', descripcion: 'Soluciones documentales' },
    { nombre: 'DOCAI', descripcion: 'IA para clasificación y extracción' },
    { nombre: 'IvSign', descripcion: 'Firma digital avanzada' },
    { nombre: 'Salesforce', descripcion: 'CRM' },
    { nombre: 'Microsoft', descripcion: 'Azure / M365' },
    { nombre: 'Otro', descripcion: 'Partner personalizado' }
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

  const addMultipleItems = () => {
    if (selectedCatalogItems.length === 0) {
      antMessage.warning('Selecciona al menos un artículo')
      return
    }

    let added = 0
    const newItems = [...selectedItems]

    selectedCatalogItems.forEach(codigo => {
      const item = items.find(i => i.codigo === codigo)
      if (item) {
        const exists = newItems.find(i => i.codigo === item.codigo)
        if (!exists) {
          newItems.push({ ...item, cantidad: 1 })
          added++
        }
      }
    })

    setSelectedItems(newItems)
    setSelectedCatalogItems([])
    antMessage.success(`${added} artículos agregados`)
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

  const addMultipleServicios = () => {
    if (selectedServicios.length === 0) {
      antMessage.warning('Selecciona al menos un servicio')
      return
    }

    const newServicios = [...servicios]
    selectedServicios.forEach(codigo => {
      const servicio = serviciosDisponibles.find(s => s.codigo === codigo)
      if (servicio) {
        newServicios.push({
          id: Date.now() + Math.random(),
          codigo: servicio.codigo,
          descripcion: servicio.descripcion,
          unidades: 1,
          pvp_jornada: servicio.pvp_jornada
        })
      }
    })

    setServicios(newServicios)
    setSelectedServicios([])
    setServiciosModalOpen(false)
    antMessage.success(`${selectedServicios.length} servicios agregados`)
  }

  const openTechPartnersModal = () => {
    // Inicializar tech partners temporales con los disponibles
    const temp = techPartnersDisponibles.map(tp => ({
      nombre: tp.nombre,
      descripcion: tp.descripcion,
      importe: 0,
      seleccionado: false
    }))
    setTempTechPartners(temp)
    setTechPartnersModalOpen(true)
  }

  const updateTempPartnerImporte = (nombre, importe) => {
    setTempTechPartners(tempTechPartners.map(tp =>
      tp.nombre === nombre ? { ...tp, importe: parseFloat(importe) || 0, seleccionado: importe > 0 } : tp
    ))
  }

  const saveTechPartners = () => {
    const selected = tempTechPartners.filter(tp => tp.seleccionado && tp.importe > 0)
    if (selected.length === 0) {
      antMessage.warning('Ingresa al menos un importe')
      return
    }

    const newPartners = [...techPartners]
    selected.forEach(tp => {
      const exists = newPartners.find(p => p.nombre === tp.nombre)
      if (exists) {
        exists.importe = tp.importe
      } else {
        newPartners.push({ nombre: tp.nombre, importe: tp.importe })
      }
    })

    setTechPartners(newPartners)
    setTechPartnersModalOpen(false)
    antMessage.success(`${selected.length} tech partners agregados`)
  }

  const updateServicio = (id, field, value) => {
    setServicios(servicios.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const removeServicio = (id) => {
    setServicios(servicios.filter(s => s.id !== id))
  }

  const updateTechPartner = (index, importe) => {
    const updated = [...techPartners]
    updated[index].importe = parseFloat(importe) || 0
    setTechPartners(updated)
  }

  // Cálculos
  const totalLicencias = selectedItems.reduce((sum, item) =>
    sum + (item.pvp * item.cantidad), 0
  )

  const totalCSS = selectedItems.reduce((sum, item) =>
    sum + ((item.css_pvp || 0) * item.cantidad), 0
  )

  const totalServicios = servicios.reduce((sum, serv) =>
    sum + (serv.pvp_jornada * serv.unidades), 0
  )

  const totalTechPartners = techPartners.reduce((sum, tp) =>
    sum + (tp.importe || 0), 0
  )

  const totalTherefore = totalLicencias + totalCSS
  const totalContractValue = totalTherefore + totalServicios + totalTechPartners

  // Guardar cotización
  const handleSave = async (values) => {
    try {
      setLoading(true)

      const quotation = {
        user_id: user.id,
        nombre: values.nombre,
        cliente,
        oportunidad: sfdcOpp,
        account_manager: accountManager,
        edicion,
        items: selectedItems,
        servicios,
        tech_partners: techPartners,
        total_licencias: totalLicencias,
        total_css: totalCSS,
        total_servicios: totalServicios,
        total_general: totalContractValue,
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
    setSfdcOpp(quotation.oportunidad || '')
    setCliente(quotation.cliente || '')
    setAccountManager(quotation.account_manager || '')
    setSelectedItems(quotation.items || [])
    setServicios(quotation.servicios || [])
    setTechPartners(quotation.tech_partners || techPartners)
    setHistoryModalOpen(false)
    antMessage.success('Cotización cargada')
  }

  // Exportar a Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Hoja principal con formato similar al Excel
    const wsData = [
      ['', `Configurador Therefore™ ${edicion === 'onpremise' ? 'On Premise' : edicion === 'online' ? 'Online' : 'Suscripción'}`],
      [],
      ['', 'SFDC OPP', sfdcOpp, 'DEAL SUPPORT', dealSupport, 'FECHA', fecha],
      ['', 'A.M.', accountManager],
      ['', 'CLIENTE', cliente],
      [],
      ['', 'TECH PARTNERS', '', 'Importe Total'],
      ...techPartners.map(tp => ['', tp.nombre, '', tp.importe.toFixed(2)]),
      ['', 'TOTAL TECH PARTNERS', '', totalTechPartners.toFixed(2)],
      [],
      ['', 'SERVICIOS', '', 'Unidades', 'Importe Total'],
      ...servicios.map(s => ['', s.descripcion, '', s.unidades, (s.pvp_jornada * s.unidades).toFixed(2)]),
      ['', 'TOTAL SERVICIOS', '', '', totalServicios.toFixed(2)],
      [],
      ['', 'RESUMEN', '', 'Importe Total'],
      ['', 'Tech Partners', '', totalTechPartners.toFixed(2)],
      ['', 'Servicios', '', totalServicios.toFixed(2)],
      ['', 'Total Therefore', '', totalTherefore.toFixed(2)],
      ['', 'TOTAL CONTRACT VALUE', '', totalContractValue.toFixed(2)],
      [],
      ['', 'DETALLE SOLUCIONES | PRODUCTO'],
      ['', 'Clase', 'Código', 'Concepto', 'Unidad', 'PVP', 'PVP Total', 'CSS', 'CSS Total'],
      ...selectedItems.map(item => [
        '',
        item.clase,
        item.codigo,
        item.descripcion,
        item.cantidad,
        item.pvp.toFixed(2),
        (item.pvp * item.cantidad).toFixed(2),
        (item.css_pvp || 0).toFixed(2),
        ((item.css_pvp || 0) * item.cantidad).toFixed(2)
      ])
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Cotización')

    XLSX.writeFile(wb, `Therefore_${edicion}_${sfdcOpp || 'Cotizacion'}_${fecha}.xlsx`)
    antMessage.success('Excel exportado')
  }

  // Limpiar
  const clearConfiguration = () => {
    Modal.confirm({
      title: '¿Limpiar configuración?',
      content: 'Se perderán todos los datos ingresados',
      onOk: () => {
        setSelectedItems([])
        setServicios([])
        setTechPartners([
          { nombre: 'Docuten', importe: 0 },
          { nombre: 'IO Digital X', importe: 0 },
          { nombre: 'Ivnosys', importe: 0 },
          { nombre: 'Doceo Software', importe: 0 },
          { nombre: 'Otros', importe: 0 }
        ])
        setSfdcOpp('')
        setDealSupport('')
        setCliente('')
        setAccountManager('')
        antMessage.info('Configuración limpiada')
      }
    })
  }

  // Categorías
  const categories = ['all', ...new Set(items.map(i => i.categoria || 'Sin categoría').filter(Boolean))]

  // Filtrar items del catálogo
  const filteredItems = items.filter(item => {
    const matchSearch = !searchText ||
      item.descripcion?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(searchText.toLowerCase())

    const matchCategory = selectedCategory === 'all' ||
      (item.categoria || 'Sin categoría') === selectedCategory

    return matchSearch && matchCategory
  })

  return (
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* HEADER */}
      <div className="header-main">
        <div>
          <h1 className="header-title">💼 Configurador de Licencias Therefore™</h1>
          <p className="header-subtitle">Genera cotizaciones OnPremise, Online y Suscripción · Layout optimizado · Export XLSX</p>
        </div>
        <div className="header-actions">
          <HelpButton section="licenseConfigurator" />

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
            Excel
          </Button>

          <Button
            danger
            onClick={clearConfiguration}
            className="btn-default"
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>

        {/* FILA 1: DATOS GENERALES + RESUMEN */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {/* Datos Generales */}
          <Col span={16}>
            <Card size="small" title="Datos Generales de la Oferta">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div>
                    <Text strong>SFDC OPP</Text>
                    <Input
                      value={sfdcOpp}
                      onChange={(e) => setSfdcOpp(e.target.value)}
                      placeholder="OPP-XXXXX"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text strong>Deal Support</Text>
                    <Input
                      value={dealSupport}
                      onChange={(e) => setDealSupport(e.target.value)}
                      placeholder="Nombre"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text strong>Fecha</Text>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>Account Manager</Text>
                    <Input
                      value={accountManager}
                      onChange={(e) => setAccountManager(e.target.value)}
                      placeholder="Nombre del AM"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>Cliente</Text>
                    <Input
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      placeholder="Nombre del cliente"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Resumen */}
          <Col span={8}>
            <Card size="small" title="Resumen">
              <Statistic
                title="Total Licencias"
                value={totalLicencias}
                precision={2}
                suffix="€"
                valueStyle={{ fontSize: 16 }}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Statistic
                title="Total CSS"
                value={totalCSS}
                precision={2}
                suffix="€"
                valueStyle={{ fontSize: 16 }}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Statistic
                title="Total Servicios"
                value={totalServicios}
                precision={2}
                suffix="€"
                valueStyle={{ fontSize: 16 }}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Statistic
                title="Tech Partners"
                value={totalTechPartners}
                precision={2}
                suffix="€"
                valueStyle={{ fontSize: 16 }}
              />
              <Divider style={{ margin: '12px 0' }} />
              <Statistic
                title="TOTAL"
                value={totalContractValue}
                precision={2}
                suffix="€"
                valueStyle={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* FILA 2: TABLA LICENCIAS */}
        <Card
          size="small"
          title="Licencias"
          extra={
            <Space>
              <Select
                value={edicion}
                onChange={setEdicion}
                style={{ width: 140 }}
                size="small"
              >
                <Option value="onpremise">OnPremise</Option>
                <Option value="online">Online</Option>
                <Option value="suscripcion">Suscripción</Option>
              </Select>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setCatalogDrawerOpen(true)}
              >
                Agregar productos
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={selectedItems}
            rowKey="codigo"
            size="small"
            pagination={false}
            scroll={{ y: 250 }}
            columns={[
              {
                title: 'Clase',
                dataIndex: 'clase',
                width: 100
              },
              {
                title: 'Código',
                dataIndex: 'codigo',
                width: 120,
                render: (text) => <Text style={{ fontFamily: 'monospace' }}>{text}</Text>
              },
              {
                title: 'Concepto',
                dataIndex: 'descripcion',
                ellipsis: true
              },
              {
                title: 'Unidad',
                dataIndex: 'cantidad',
                width: 90,
                align: 'center',
                render: (val, record) => (
                  <InputNumber
                    min={0}
                    value={val}
                    onChange={(v) => updateQuantity(record.codigo, v)}
                    size="small"
                    style={{ width: 70 }}
                  />
                )
              },
              {
                title: 'PVP',
                dataIndex: 'pvp',
                width: 100,
                align: 'right',
                render: (val) => `${val?.toFixed(2)} €`
              },
              {
                title: 'PVP Total',
                key: 'pvp_total',
                width: 110,
                align: 'right',
                render: (_, record) => `${(record.pvp * record.cantidad).toFixed(2)} €`
              },
              {
                title: 'CSS',
                dataIndex: 'css_pvp',
                width: 100,
                align: 'right',
                render: (val) => `${(val || 0).toFixed(2)} €`
              },
              {
                title: 'CSS Total',
                key: 'css_total',
                width: 110,
                align: 'right',
                render: (_, record) => `${((record.css_pvp || 0) * record.cantidad).toFixed(2)} €`
              },
              {
                title: '',
                key: 'action',
                width: 50,
                render: (_, record) => (
                  <Button
                    danger
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.codigo)}
                  />
                )
              }
            ]}
          />
          {selectedItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">No hay productos. Click en "Agregar productos" para añadir.</Text>
            </div>
          )}
        </Card>

        {/* FILA 3: SERVICIOS + TECH PARTNERS */}
        <Row gutter={16}>
          {/* Servicios */}
          <Col span={12}>
            <Card
              size="small"
              title="Servicios"
              extra={
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setServiciosModalOpen(true)}
                >
                  Agregar servicios
                </Button>
              }
            >
              <Table
                dataSource={servicios}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 200 }}
                columns={[
                  {
                    title: 'Código',
                    dataIndex: 'codigo',
                    width: 90,
                    render: (text) => <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>{text}</Text>
                  },
                  {
                    title: 'Descripción',
                    dataIndex: 'descripcion'
                  },
                  {
                    title: 'Unidades',
                    dataIndex: 'unidades',
                    width: 80,
                    align: 'center',
                    render: (val, record) => (
                      <InputNumber
                        min={0}
                        value={val}
                        onChange={(v) => updateServicio(record.id, 'unidades', v)}
                        size="small"
                        style={{ width: 60 }}
                      />
                    )
                  },
                  {
                    title: 'Total',
                    key: 'total',
                    width: 100,
                    align: 'right',
                    render: (_, record) => `${(record.pvp_jornada * record.unidades).toFixed(2)} €`
                  },
                  {
                    title: '',
                    key: 'action',
                    width: 50,
                    render: (_, record) => (
                      <Button
                        danger
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeServicio(record.id)}
                      />
                    )
                  }
                ]}
              />
              {servicios.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Sin servicios</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Tech Partners */}
          <Col span={12}>
            <Card
              size="small"
              title="Tech Partners"
              extra={
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={openTechPartnersModal}
                >
                  Agregar partner
                </Button>
              }
            >
              <Table
                dataSource={techPartners.filter(tp => tp.importe > 0)}
                rowKey="nombre"
                size="small"
                pagination={false}
                scroll={{ y: 200 }}
                columns={[
                  {
                    title: 'Partner',
                    dataIndex: 'nombre'
                  },
                  {
                    title: 'Importe',
                    dataIndex: 'importe',
                    width: 150,
                    align: 'right',
                    render: (val, record, index) => (
                      <InputNumber
                        value={val}
                        onChange={(v) => {
                          const idx = techPartners.findIndex(tp => tp.nombre === record.nombre)
                          updateTechPartner(idx, v)
                        }}
                        precision={2}
                        size="small"
                        style={{ width: 130 }}
                        suffix="€"
                        min={0}
                      />
                    )
                  },
                  {
                    title: '',
                    key: 'action',
                    width: 50,
                    render: (_, record) => (
                      <Button
                        danger
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          const idx = techPartners.findIndex(tp => tp.nombre === record.nombre)
                          updateTechPartner(idx, 0)
                        }}
                      />
                    )
                  }
                ]}
              />
              {techPartners.filter(tp => tp.importe > 0).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Sin tech partners</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* DRAWER CATÁLOGO */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginRight: 24 }}>
            <span>Catálogo de Artículos</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addMultipleItems}
              disabled={selectedCatalogItems.length === 0}
            >
              Agregar seleccionados ({selectedCatalogItems.length})
            </Button>
          </div>
        }
        placement="right"
        width={900}
        open={catalogDrawerOpen}
        onClose={() => {
          setCatalogDrawerOpen(false)
          setSelectedCatalogItems([])
        }}
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
          rowSelection={{
            selectedRowKeys: selectedCatalogItems,
            onChange: (selectedRowKeys) => setSelectedCatalogItems(selectedRowKeys)
          }}
          dataSource={filteredItems}
          rowKey="codigo"
          size="small"
          pagination={{ pageSize: 20 }}
          loading={loading}
          scroll={{ y: 600 }}
          columns={[
            {
              title: 'Código',
              dataIndex: 'codigo',
              width: 120,
              render: (text) => <Text style={{ fontFamily: 'monospace' }}>{text}</Text>
            },
            {
              title: 'Descripción',
              dataIndex: 'descripcion',
              ellipsis: true
            },
            {
              title: 'PVP',
              dataIndex: 'pvp',
              width: 100,
              align: 'right',
              render: (val) => `${val?.toFixed(2)}€`
            },
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
          ]}
        />
      </Drawer>

      {/* Modal Servicios */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginRight: 40 }}>
            <span>Catálogo de Servicios</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addMultipleServicios}
              disabled={selectedServicios.length === 0}
            >
              Agregar seleccionados ({selectedServicios.length})
            </Button>
          </div>
        }
        open={serviciosModalOpen}
        onCancel={() => {
          setServiciosModalOpen(false)
          setSelectedServicios([])
        }}
        footer={null}
        width={700}
      >
        <Table
          dataSource={serviciosDisponibles}
          rowKey="codigo"
          size="small"
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedServicios,
            onChange: (selectedRowKeys) => setSelectedServicios(selectedRowKeys)
          }}
          columns={[
            {
              title: 'Código',
              dataIndex: 'codigo',
              width: 100,
              render: (text) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</Text>
            },
            {
              title: 'Descripción',
              dataIndex: 'descripcion'
            },
            {
              title: 'Precio/Jornada',
              dataIndex: 'pvp_jornada',
              width: 120,
              align: 'right',
              render: (val) => `${val.toFixed(2)} €`
            }
          ]}
        />
      </Modal>

      {/* Modal Tech Partners */}
      <Modal
        title="Catálogo de Tech Partners"
        open={techPartnersModalOpen}
        onCancel={() => setTechPartnersModalOpen(false)}
        onOk={saveTechPartners}
        okText="Agregar seleccionados"
        cancelText="Cancelar"
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Ingresa el importe para los tech partners que desees agregar:</Text>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {tempTechPartners.map((tp, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <Text strong>{tp.nombre}</Text>
                </Col>
                <Col span={10}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{tp.descripcion}</Text>
                </Col>
                <Col span={6}>
                  <InputNumber
                    placeholder="Importe"
                    value={tp.importe}
                    onChange={(val) => updateTempPartnerImporte(tp.nombre, val)}
                    precision={2}
                    style={{ width: '100%' }}
                    suffix="€"
                    min={0}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Modal>

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
        width={900}
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
              title: 'OPP',
              dataIndex: 'oportunidad',
              key: 'oportunidad'
            },
            {
              title: 'Edición',
              dataIndex: 'edicion',
              key: 'edicion',
              render: (val) => <Tag>{val?.toUpperCase()}</Tag>
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
