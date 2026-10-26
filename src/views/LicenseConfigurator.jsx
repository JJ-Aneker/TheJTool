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

  // Servicios predefinidos
  const serviciosDisponibles = [
    { codigo: '739ZZ051', descripcion: 'Consultoría', pvp_jornada: 880 },
    { codigo: '739ZZ049', descripcion: 'Implementación', pvp_jornada: 705 },
    { codigo: '739ZZ048', descripcion: 'Formación', pvp_jornada: 705 },
    { codigo: '739ZZ047', descripcion: 'Oficina de Proyecto', pvp_jornada: 705 },
    { codigo: '739ZZ052', descripcion: 'Prueba de Concepto', pvp_jornada: 880 }
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

  const addServicioFromCatalog = (servicio) => {
    setServicios([...servicios, {
      id: Date.now(),
      codigo: servicio.codigo,
      descripcion: servicio.descripcion,
      unidades: 1,
      pvp_jornada: servicio.pvp_jornada
    }])
    antMessage.success('Servicio agregado')
  }

  const addTechPartnerCustom = (nombre) => {
    if (!nombre || nombre.trim() === '') {
      antMessage.warning('Ingresa un nombre')
      return
    }

    const exists = techPartners.find(tp => tp.nombre.toLowerCase() === nombre.toLowerCase())
    if (exists) {
      antMessage.warning('Ya existe ese partner')
      return
    }

    setTechPartners([...techPartners, { nombre: nombre.trim(), importe: 0 }])
    antMessage.success('Tech Partner agregado')
    setTechPartnersModalOpen(false)
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
          <p className="header-subtitle">Genera cotizaciones OnPremise, Online y Suscripción · Layout tipo Excel · Export XLSX</p>
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

      {/* CONTENT - Estilo Excel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', backgroundColor: '#fff' }}>

        {/* CABECERA - Datos del proyecto */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ marginBottom: 8 }}>
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
              <div style={{ marginBottom: 8 }}>
                <Text strong>DEAL SUPPORT</Text>
                <Input
                  value={dealSupport}
                  onChange={(e) => setDealSupport(e.target.value)}
                  placeholder="Nombre"
                  style={{ marginTop: 4 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>FECHA</Text>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <div>
                <Text strong>A.M.</Text>
                <Input
                  value={accountManager}
                  onChange={(e) => setAccountManager(e.target.value)}
                  placeholder="Account Manager"
                  style={{ marginTop: 4 }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong>CLIENTE</Text>
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

        {/* DOS COLUMNAS: Tech Partners + Servicios */}
        <Row gutter={16} style={{ marginBottom: 16 }}>

          {/* COLUMNA IZQUIERDA: Tech Partners + Resumen */}
          <Col span={12}>

            {/* Tech Partners */}
            <Card
              title={<Text strong style={{ color: '#c00' }}>TECH PARTNERS</Text>}
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Button size="small" icon={<PlusOutlined />} onClick={() => setTechPartnersModalOpen(true)}>
                  Agregar partner
                </Button>
              }
            >
              {techPartners.map((tp, index) => (
                <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Text>{tp.nombre}</Text>
                  </Col>
                  <Col span={12}>
                    <InputNumber
                      value={tp.importe}
                      onChange={(val) => updateTechPartner(index, val)}
                      precision={2}
                      style={{ width: '100%' }}
                      prefix="€"
                    />
                  </Col>
                </Row>
              ))}
              <Divider style={{ margin: '8px 0' }} />
              <Row>
                <Col span={12}>
                  <Text strong>TOTAL TECH PARTNERS</Text>
                </Col>
                <Col span={12}>
                  <Text strong style={{ color: '#c00' }}>{totalTechPartners.toFixed(2)} €</Text>
                </Col>
              </Row>
            </Card>

            {/* Resumen */}
            <Card
              title={<Text strong style={{ color: '#c00' }}>RESUMEN</Text>}
              size="small"
            >
              <Row style={{ marginBottom: 4 }}>
                <Col span={16}><Text>Tech Partners</Text></Col>
                <Col span={8} style={{ textAlign: 'right' }}><Text>{totalTechPartners.toFixed(2)} €</Text></Col>
              </Row>
              <Row style={{ marginBottom: 4 }}>
                <Col span={16}><Text>Servicios</Text></Col>
                <Col span={8} style={{ textAlign: 'right' }}><Text>{totalServicios.toFixed(2)} €</Text></Col>
              </Row>
              <Row style={{ marginBottom: 4 }}>
                <Col span={16}><Text>Total Therefore {edicion}</Text></Col>
                <Col span={8} style={{ textAlign: 'right' }}><Text>{totalTherefore.toFixed(2)} €</Text></Col>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row>
                <Col span={16}><Text strong style={{ color: '#c00' }}>TOTAL CONTRACT VALUE</Text></Col>
                <Col span={8} style={{ textAlign: 'right' }}><Text strong style={{ color: '#c00', fontSize: 16 }}>{totalContractValue.toFixed(2)} €</Text></Col>
              </Row>
            </Card>
          </Col>

          {/* COLUMNA DERECHA: Servicios */}
          <Col span={12}>
            <Card
              title={<Text strong style={{ color: '#c00' }}>SERVICIOS</Text>}
              size="small"
              extra={
                <Button size="small" icon={<PlusOutlined />} onClick={() => setServiciosModalOpen(true)}>
                  Agregar servicio
                </Button>
              }
            >
              {servicios.length === 0 ? (
                <Text type="secondary">No hay servicios agregados</Text>
              ) : (
                servicios.map(serv => (
                  <Row key={serv.id} gutter={8} style={{ marginBottom: 8 }}>
                    <Col span={1}>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeServicio(serv.id)}
                      />
                    </Col>
                    <Col span={5}>
                      <Input
                        placeholder="Código"
                        value={serv.codigo}
                        onChange={(e) => updateServicio(serv.id, 'codigo', e.target.value)}
                        size="small"
                      />
                    </Col>
                    <Col span={9}>
                      <Select
                        placeholder="Servicio"
                        value={serv.descripcion}
                        onChange={(val) => {
                          const selected = serviciosDisponibles.find(s => s.descripcion === val)
                          updateServicio(serv.id, 'descripcion', val)
                          updateServicio(serv.id, 'codigo', selected?.codigo || '')
                          updateServicio(serv.id, 'pvp_jornada', selected?.pvp_jornada || 0)
                        }}
                        size="small"
                        style={{ width: '100%' }}
                      >
                        {serviciosDisponibles.map(s => (
                          <Option key={s.codigo} value={s.descripcion}>{s.descripcion}</Option>
                        ))}
                      </Select>
                    </Col>
                    <Col span={4}>
                      <InputNumber
                        placeholder="Unid."
                        value={serv.unidades}
                        onChange={(val) => updateServicio(serv.id, 'unidades', val)}
                        min={0}
                        size="small"
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={5}>
                      <Text>{(serv.pvp_jornada * serv.unidades).toFixed(2)} €</Text>
                    </Col>
                  </Row>
                ))
              )}

              {servicios.length > 0 && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Row>
                    <Col span={19}><Text strong>TOTAL SERVICIOS</Text></Col>
                    <Col span={5}><Text strong style={{ color: '#c00' }}>{totalServicios.toFixed(2)} €</Text></Col>
                  </Row>
                </>
              )}
            </Card>
          </Col>
        </Row>

        {/* TABLA DETALLE SOLUCIONES */}
        <Card
          title={<Text strong style={{ color: '#c00' }}>DETALLE SOLUCIONES | PRODUCTO</Text>}
          size="small"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCatalogDrawerOpen(true)}
            >
              Agregar productos
            </Button>
          }
        >
          <Table
            dataSource={selectedItems}
            rowKey="codigo"
            size="small"
            pagination={false}
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
                width: 80,
                align: 'center',
                render: (val, record) => (
                  <InputNumber
                    min={0}
                    value={val}
                    onChange={(v) => updateQuantity(record.codigo, v)}
                    size="small"
                    style={{ width: 60 }}
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
                width: 100,
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
                width: 100,
                align: 'right',
                render: (_, record) => `${((record.css_pvp || 0) * record.cantidad).toFixed(2)} €`
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
            ]}
          />

          {selectedItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">No hay productos seleccionados. Abrir catálogo para agregar.</Text>
            </div>
          )}
        </Card>
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
        title="Catálogo de Servicios"
        open={serviciosModalOpen}
        onCancel={() => setServiciosModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          {serviciosDisponibles.map((serv, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12 }}
              hoverable
            >
              <Row gutter={16} align="middle">
                <Col span={4}>
                  <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {serv.codigo}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>{serv.descripcion}</Text>
                </Col>
                <Col span={5} style={{ textAlign: 'right' }}>
                  <Text>{serv.pvp_jornada.toFixed(2)} €/jornada</Text>
                </Col>
                <Col span={3} style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      addServicioFromCatalog(serv)
                      setServiciosModalOpen(false)
                    }}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Modal Tech Partners */}
      <Modal
        title="Agregar Tech Partner"
        open={techPartnersModalOpen}
        onCancel={() => setTechPartnersModalOpen(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginTop: 16 }}>
          <Text>Ingresa el nombre del Tech Partner:</Text>
          <Input
            placeholder="Ej: Salesforce, Microsoft, etc."
            style={{ marginTop: 8, marginBottom: 16 }}
            onPressEnter={(e) => addTechPartnerCustom(e.target.value)}
            autoFocus
          />

          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Partners existentes: {techPartners.map(tp => tp.nombre).join(', ')}
            </Text>
          </div>
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
