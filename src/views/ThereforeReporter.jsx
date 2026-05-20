import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Spin, Popconfirm, Tooltip, Card, Empty, Tree } from 'antd'
import { ThunderboltOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { thereforeService } from '../services/thereforeService'
import '../styles/therefore-reporter.css'
import '../styles/therefore-reporter-panels.css'

export default function ThereforeReporter() {
  const { user } = useAuth()
  const [view, setView] = useState('home') // home, editor, results
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [tenants, setTenants] = useState([])

  // Editor state
  const [editorState, setEditorState] = useState({
    profileId: null,
    nombre: '',
    tenantId: '',
    connected: false,
    connectionHeaders: null,
    connectionBaseUrl: '',
    catTree: [],
    selectedCatNos: new Set(),
    catNames: {},
    catFieldOrder: {},
    captionMap: {},
    allCommonFields: [],
    selectedFields: new Set(['DocNo']),
    groupFields: new Set(),
  })

  // Results state
  const [resultsState, setResultsState] = useState({
    profile: null,
    dateField: '',
    dateFrom: '',
    dateTo: '',
    loading: false,
    progress: { pct: 0, label: '' },
    rows: [],
    canonicalFields: [],
    catNames: {},
    captionMap: {},
    showDetail: false,
    error: null,
  })

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadTenants()
      loadProfiles()
    }
  }, [user])

  // Load category fields when connected and categories change
  useEffect(() => {
    if (editorState.connected && editorState.selectedCatNos.size > 0) {
      loadCategoryFields()
    }
  }, [editorState.connected, editorState.selectedCatNos.size])

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, nombre, url, tenant, usuario, password, shared, owner_id')
        .order('nombre', { ascending: true })

      if (error) throw error
      setTenants(data || [])
    } catch (err) {
      console.error('Error loading tenants:', err)
      message.error('Error al cargar tenants: ' + err.message)
    }
  }

  const loadProfiles = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reporter_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      console.error('Error loading profiles:', err)
      message.error('Error al cargar perfiles: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EDITOR: CREATE/EDIT PROFILE
  // ═══════════════════════════════════════════════════════════

  const openEditor = (profile = null) => {
    if (profile) {
      // Edit mode
      setEditorState({
        profileId: profile.id,
        nombre: profile.nombre || '',
        tenantId: profile.tenant_id || '',
        connected: false,
        connectionHeaders: null,
        connectionBaseUrl: '',
        catTree: [],
        selectedCatNos: new Set(profile.saved_cat_nos || []),
        catNames: profile.cat_names || {},
        catFieldOrder: profile.cat_field_order || {},
        captionMap: profile.caption_map || {},
        allCommonFields: [],
        selectedFields: new Set(profile.saved_fields || ['DocNo']),
        groupFields: new Set(profile.group_fields || []),
      })
    } else {
      // New profile
      setEditorState({
        profileId: null,
        nombre: '',
        tenantId: '',
        connected: false,
        connectionHeaders: null,
        connectionBaseUrl: '',
        catTree: [],
        selectedCatNos: new Set(),
        catNames: {},
        catFieldOrder: {},
        captionMap: {},
        allCommonFields: [],
        selectedFields: new Set(['DocNo']),
        groupFields: new Set(),
      })
    }
    setView('editor')
  }

  const connectToTenant = async () => {
    if (!editorState.nombre || !editorState.tenantId) {
      message.error('Completa nombre y servidor')
      return
    }

    const tenant = tenants.find(t => t.id === editorState.tenantId)
    if (!tenant) {
      message.error('Servidor no encontrado')
      return
    }

    if (!tenant.tenant) {
      message.error('El tenant no tiene configurado el nombre de tenant. Revisa la configuración del servidor.')
      return
    }

    setLoading(true)
    try {
      const { headers, baseUrl } = await thereforeService.connect(
        tenant.url,
        tenant.usuario,
        tenant.password,
        tenant.tenant
      )

      const catTree = await thereforeService.getCategoryTree(baseUrl, headers)

      setEditorState(s => ({
        ...s,
        connected: true,
        connectionHeaders: headers,
        connectionBaseUrl: baseUrl,
        catTree
      }))

      message.success('✓ Conectado')
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryFields = async () => {
    if (editorState.selectedCatNos.size === 0) {
      setEditorState(s => ({ ...s, allCommonFields: [] }))
      return
    }

    const fieldMap = new Map()
    const newCaptionMap = { ...editorState.captionMap }
    const newCatFieldOrder = { ...editorState.catFieldOrder }

    fieldMap.set('DocNo', { caption: 'DocNo', type: 0, catNos: [...editorState.selectedCatNos] })

    try {
      for (const catNo of editorState.selectedCatNos) {
        const { fields } = await thereforeService.getCategoryInfo(
          editorState.connectionBaseUrl,
          editorState.connectionHeaders,
          catNo
        )

        newCatFieldOrder[catNo] = fields.map(f => f.ColName)

        fields.forEach(f => {
          const caption = f.Caption || f.ColName
          if (!fieldMap.has(f.ColName)) {
            fieldMap.set(f.ColName, { caption, type: f.FieldType || 0, catNos: [] })
            newCaptionMap[f.ColName] = caption
          }
          fieldMap.get(f.ColName).catNos.push(catNo)
        })
      }

      const total = editorState.selectedCatNos.size
      const commonFields = [...fieldMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .filter(f => f.name === 'DocNo' || f.catNos.length === total)

      setEditorState(s => ({
        ...s,
        catFieldOrder: newCatFieldOrder,
        captionMap: newCaptionMap,
        allCommonFields: commonFields
      }))
    } catch (err) {
      console.error('Error loading fields:', err)
      message.error('Error: ' + err.message)
    }
  }

  const toggleCategory = (catNo, checked) => {
    const newSelectedCatNos = new Set(editorState.selectedCatNos)
    if (checked) {
      newSelectedCatNos.add(catNo)
    } else {
      newSelectedCatNos.delete(catNo)
    }
    setEditorState(s => ({ ...s, selectedCatNos: newSelectedCatNos }))

    // Schedule fields reload
    setTimeout(loadCategoryFields, 700)
  }

  const saveProfile = async () => {
    const nombre = editorState.nombre.trim()
    const tenantId = editorState.tenantId

    if (!nombre || !tenantId || editorState.selectedCatNos.size === 0) {
      message.error('Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      // Build field_types map (fieldName -> FieldType)
      const fieldTypes = {}
      editorState.allCommonFields.forEach(f => {
        fieldTypes[f.name] = f.type
      })

      const data = {
        nombre,
        tenant_id: tenantId,
        saved_cat_nos: [...editorState.selectedCatNos],
        saved_fields: [...editorState.selectedFields],
        group_fields: [...editorState.groupFields],
        caption_map: editorState.captionMap,
        cat_field_order: editorState.catFieldOrder,
        cat_names: editorState.catNames,
        field_types: fieldTypes,
      }

      if (editorState.profileId) {
        // Update
        const { error } = await supabase
          .from('reporter_profiles')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editorState.profileId)

        if (error) throw error
        message.success('Perfil actualizado')
      } else {
        // Insert
        const { error } = await supabase
          .from('reporter_profiles')
          .insert([{
            user_id: user.id,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        message.success('Perfil creado')
      }

      await loadProfiles()
      setView('home')
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteProfile = async (profile) => {
    if (!confirm(`¿Eliminar "${profile.nombre}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('reporter_profiles')
        .delete()
        .eq('id', profile.id)

      if (error) throw error
      setProfiles(profiles.filter(p => p.id !== profile.id))
      message.success('Perfil eliminado')
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RESULTS: EXECUTE & SHOW DASHBOARD
  // ═══════════════════════════════════════════════════════════

  const executeProfile = async (profile) => {
    const tenant = tenants.find(t => t.id === profile.tenant_id)
    if (!tenant) {
      message.error('Tenant no encontrado')
      return
    }

    setResultsState(s => ({
      ...s,
      profile,
      dateFrom: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      loading: false,
      rows: [],
    }))
    setView('results')
  }

  const runQuery = async () => {
    const dateField = resultsState.dateField
    const dateFrom = resultsState.dateFrom
    const dateTo = resultsState.dateTo

    if (!dateField || !dateFrom || !dateTo) {
      message.error('Completa rango de fechas')
      return
    }

    setResultsState(s => ({ ...s, loading: true, progress: { pct: 0, label: 'Preparando...' } }))

    try {
      const tenant = tenants.find(t => t.id === resultsState.profile.tenant_id)
      const { headers, baseUrl } = await thereforeService.connect(
        tenant.url,
        tenant.usuario,
        tenant.password,
        tenant.tenant
      )

      // Refresh catFieldOrder
      const catFieldOrder = {}
      for (const catNo of resultsState.profile.saved_cat_nos) {
        const { fields } = await thereforeService.getCategoryInfo(baseUrl, headers, catNo)
        catFieldOrder[catNo] = fields.map(f => f.ColName)
      }

      // Build queries
      const queries = resultsState.profile.saved_cat_nos.map(catNo => ({
        CategoryNo: catNo,
        Mode: 0,
        MaxRows: 10000,
        Conditions: [{
          FieldNoOrName: dateField,
          Operator: 0,
          Condition: dateFrom + ' TO ' + dateTo
        }]
      }))

      // Execute
      const onProgress = (pct, label) => {
        setResultsState(s => ({ ...s, progress: { pct, label } }))
      }

      const { rows, canonicalFields, error } = await thereforeService.executeMultiQuery(
        baseUrl,
        headers,
        queries,
        resultsState.profile.saved_fields || [],
        onProgress
      )

      if (error) throw new Error(error)

      setResultsState(s => ({
        ...s,
        rows,
        canonicalFields,
        loading: false,
        progress: { pct: 100, label: 'Completado' }
      }))

      renderDashboard()
    } catch (err) {
      console.error('Query error:', err)
      message.error('Error: ' + err.message)
      setResultsState(s => ({ ...s, loading: false }))
    }
  }

  const renderDashboard = () => {
    // This will be rendered in the Results view
  }

  const exportCSV = () => {
    if (!resultsState.rows.length) {
      message.error('No hay datos para exportar')
      return
    }

    const profile = resultsState.profile
    const headers = ['Categoría', ...resultsState.canonicalFields]
    const dataKeys = ['_cat', ...resultsState.canonicalFields]

    const rows = [headers.join(';')]
    resultsState.rows.forEach(rec => {
      rows.push(dataKeys.map(k => {
        const v = k === '_cat' ? (editorState.catNames[rec[k]] || rec[k]) : (rec[k] ?? '')
        return '"' + String(v).replace(/"/g, '""') + '"'
      }).join(';'))
    })

    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${profile.nombre}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    message.success('CSV exportado')
  }

  // ═══════════════════════════════════════════════════════════
  // UI: RENDER VIEWS
  // ═══════════════════════════════════════════════════════════

  if (view === 'editor') {
    return <EditorView
      editorState={editorState}
      tenants={tenants}
      loading={loading}
      onNameChange={(e) => setEditorState(s => ({ ...s, nombre: e.target.value }))}
      onTenantChange={(tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId)
        setEditorState(s => ({ ...s, tenantId, catNames: tenant ? { [tenant.id]: tenant.nombre } : {} }))
      }}
      onConnect={connectToTenant}
      onToggleCategory={toggleCategory}
      onToggleField={(field, checked) => {
        const newSelectedFields = new Set(editorState.selectedFields)
        if (field === 'DocNo') return
        if (checked) newSelectedFields.add(field)
        else newSelectedFields.delete(field)
        setEditorState(s => ({ ...s, selectedFields: newSelectedFields }))
      }}
      onToggleGroup={(field, checked) => {
        const newGroupFields = new Set(editorState.groupFields)
        if (checked) newGroupFields.add(field)
        else newGroupFields.delete(field)
        setEditorState(s => ({ ...s, groupFields: newGroupFields }))
      }}
      onSave={saveProfile}
      onCancel={() => setView('home')}
    />
  }

  if (view === 'results') {
    return <ResultsView
      resultsState={resultsState}
      loading={loading}
      onDateFieldChange={(field) => setResultsState(s => ({ ...s, dateField: field }))}
      onDateFromChange={(date) => setResultsState(s => ({ ...s, dateFrom: date }))}
      onDateToChange={(date) => setResultsState(s => ({ ...s, dateTo: date }))}
      onRun={runQuery}
      onExport={exportCSV}
      onBack={() => setView('home')}
      catNames={editorState.catNames}
      captionMap={editorState.captionMap}
    />
  }

  // HOME VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ThunderboltOutlined /> Therefore Reporter
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()} size="large">
          Nuevo Perfil
        </Button>
      </div>

      <Spin spinning={loading}>
        {profiles.length === 0 ? (
          <Empty description="No hay perfiles creados" style={{ marginTop: '50px' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {profiles.map(p => (
              <Card key={p.id} className="profile-card" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>{p.nombre}</h3>
                  <Space size="small">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditor(p)} />
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteProfile(p)} />
                  </Space>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {tenants.find(t => t.id === p.tenant_id)?.url || '—'}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="meta-chip">📁 {(p.saved_cat_nos || []).length} cat.</span>
                  <span className="meta-chip">🗂 {(p.saved_fields || []).length} campos</span>
                </div>
                <Button type="primary" block onClick={() => executeProfile(p)}>▶ Ejecutar</Button>
              </Card>
            ))}
          </div>
        )}
      </Spin>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EDITOR VIEW COMPONENT
// ═══════════════════════════════════════════════════════════

function EditorView(props) {
  const { editorState, tenants, loading, onNameChange, onTenantChange, onConnect, onToggleCategory, onToggleField, onToggleGroup, onSave, onCancel } = props
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  const toggleFolder = (folderName) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName)
    } else {
      newExpanded.add(folderName)
    }
    setExpandedFolders(newExpanded)
  }

  const renderCategoryTree = (tree, level = 0) => {
    return tree.map((node, i) => {
      const catNo = node.ItemNo ?? node.CategoryNo
      const children = node.ChildItems || node.SubCategories || node.Children || []
      const isFolder = node.ItemType === 1 || (children.length && node.ItemType !== 2)
      const folderKey = `folder-${level}-${node.Name || i}`
      const isExpanded = expandedFolders.has(folderKey)

      if (isFolder) {
        return (
          <div key={i}>
            <div
              style={{
                marginLeft: `${level * 16}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 2px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '500',
                userSelect: 'none'
              }}
              onClick={() => toggleFolder(folderKey)}
            >
              <span style={{ width: '16px', textAlign: 'center' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
              <span>📁 {node.Name}</span>
            </div>
            {isExpanded && renderCategoryTree(children, level + 1)}
          </div>
        )
      }

      if (node.ItemType === 2 || (!children.length && catNo !== undefined)) {
        return (
          <div
            key={catNo}
            style={{
              marginLeft: `${level * 16}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 2px',
              borderRadius: '3px',
              color: 'var(--text-primary)',
              transition: 'background 0.2s',
              fontSize: '12px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <input
              type="checkbox"
              checked={editorState.selectedCatNos.has(catNo)}
              onChange={(e) => onToggleCategory(catNo, e.target.checked)}
              style={{ cursor: 'pointer', width: '16px' }}
            />
            <span>{node.Name || `Cat #${catNo}`}</span>
          </div>
        )
      }
    })
  }

  return (
    <div className="tr-editor-wrap">
      {/* Single Header Line: Title | Nombre | Servidor | Buttons */}
      <div className="tr-editor-header-zone">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          paddingBottom: '8px',
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap' }}>Crear / Editar Perfil</h2>
          </div>

          {editorState.nombre && editorState.tenantId && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', minWidth: 0 }}>
              <strong>{editorState.nombre}</strong> • {tenants.find(t => t.id === editorState.tenantId)?.nombre}
              {editorState.connected && <span style={{ color: 'var(--accent-primary)' }}>✓</span>}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Nombre:</label>
            <Input
              value={editorState.nombre}
              onChange={onNameChange}
              placeholder="ej: Aliseda - Notificaciones"
              size="small"
              style={{ flex: 1, minWidth: '150px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Servidor:</label>
            <Select
              value={editorState.tenantId || undefined}
              onChange={onTenantChange}
              placeholder="Selecciona..."
              options={tenants.map(t => ({ label: t.nombre, value: t.id }))}
              size="small"
              style={{ flex: 1, minWidth: '150px' }}
            />
          </div>

          <Space size="small" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Button size="small" onClick={onCancel}>Cancelar</Button>
            <Button size="small" type="primary" loading={loading} onClick={onSave}>💾 Guardar</Button>
            <Button size="small" loading={loading} onClick={onConnect} type="primary">
              🔗 Conectar
            </Button>
          </Space>
        </div>
      </div>

      {/* Panels Row: Categorías & Campos */}
      <div className="tr-editor-panels">
        {/* Panel: Categorías */}
        <div className="tr-ep">
          <div className="tr-ep-head">
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>📁 Categorías</span>
            <span className="tr-ep-badge">
              {editorState.selectedCatNos.size} seleccionadas
            </span>
          </div>
          <div className="tr-ep-body">
            {editorState.connected ? renderCategoryTree(editorState.catTree) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '12px' }}>
                Conecta primero
              </div>
            )}
          </div>
        </div>

        {/* Panel: Campos */}
        <div className="tr-ep">
          <div className="tr-ep-head">
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>🗂 Campos del informe</span>
            <span className="tr-ep-badge">
              {editorState.selectedFields.size} campos
            </span>
          </div>
          <div className="tr-ep-body">
            {editorState.allCommonFields.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '12px' }}>
                Selecciona categorías
              </div>
            ) : (
              editorState.allCommonFields.map(f => (
                <div
                  key={f.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '2px 4px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    borderBottom: '1px solid var(--bg-secondary)'
                  }}
                >
                  {f.name !== 'DocNo' && (
                    <input
                      type="checkbox"
                      checked={editorState.selectedFields.has(f.name)}
                      onChange={(e) => onToggleField(f.name, e.target.checked)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
                    />
                  )}
                  {f.name === 'DocNo' && <span style={{ width: '18px', textAlign: 'center', flexShrink: 0 }}>✓</span>}
                  <span style={{ flex: 1, fontWeight: f.name === 'DocNo' ? '600' : '400', minWidth: 0 }}>{f.caption}</span>
                  {f.name !== 'DocNo' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={editorState.groupFields.has(f.name)}
                        onChange={(e) => onToggleGroup(f.name, e.target.checked)}
                        style={{ width: '12px', height: '12px' }}
                      />
                      Agrupar
                    </label>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// RESULTS VIEW COMPONENT
// ═══════════════════════════════════════════════════════════

function ResultsView(props) {
  const {
    resultsState,
    loading,
    onDateFieldChange,
    onDateFromChange,
    onDateToChange,
    onRun,
    onExport,
    onBack,
    catNames,
    captionMap
  } = props

  // FieldType 3 = DateField, 5 = DateTimeField
  const fieldTypes = resultsState.profile?.field_types || {}
  const dateFields = resultsState.profile?.saved_fields?.filter(f =>
    f !== 'DocNo' && (fieldTypes[f] === 3 || fieldTypes[f] === 5)
  ) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, height: '100%', minHeight: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, flex: 1 }}>{resultsState.profile?.nombre}</h1>
      </div>

      {/* Filters & Actions */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Filtros en una línea */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Campo fecha:</label>
            <Select
              value={resultsState.dateField || undefined}
              onChange={onDateFieldChange}
              options={dateFields.map(f => ({ label: captionMap[f] || f, value: f }))}
              placeholder="Selecciona..."
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Desde:</label>
            <input
              type="date"
              value={resultsState.dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              style={{ padding: '6px 8px', border: '1px solid var(--border-default)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Hasta:</label>
            <input
              type="date"
              value={resultsState.dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              style={{ padding: '6px 8px', border: '1px solid var(--border-default)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Volver</Button>
          <Button type="primary" onClick={onRun} loading={loading}>▶ Ejecutar</Button>
          <Button onClick={onExport} type="default">⬇ CSV</Button>
        </div>
      </div>

      {/* Progress */}
      {loading && (
        <div>
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>{resultsState.progress.label}</div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-default)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${resultsState.progress.pct}%`, height: '100%', backgroundColor: 'var(--accent-primary)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Dashboard */}
      {!loading && resultsState.rows.length > 0 && (
        <DashboardView
          rows={resultsState.rows}
          canonicalFields={resultsState.canonicalFields}
          catNames={resultsState.profile?.cat_names || {}}
          captionMap={resultsState.profile?.caption_map || {}}
          groupFields={resultsState.profile?.group_fields || []}
          onExport={onExport}
        />
      )}

      {!loading && resultsState.rows.length === 0 && !resultsState.dateFrom && (
        <Empty description="Selecciona rango de fechas y ejecuta" style={{ marginTop: '50px' }} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD VIEW COMPONENT
// ═══════════════════════════════════════════════════════════

function DashboardView(props) {
  const { rows, canonicalFields, catNames, captionMap, groupFields, onExport } = props
  const [showDetail, setShowDetail] = useState(false)

  // Group by category
  const byCat = {}
  rows.forEach(rec => {
    const catNo = rec._cat
    const name = catNames[catNo] || `#${catNo}`
    byCat[name] = (byCat[name] || 0) + 1
  })

  // Group by fields
  const byField = {}
  groupFields.forEach(f => {
    byField[f] = {}
    rows.forEach(rec => {
      const v = rec[f] || '(vacío)'
      byField[f][v] = (byField[f][v] || 0) + 1
    })
  })

  const uniqueCats = Object.keys(byCat).length
  const now = new Date().toLocaleString('es-ES')

  return (
    <div className="dashboard">
      {/* Stats */}
      <div className="dash-stats">
        <Card className="dash-stat-card" style={{ backgroundColor: 'rgba(79, 142, 247, 0.1)', borderColor: 'var(--kpi-blue)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--kpi-blue)', textAlign: 'center' }}>
            {rows.length.toLocaleString('es-ES')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Total documentos</div>
          <div style={{ fontSize: '11px', color: 'var(--text-hint)', textAlign: 'center', marginTop: '4px' }}>
            Última extracción: {now}
          </div>
        </Card>

        <Card className="dash-stat-card" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'var(--kpi-green)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--kpi-green)', textAlign: 'center' }}>
            {uniqueCats}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Categorías con datos</div>
        </Card>

        <Card className="dash-stat-card" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'var(--kpi-amber)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--kpi-amber)', textAlign: 'center' }}>
            {canonicalFields.filter(f => f !== 'DocNo').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Campos en informe</div>
        </Card>

        {groupFields.length > 0 && (
          <Card className="dash-stat-card" style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: '#7c3aed' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed', textAlign: 'center' }}>
              {groupFields.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Agrupaciones activas</div>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginTop: '30px' }}>
        <BarChart title="📁 Documentos por categoría" data={byCat} colorIdx={0} catNames={catNames} />
        {groupFields.map((f, i) => (
          <BarChart key={f} title={`📊 Por ${captionMap[f] || f}`} data={byField[f] || {}} colorIdx={i + 1} />
        ))}
      </div>

      {/* Detail toggle */}
      <div style={{ marginTop: '20px' }}>
        <Button
          onClick={() => setShowDetail(!showDetail)}
          block
          style={{ marginBottom: '10px' }}
        >
          {showDetail ? '▼' : '▶'} {showDetail ? 'Ocultar' : 'Ver'} detalle ({rows.length.toLocaleString('es-ES')} registros)
        </Button>

        {showDetail && (
          <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Categoría</th>
                  {canonicalFields.map(f => (
                    <th key={f} style={{ padding: '8px', textAlign: 'left' }}>{captionMap[f] || f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '8px' }}>
                      <span style={{ padding: '2px 8px', backgroundColor: 'var(--border-default)', borderRadius: '3px', fontSize: '11px' }}>
                        {catNames[row._cat] || row._cat}
                      </span>
                    </td>
                    {canonicalFields.map(f => (
                      <td key={f} style={{ padding: '8px' }}>{row[f] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && <div style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '12px' }}>+ {rows.length - 100} registros más</div>}
          </div>
        )}
      </div>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// BAR CHART COMPONENT
// ═══════════════════════════════════════════════════════════

function BarChart({ title, data, colorIdx, catNames }) {
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
  const max = sorted[0]?.[1] || 1
  const colors = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']
  const col = colors[colorIdx % colors.length]

  return (
    <Card>
      <div style={{ marginBottom: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.map(([label, count]) => {
          const pct = Math.round((count / max) * 100)
          // For categories, try to get the friendly name from catNames
          const displayLabel = catNames && label.startsWith('#')
            ? catNames[label.replace('#', '')] || label
            : label
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '120px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }} title={displayLabel}>
                {displayLabel}
              </div>
              <div style={{ flex: 1, height: '20px', backgroundColor: 'var(--border-default)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: `var(--kpi-${['blue', 'green', 'amber', 'pink'][colorIdx % 4]})`,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <div style={{ width: '50px', textAlign: 'right', fontSize: '11px', fontWeight: '500' }}>
                {count.toLocaleString('es-ES')}
              </div>
            </div>
          )
        })}
      </div>
      {Object.keys(data).length > 15 && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          + {Object.keys(data).length - 15} valores más
        </div>
      )}
    </Card>
  )
}
