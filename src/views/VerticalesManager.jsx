import { useState, useEffect } from 'react';
import { Drawer, Form, Input, Tag, Spin, Tooltip, Popconfirm, Tabs, InputNumber, Checkbox, Space, Button, Card, Collapse, Alert, Select } from 'antd';
import { message } from '../utils/message'
import { EditOutlined, DeleteOutlined, PlusOutlined, CloseOutlined, EyeOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { verticalesService } from '../services/verticalesService';
import { useTranslation } from 'react-i18next';
import { useMessages } from '../utils/i18nMessages';
import '../styles/verticales-manager.css';

// ── UTILIDAD: SANITIZAR ARRAY ────────────────────────────────────────────────
// Convierte cualquier valor a string simple (maneja objetos legacy)
function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      // Si es objeto con nombre, usar nombre; sino JSON
      return item.nombre || item.name || JSON.stringify(item);
    }
    return String(item);
  }).filter(Boolean); // Eliminar vacíos
}

// ── COMPONENTE DE LISTA EDITABLE ─────────────────────────────────────────────
function EditableList({ value = [], onChange, placeholder = "Nuevo item", type = "text" }) {
  const [newItem, setNewItem] = useState('');

  // Sanitizar value al recibir (defensa contra datos legacy)
  const sanitizedValue = sanitizeArray(value);

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...sanitizedValue, newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (index) => {
    onChange(sanitizedValue.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Lista de items */}
      {sanitizedValue.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
          {sanitizedValue.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              <span style={{ flex: 1 }}>{item}</span>
              <button
                onClick={() => removeItem(index)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <CloseOutlined style={{ fontSize: '11px' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input para agregar nuevo */}
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onPressEnter={addItem}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={addItem}>
          Agregar
        </Button>
      </Space.Compact>
    </div>
  );
}

// ── COMPONENTE ESPECIALIZADO PARA WORKFLOWS ─────────────────────────────────
function WorkflowEditor({ value = [], onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValues, setEditingValues] = useState({ nombre: '', descripcion: '', tipo: '', etapas: [] });
  const [newEtapa, setNewEtapa] = useState('');

  const startAdd = () => {
    setEditingValues({ nombre: '', descripcion: '', tipo: 'automatico', etapas: [] });
    setEditingIndex(-1);
  };

  const startEdit = (index) => {
    setEditingValues({ ...value[index], etapas: [...(value[index].etapas || [])] });
    setEditingIndex(index);
  };

  const saveWorkflow = () => {
    if (editingIndex === -1) {
      onChange([...value, editingValues]);
    } else {
      const newValue = [...value];
      newValue[editingIndex] = editingValues;
      onChange(newValue);
    }
    setEditingIndex(null);
    setEditingValues({ nombre: '', descripcion: '', tipo: '', etapas: [] });
    setNewEtapa('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValues({ nombre: '', descripcion: '', tipo: '', etapas: [] });
    setNewEtapa('');
  };

  const removeWorkflow = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addEtapa = () => {
    if (!newEtapa.trim()) return;
    setEditingValues({ ...editingValues, etapas: [...editingValues.etapas, newEtapa.trim()] });
    setNewEtapa('');
  };

  const removeEtapa = (etapaIndex) => {
    setEditingValues({ ...editingValues, etapas: editingValues.etapas.filter((_, i) => i !== etapaIndex) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Lista de workflows */}
      {value.map((workflow, index) => (
        <Card
          key={index}
          size="small"
          style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-primary)' }}
          extra={
            <Space size="small">
              <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(index)} />
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeWorkflow(index)} />
            </Space>
          }
        >
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ fontSize: '14px' }}>{workflow.nombre || 'Sin nombre'}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {workflow.descripcion || 'Sin descripción'}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <Tag color="blue">{workflow.tipo || 'automatico'}</Tag>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {workflow.etapas?.length || 0} etapas
            </span>
          </div>
          {workflow.etapas && workflow.etapas.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {workflow.etapas.map((etapa, i) => `${i + 1}. ${etapa}`).join(' → ')}
            </div>
          )}
        </Card>
      ))}

      {/* Form para agregar/editar */}
      {editingIndex !== null ? (
        <Card size="small" title={editingIndex === -1 ? 'Nuevo Workflow' : 'Editar Workflow'} style={{ backgroundColor: 'var(--bg-hover)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>Nombre</label>
              <Input
                value={editingValues.nombre || ''}
                onChange={(e) => setEditingValues({ ...editingValues, nombre: e.target.value })}
                placeholder="ej: WF Asignación de Equipo"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>Descripción</label>
              <Input.TextArea
                value={editingValues.descripcion || ''}
                onChange={(e) => setEditingValues({ ...editingValues, descripcion: e.target.value })}
                placeholder="Descripción del workflow..."
                rows={2}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>Tipo</label>
              <Select
                value={editingValues.tipo || 'automatico'}
                onChange={(tipo) => setEditingValues({ ...editingValues, tipo })}
                style={{ width: '100%' }}
                options={[
                  { label: 'Automático', value: 'automatico' },
                  { label: 'Manual', value: 'manual' },
                  { label: 'Manual + Automático', value: 'manual_automatico' }
                ]}
              />
            </div>

            {/* Etapas del workflow */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>
                Etapas del Workflow ({editingValues.etapas?.length || 0})
              </label>
              {editingValues.etapas?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  {editingValues.etapas.map((etapa, etapaIndex) => (
                    <div key={etapaIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: 'var(--text-secondary)', minWidth: '20px' }}>{etapaIndex + 1}.</span>
                      <span style={{ flex: 1 }}>{etapa}</span>
                      <button
                        onClick={() => removeEtapa(etapaIndex)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                      >
                        <CloseOutlined style={{ fontSize: '10px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={newEtapa}
                  onChange={(e) => setNewEtapa(e.target.value)}
                  onPressEnter={addEtapa}
                  placeholder="Nueva etapa..."
                  size="small"
                />
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addEtapa}>
                  Agregar Etapa
                </Button>
              </Space.Compact>
            </div>

            <Space style={{ marginTop: '8px' }}>
              <Button type="primary" onClick={saveWorkflow} disabled={!editingValues.nombre}>
                Guardar Workflow
              </Button>
              <Button onClick={cancelEdit}>Cancelar</Button>
            </Space>
          </div>
        </Card>
      ) : (
        <Button icon={<PlusOutlined />} onClick={startAdd} type="dashed" style={{ width: '100%' }}>
          Agregar Workflow
        </Button>
      )}
    </div>
  );
}

// ── COMPONENTE PARA EDITAR OBJETOS EN ARRAY ──────────────────────────────────
function EditableObjectList({ value = [], onChange, fields, itemLabel = "Item" }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValues, setEditingValues] = useState({});

  const startAdd = () => {
    const emptyValues = {};
    fields.forEach(f => emptyValues[f.key] = '');
    setEditingValues(emptyValues);
    setEditingIndex(-1);
  };

  const startEdit = (index) => {
    setEditingValues({ ...value[index] });
    setEditingIndex(index);
  };

  const saveItem = () => {
    if (editingIndex === -1) {
      onChange([...value, editingValues]);
    } else {
      const newValue = [...value];
      newValue[editingIndex] = editingValues;
      onChange(newValue);
    }
    setEditingIndex(null);
    setEditingValues({});
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValues({});
  };

  const removeItem = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Lista de items */}
      {value.map((item, index) => (
        <Card
          key={index}
          size="small"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
          extra={
            <Space size="small">
              <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(index)} />
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
            </Space>
          }
        >
          {fields.map(field => (
            <div key={field.key} style={{ marginBottom: '4px' }}>
              <strong style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{field.label}:</strong>
              <span style={{ marginLeft: '8px', fontSize: '13px' }}>{item[field.key] || '-'}</span>
            </div>
          ))}
        </Card>
      ))}

      {/* Form para agregar/editar */}
      {editingIndex !== null ? (
        <Card size="small" title={editingIndex === -1 ? `Nuevo ${itemLabel}` : `Editar ${itemLabel}`}>
          {fields.map(field => (
            <div key={field.key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                {field.label}
              </label>
              <Input
                value={editingValues[field.key] || ''}
                onChange={(e) => setEditingValues({ ...editingValues, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <Space style={{ marginTop: '12px' }}>
            <Button type="primary" size="small" onClick={saveItem}>Guardar</Button>
            <Button size="small" onClick={cancelEdit}>Cancelar</Button>
          </Space>
        </Card>
      ) : (
        <Button icon={<PlusOutlined />} onClick={startAdd}>
          Agregar {itemLabel}
        </Button>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function VerticalesManager() {
  const { t } = useTranslation();
  const MESSAGES = useMessages();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verticales, setVerticales] = useState([]);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Estados para arrays editables
  const [claves, setClaves] = useState([]);
  const [premisasEspecificas, setPremisasEspecificas] = useState([]);
  const [tablasMaestras, setTablasMaestras] = useState([]);
  const [herramientasRecomendadas, setHerramientasRecomendadas] = useState([]);
  const [ejemploWorkflows, setEjemploWorkflows] = useState([]);
  const [integracionesComunes, setIntegracionesComunes] = useState([]);
  const [casosPruebaTipicos, setCasosPruebaTipicos] = useState([]);
  const [criteriosAceptacion, setCriteriosAceptacion] = useState([]);
  const [modulosFuncionales, setModulosFuncionales] = useState([]);
  const [procesosClave, setProcesosClave] = useState([]);
  const [integracionesUsuario, setIntegracionesUsuario] = useState([]);

  // Estado para búsqueda/filtro
  const [searchText, setSearchText] = useState('');

  // Estado para exportación
  const [exportingVertical, setExportingVertical] = useState(false);

  useEffect(() => {
    loadVerticales();
  }, []);

  useEffect(() => {
    if (isDrawerVisible && selectedVertical) {
      // Cargar datos del vertical seleccionado
      form.setFieldsValue({
        nombre: selectedVertical.nombre,
        titulo: selectedVertical.titulo,
        descripcion_intro: selectedVertical.descripcion_intro,
        activo: selectedVertical.activo,
        tarifa_diaria: selectedVertical.tarifa_diaria,
        duracion_tipica_dias: selectedVertical.duracion_tipica_dias,
        margen_oferta_pct: selectedVertical.margen_oferta_pct,
        descripcion_implementacion: selectedVertical.descripcion_implementacion,
        plantilla_html_manual: selectedVertical.plantilla_html_manual
      });

      // Sanitizar arrays para prevenir errores con datos legacy
      setClaves(sanitizeArray(selectedVertical.claves));
      setPremisasEspecificas(sanitizeArray(selectedVertical.premisas_especificas));
      setTablasMaestras(sanitizeArray(selectedVertical.tablas_maestras));
      setHerramientasRecomendadas(sanitizeArray(selectedVertical.herramientas_recomendadas));
      setEjemploWorkflows(selectedVertical.ejemplo_workflows || []); // Workflows son objetos válidos
      setIntegracionesComunes(sanitizeArray(selectedVertical.integraciones_comunes));
      setCasosPruebaTipicos(sanitizeArray(selectedVertical.casos_prueba_tipicos));
      setCriteriosAceptacion(sanitizeArray(selectedVertical.criterios_aceptacion));
      setModulosFuncionales(sanitizeArray(selectedVertical.modulos_funcionales));
      setProcesosClave(sanitizeArray(selectedVertical.procesos_clave));
      setIntegracionesUsuario(sanitizeArray(selectedVertical.integraciones_usuario));
    } else if (isDrawerVisible && !selectedVertical) {
      // Reset para nuevo vertical
      form.resetFields();
      form.setFieldsValue({
        activo: true,
        tarifa_diaria: 800,
        duracion_tipica_dias: 10,
        margen_oferta_pct: 20
      });

      setClaves([]);
      setPremisasEspecificas([]);
      setTablasMaestras([]);
      setHerramientasRecomendadas([]);
      setEjemploWorkflows([]);
      setIntegracionesComunes([]);
      setCasosPruebaTipicos([]);
      setCriteriosAceptacion([]);
      setModulosFuncionales([]);
      setProcesosClave([]);
      setIntegracionesUsuario([]);
    }
  }, [isDrawerVisible, selectedVertical, form]);

  const loadVerticales = async () => {
    setLoading(true);
    try {
      const data = await verticalesService.getAllVerticals();
      setVerticales(data);
    } catch (err) {
      message.error(MESSAGES.ERROR.LOAD('verticales') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mapa de iconos para cada vertical (basado en nombre)
  const getVerticalIcon = (nombre) => {
    const iconMap = {
      'evolutivo': '🔄',
      'facturas': '📄',
      'hr': '👥',
      'notifapp': '📨',
      'sage': '📊',
      'legal': '⚖️',
      'contabilidad': '💰',
      'crm': '🤝',
      'inventario': '📦',
      'ventas': '💼'
    };
    return iconMap[nombre?.toLowerCase()] || '📁';
  };

  // Filtrar verticales por búsqueda
  const filteredVerticales = verticales.filter(v => {
    if (!searchText.trim()) return true;
    const search = searchText.toLowerCase();
    return (
      v.nombre?.toLowerCase().includes(search) ||
      v.titulo?.toLowerCase().includes(search) ||
      v.descripcion_intro?.toLowerCase().includes(search)
    );
  });

  const editVertical = (vertical) => {
    setSelectedVertical(vertical);
    setIsDrawerVisible(true);
  };

  const createNewVertical = () => {
    setSelectedVertical(null);
    setIsDrawerVisible(true);
  };

  const deleteVertical = async (vertical) => {
    setLoading(true);
    try {
      await verticalesService.deleteVertical(vertical.id);
      setVerticales(verticales.filter(v => v.id !== vertical.id));
      message.success(MESSAGES.SUCCESS.DELETE('Vertical'));
    } catch (err) {
      message.error('Error al eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportVertical = async () => {
    if (!selectedVertical) {
      message.error('No hay vertical seleccionado para exportar');
      return;
    }

    setExportingVertical(true);
    try {
      const response = await fetch('/api/export-vertical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical: selectedVertical })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vertical_${selectedVertical.nombre}_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Vertical exportado correctamente');
    } catch (err) {
      message.error('Error al exportar: ' + err.message);
    } finally {
      setExportingVertical(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validación personalizada
      const values = await form.validateFields();

      // Validación adicional
      if (!values.nombre || !values.titulo) {
        message.error('Nombre y Título son obligatorios');
        return;
      }

      if (values.tarifa_diaria && values.tarifa_diaria <= 0) {
        message.error('La tarifa diaria debe ser mayor a 0');
        return;
      }

      setLoading(true);

      const data = {
        ...values,
        claves,
        premisas_especificas: premisasEspecificas,
        tablas_maestras: tablasMaestras,
        herramientas_recomendadas: herramientasRecomendadas,
        ejemplo_workflows: ejemploWorkflows,
        integraciones_comunes: integracionesComunes,
        casos_prueba_tipicos: casosPruebaTipicos,
        criterios_aceptacion: criteriosAceptacion,
        modulos_funcionales: modulosFuncionales,
        procesos_clave: procesosClave,
        integraciones_usuario: integracionesUsuario
      };

      if (selectedVertical) {
        await verticalesService.updateVertical(selectedVertical.id, data);
        setVerticales(verticales.map(v =>
          v.id === selectedVertical.id
            ? { ...v, ...data, updated_at: new Date().toISOString() }
            : v
        ));
        message.success(MESSAGES.SUCCESS.UPDATE('Vertical'));
      } else {
        const newVertical = await verticalesService.createVertical(data);
        setVerticales([newVertical, ...verticales]);
        message.success(MESSAGES.SUCCESS.CREATE('Vertical'));
      }

      setIsDrawerVisible(false);
      setSelectedVertical(null);
    } catch (error) {
      if (error.errorFields) {
        message.error('Por favor completa todos los campos requeridos');
      } else {
        message.error('Error al guardar: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── TABS DEL DRAWER ───────────────────────────────────────────────────────────
  const drawerTabs = [
    {
      key: '1',
      label: 'Información Básica',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Nombre (ID)"
              name="nombre"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input placeholder="ej: notifapp" disabled={!!selectedVertical} />
            </Form.Item>
            <Form.Item
              label="Título"
              name="titulo"
              rules={[{ required: true, message: 'El título es requerido' }]}
            >
              <Input placeholder="ej: Gestión de Notificaciones AAPP" />
            </Form.Item>
          </div>
          <Form.Item
            label="Descripción Introducción"
            name="descripcion_intro"
          >
            <Input.TextArea rows={4} placeholder="Descripción breve del vertical" />
          </Form.Item>
          <Form.Item
            label="Descripción Implementación"
            name="descripcion_implementacion"
          >
            <Input.TextArea rows={3} placeholder="Descripción de la implementación" />
          </Form.Item>
          <Form.Item
            name="activo"
            valuePropName="checked"
          >
            <Checkbox>Activo</Checkbox>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <Form.Item
              label="Tarifa Diaria (€)"
              name="tarifa_diaria"
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item
              label="Duración Típica (días)"
              name="duracion_tipica_dias"
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item
              label="Margen de Oferta (%)"
              name="margen_oferta_pct"
            >
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </div>
        </div>
      )
    },
    {
      key: '2',
      label: 'Claves y Premisas',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Claves del Proyecto</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Puntos clave que definen el proyecto
            </p>
            <EditableList
              value={claves}
              onChange={setClaves}
              placeholder="Nueva clave del proyecto..."
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Premisas Específicas</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Premisas específicas de este tipo de proyecto
            </p>
            <EditableObjectList
              value={premisasEspecificas}
              onChange={setPremisasEspecificas}
              itemLabel="Premisa"
              fields={[
                { key: 'premisa', label: 'Premisa', placeholder: 'ej: Acceso API AAPP' },
                { key: 'descripcion', label: 'Descripción', placeholder: 'Detalle de la premisa' },
                { key: 'impacto', label: 'Impacto', placeholder: 'Alto/Medio/Bajo' }
              ]}
            />
          </div>
        </div>
      )
    },
    {
      key: '3',
      label: 'Estructura y Workflows',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Tablas Maestras</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Tablas maestras típicas de este vertical
            </p>
            <EditableList
              value={tablasMaestras}
              onChange={setTablasMaestras}
              placeholder="Nueva tabla maestra..."
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Workflows</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Workflows típicos del vertical con sus etapas
            </p>
            <WorkflowEditor
              value={ejemploWorkflows}
              onChange={setEjemploWorkflows}
            />
          </div>
        </div>
      )
    },
    {
      key: '4',
      label: 'Integraciones',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Herramientas Recomendadas</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Herramientas externas (DOCAI, IVNEOS, IvSign, etc.)
            </p>
            <EditableList
              value={herramientasRecomendadas}
              onChange={setHerramientasRecomendadas}
              placeholder="ej: DOCAI"
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Integraciones Comunes</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Sistemas con los que típicamente se integra (SAP, Sage, APIs)
            </p>
            <EditableList
              value={integracionesComunes}
              onChange={setIntegracionesComunes}
              placeholder="ej: SAP ERP"
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Integraciones Usuario</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Integraciones visibles al usuario final
            </p>
            <EditableList
              value={integracionesUsuario}
              onChange={setIntegracionesUsuario}
              placeholder="ej: Portal web"
            />
          </div>
        </div>
      )
    },
    {
      key: '5',
      label: 'Testing y Módulos',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Casos de Prueba Típicos</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Casos de prueba estándar para UAT
            </p>
            <EditableObjectList
              value={casosPruebaTipicos}
              onChange={setCasosPruebaTipicos}
              itemLabel="Caso de Prueba"
              fields={[
                { key: 'caso', label: 'Caso', placeholder: 'ej: Crear y tramitar documento' },
                { key: 'descripcion', label: 'Descripción', placeholder: 'Detalle del caso de prueba' }
              ]}
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Criterios de Aceptación</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Criterios para considerar el proyecto completado
            </p>
            <EditableList
              value={criteriosAceptacion}
              onChange={setCriteriosAceptacion}
              placeholder="ej: Todo funciona correctamente"
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Módulos Funcionales</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Módulos funcionales que incluye el vertical
            </p>
            <EditableList
              value={modulosFuncionales}
              onChange={setModulosFuncionales}
              placeholder="ej: Gestión documental"
            />
          </div>

          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Procesos Clave</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Procesos de negocio clave del vertical
            </p>
            <EditableList
              value={procesosClave}
              onChange={setProcesosClave}
              placeholder="ej: Alta de documento"
            />
          </div>
        </div>
      )
    },
    {
      key: '6',
      label: 'Plantilla HTML',
      children: (
        <div>
          <Form.Item
            label="Plantilla HTML Manual"
            name="plantilla_html_manual"
          >
            <Input.TextArea
              rows={12}
              placeholder="<html>...</html>"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>
        </div>
      )
    }
  ];

  // ── VISTA PREVIA ──────────────────────────────────────────────────────────────
  const PreviewPanel = () => {
    const values = form.getFieldsValue();
    return (
      <Collapse
        items={[{
          key: '1',
          label: (
            <span style={{ fontWeight: 600 }}>
              <EyeOutlined /> Vista Previa del Vertical
            </span>
          ),
          children: (
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Nombre:</strong>
                <span>{values.nombre || '(sin nombre)'}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Título:</strong>
                <span>{values.titulo || '(sin título)'}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Descripción:</strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {values.descripcion_intro || '(sin descripción)'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>Tarifa:</strong>
                  <Tag color="blue">{values.tarifa_diaria || 800}€/día</Tag>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>Duración:</strong>
                  <Tag color="green">{values.duracion_tipica_dias || 10} días</Tag>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Contenido:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {claves.length > 0 && <Tag>Claves: {claves.length}</Tag>}
                  {premisasEspecificas.length > 0 && <Tag>Premisas: {premisasEspecificas.length}</Tag>}
                  {tablasMaestras.length > 0 && <Tag>Tablas: {tablasMaestras.length}</Tag>}
                  {ejemploWorkflows.length > 0 && <Tag>Workflows: {ejemploWorkflows.length}</Tag>}
                  {herramientasRecomendadas.length > 0 && <Tag>Herramientas: {herramientasRecomendadas.length}</Tag>}
                </div>
              </div>
            </div>
          )
        }]}
        defaultActiveKey={[]}
        style={{ marginBottom: '16px' }}
      />
    );
  };

  return (
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* HEADER */}
      <div className="header-main">
        <h1 className="header-title" style={{ margin: 0 }}>
          Gestión de Verticales
        </h1>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Input
            placeholder="🔍 Buscar verticales..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="search-input-borderless"
            style={{ width: '300px' }}
          />
          <button
            onClick={createNewVertical}
            className="btn-primary"
          >
            + Nuevo Vertical
          </button>
        </div>
      </div>

      {/* GRID DE TARJETAS */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin size="large" />
          </div>
        ) : filteredVerticales.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '48px', opacity: 0.3 }}>
              {searchText ? '🔍' : '📁'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {searchText ? `No se encontraron verticales con "${searchText}"` : 'No hay verticales creados'}
            </div>
            {!searchText && (
              <button onClick={createNewVertical} className="btn-primary">
                + Crear Primer Vertical
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px',
            overflow: 'auto',
            padding: '0'
          }}>
            {filteredVerticales.map(v => (
              <Card key={v.id} className="profile-card" hoverable>
                {/* Header con título y acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getVerticalIcon(v.nombre)}</span>
                    {v.titulo || v.nombre}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Tooltip title="Editar vertical">
                      <button
                        className="btn-link"
                        onClick={() => editVertical(v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <EditOutlined style={{ fontSize: '12px' }} />
                      </button>
                    </Tooltip>
                    <Popconfirm
                      title="Eliminar vertical"
                      description="¿Estás seguro de que quieres eliminar este vertical?"
                      onConfirm={() => deleteVertical(v)}
                      okText="Sí"
                      cancelText="No"
                    >
                      <button
                        className="btn-link danger"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <DeleteOutlined style={{ fontSize: '12px' }} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                {/* Descripción */}
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                  minHeight: '36px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {v.descripcion_intro || 'Sin descripción'}
                </div>

                {/* Chips informativos */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="meta-chip">💰 {v.tarifa_diaria || 0}€/día</span>
                  <span className="meta-chip">📅 {v.duracion_tipica_dias || 0} días</span>
                  <span className="meta-chip" style={{
                    backgroundColor: v.activo ? 'var(--kpi-green-bg)' : 'var(--kpi-red-bg)',
                    color: v.activo ? 'var(--kpi-green)' : 'var(--kpi-red)'
                  }}>
                    {v.activo ? '✓ Activo' : '✗ Inactivo'}
                  </span>
                </div>

                {/* Estadísticas de contenido */}
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-default)'
                }}>
                  {(v.claves?.length || 0) > 0 && <span>🔑 {v.claves.length} claves</span>}
                  {(v.ejemplo_workflows?.length || 0) > 0 && <span>🔄 {v.ejemplo_workflows.length} workflows</span>}
                  {(v.modulos_funcionales?.length || 0) > 0 && <span>📦 {v.modulos_funcionales.length} módulos</span>}
                </div>

                {/* Botón de acción principal */}
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => editVertical(v)}
                >
                  ✏️ Editar Vertical
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DRAWER LATERAL GRANDE */}
      <Drawer
        title={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedVertical ? <EditOutlined /> : <PlusOutlined />}
              <span>{selectedVertical ? 'Editar Vertical' : 'Crear Nuevo Vertical'}</span>
            </div>
            {selectedVertical && (
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{getVerticalIcon(selectedVertical.nombre)}</span>
                <span>{selectedVertical.titulo || selectedVertical.nombre}</span>
              </div>
            )}
          </div>
        }
        open={isDrawerVisible}
        onClose={() => {
          setIsDrawerVisible(false);
          setSelectedVertical(null);
        }}
        width="80%"
        className="verticales-drawer"
        extra={
          <Space>
            {selectedVertical && (
              <Button
                icon={<EyeOutlined />}
                onClick={exportVertical}
                loading={exportingVertical}
              >
                Exportar Word
              </Button>
            )}
            <Button onClick={() => setIsDrawerVisible(false)}>Cancelar</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSave} loading={loading}>
              Guardar Vertical
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
        >
          <PreviewPanel />
          <Tabs items={drawerTabs} />
        </Form>
      </Drawer>
    </div>
  );
}
