import { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Tag, message, Spin, Tooltip, Popconfirm, Collapse, InputNumber, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { verticalesService } from '../services/verticalesService';

export default function VerticalesManager() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verticales, setVerticales] = useState([]);
  const [selectedVertical, setSelectedVertical] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    loadVerticales();
  }, []);

  useEffect(() => {
    if (isModalVisible && selectedVertical) {
      form.setFieldsValue({
        nombre: selectedVertical.nombre,
        titulo: selectedVertical.titulo,
        descripcion_intro: selectedVertical.descripcion_intro,
        activo: selectedVertical.activo,
        tarifa_diaria: selectedVertical.tarifa_diaria,
        duracion_tipica_dias: selectedVertical.duracion_tipica_dias,
        margen_oferta_pct: selectedVertical.margen_oferta_pct,
        descripcion_implementacion: selectedVertical.descripcion_implementacion,
        plantilla_html_manual: selectedVertical.plantilla_html_manual,
        claves: selectedVertical.claves ? JSON.stringify(selectedVertical.claves, null, 2) : '[]',
        premisas_especificas: selectedVertical.premisas_especificas ? JSON.stringify(selectedVertical.premisas_especificas, null, 2) : '[]',
        tablas_maestras: selectedVertical.tablas_maestras ? JSON.stringify(selectedVertical.tablas_maestras, null, 2) : '[]',
        herramientas_recomendadas: selectedVertical.herramientas_recomendadas ? JSON.stringify(selectedVertical.herramientas_recomendadas, null, 2) : '[]',
        ejemplo_workflows: selectedVertical.ejemplo_workflows ? JSON.stringify(selectedVertical.ejemplo_workflows, null, 2) : '[]',
        integraciones_comunes: selectedVertical.integraciones_comunes ? JSON.stringify(selectedVertical.integraciones_comunes, null, 2) : '[]',
        casos_prueba_tipicos: selectedVertical.casos_prueba_tipicos ? JSON.stringify(selectedVertical.casos_prueba_tipicos, null, 2) : '[]',
        criterios_aceptacion: selectedVertical.criterios_aceptacion ? JSON.stringify(selectedVertical.criterios_aceptacion, null, 2) : '[]',
        modulos_funcionales: selectedVertical.modulos_funcionales ? JSON.stringify(selectedVertical.modulos_funcionales, null, 2) : '[]',
        procesos_clave: selectedVertical.procesos_clave ? JSON.stringify(selectedVertical.procesos_clave, null, 2) : '[]',
        integraciones_usuario: selectedVertical.integraciones_usuario ? JSON.stringify(selectedVertical.integraciones_usuario, null, 2) : '[]'
      });
    } else if (isModalVisible && !selectedVertical) {
      form.resetFields();
      form.setFieldsValue({
        activo: true,
        tarifa_diaria: 800,
        duracion_tipica_dias: 10,
        margen_oferta_pct: 20,
        claves: '[]',
        premisas_especificas: '[]',
        tablas_maestras: '[]',
        herramientas_recomendadas: '[]',
        ejemplo_workflows: '[]',
        integraciones_comunes: '[]',
        casos_prueba_tipicos: '[]',
        criterios_aceptacion: '[]',
        modulos_funcionales: '[]',
        procesos_clave: '[]',
        integraciones_usuario: '[]'
      });
    }
  }, [isModalVisible, selectedVertical, form]);

  const loadVerticales = async () => {
    setLoading(true);
    try {
      const data = await verticalesService.getAllVerticals();
      setVerticales(data);
    } catch (err) {
      message.error('Error al cargar verticales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text) => <span style={{ fontWeight: '600', fontSize: '14px' }}>{text}</span>
    },
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (text) => text || '-'
    },
    {
      title: 'Tarifa Diaria',
      dataIndex: 'tarifa_diaria',
      key: 'tarifa_diaria',
      render: (value) => `$${value || 0}`
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? new Date(text).toLocaleDateString('es-ES') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="Editar vertical">
            <button
              className="btn-link"
              onClick={() => editVertical(record)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <EditOutlined style={{ fontSize: '12px' }} />
            </button>
          </Tooltip>
          <Popconfirm
            title="Eliminar vertical"
            description="¿Estás seguro de que quieres eliminar este vertical?"
            onConfirm={() => deleteVertical(record)}
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
      )
    }
  ];

  const editVertical = (vertical) => {
    setSelectedVertical(vertical);
    setIsModalVisible(true);
  };

  const createNewVertical = () => {
    setSelectedVertical(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const deleteVertical = async (vertical) => {
    setLoading(true);
    try {
      await verticalesService.deleteVertical(vertical.id);
      setVerticales(verticales.filter(v => v.id !== vertical.id));
      message.success('Vertical eliminado');
    } catch (err) {
      message.error('Error al eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        claves: JSON.parse(values.claves || '[]'),
        premisas_especificas: JSON.parse(values.premisas_especificas || '[]'),
        tablas_maestras: JSON.parse(values.tablas_maestras || '[]'),
        herramientas_recomendadas: JSON.parse(values.herramientas_recomendadas || '[]'),
        ejemplo_workflows: JSON.parse(values.ejemplo_workflows || '[]'),
        integraciones_comunes: JSON.parse(values.integraciones_comunes || '[]'),
        casos_prueba_tipicos: JSON.parse(values.casos_prueba_tipicos || '[]'),
        criterios_aceptacion: JSON.parse(values.criterios_aceptacion || '[]'),
        modulos_funcionales: JSON.parse(values.modulos_funcionales || '[]'),
        procesos_clave: JSON.parse(values.procesos_clave || '[]'),
        integraciones_usuario: JSON.parse(values.integraciones_usuario || '[]')
      };

      if (selectedVertical) {
        await verticalesService.updateVertical(selectedVertical.id, data);
        setVerticales(verticales.map(v =>
          v.id === selectedVertical.id
            ? { ...v, ...data, updated_at: new Date().toISOString() }
            : v
        ));
        message.success('Vertical actualizado');
      } else {
        const newVertical = await verticalesService.createVertical(data);
        setVerticales([newVertical, ...verticales]);
        message.success('Vertical creado');
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedVertical(null);
    } catch (error) {
      if (error.message.includes('JSON')) {
        message.error('Error en formato JSON de uno de los campos');
      } else {
        message.error('Error al guardar: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const collapseSections = [
    {
      key: '1',
      label: 'Información Básica',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-xl)' }}>
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
              <Input placeholder="ej: Aplicación de Notificaciones" />
            </Form.Item>
          </div>
          <Form.Item
            label="Descripción Introducción"
            name="descripcion_intro"
          >
            <Input.TextArea rows={3} placeholder="Descripción breve del vertical" />
          </Form.Item>
          <Form.Item
            name="activo"
            valuePropName="checked"
          >
            <Checkbox>Activo</Checkbox>
          </Form.Item>
        </div>
      )
    },
    {
      key: '2',
      label: 'Estimación y Oferta',
      children: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-xl)' }}>
          <Form.Item
            label="Tarifa Diaria ($)"
            name="tarifa_diaria"
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Duración Típica (días)"
            name="duracion_tipica_dias"
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Margen de Oferta (%)"
            name="margen_oferta_pct"
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </div>
      )
    },
    {
      key: '3',
      label: 'Configuración EFDT',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Form.Item
            label="Descripción Implementación"
            name="descripcion_implementacion"
          >
            <Input.TextArea rows={3} placeholder="Descripción general de la implementación" />
          </Form.Item>
          <Form.Item
            label="Claves (JSON array)"
            name="claves"
          >
            <Input.TextArea rows={2} placeholder='["clave1", "clave2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Premisas Específicas (JSON array)"
            name="premisas_especificas"
          >
            <Input.TextArea rows={2} placeholder='["premisa1", "premisa2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Tablas Maestras (JSON array)"
            name="tablas_maestras"
          >
            <Input.TextArea rows={2} placeholder='["tabla1", "tabla2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Herramientas Recomendadas (JSON array)"
            name="herramientas_recomendadas"
          >
            <Input.TextArea rows={2} placeholder='["herramienta1", "herramienta2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Ejemplo Workflows (JSON array)"
            name="ejemplo_workflows"
          >
            <Input.TextArea rows={2} placeholder='["workflow1", "workflow2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Integraciones Comunes (JSON array)"
            name="integraciones_comunes"
          >
            <Input.TextArea rows={2} placeholder='["integracion1", "integracion2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
        </div>
      )
    },
    {
      key: '4',
      label: 'Configuración UAT',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Form.Item
            label="Casos de Prueba Típicos (JSON array)"
            name="casos_prueba_tipicos"
          >
            <Input.TextArea rows={2} placeholder='["caso1", "caso2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Criterios de Aceptación (JSON array)"
            name="criterios_aceptacion"
          >
            <Input.TextArea rows={2} placeholder='["criterio1", "criterio2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
        </div>
      )
    },
    {
      key: '5',
      label: 'Configuración Manual HTML',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Form.Item
            label="Módulos Funcionales (JSON array)"
            name="modulos_funcionales"
          >
            <Input.TextArea rows={2} placeholder='["modulo1", "modulo2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Procesos Clave (JSON array)"
            name="procesos_clave"
          >
            <Input.TextArea rows={2} placeholder='["proceso1", "proceso2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Integraciones Usuario (JSON array)"
            name="integraciones_usuario"
          >
            <Input.TextArea rows={2} placeholder='["integracion1", "integracion2"]' style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
          <Form.Item
            label="Plantilla HTML Manual"
            name="plantilla_html_manual"
          >
            <Input.TextArea rows={4} placeholder="<html>...</html>" style={{ fontFamily: 'monospace', fontSize: '12px' }} />
          </Form.Item>
        </div>
      )
    }
  ];

  return (
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* HEADER */}
      <div className="header-main">
        <h1 className="header-title" style={{ margin: 0 }}>
          Gestión de Verticales
        </h1>
        <div className="header-actions">
          <button
            onClick={createNewVertical}
            className="btn-primary"
          >
            + Nuevo Vertical
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={verticales}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: 1200 }}
            style={{ height: '100%' }}
          />
        </Spin>
      </div>

      {/* MODAL */}
      <Modal
        title={selectedVertical ? 'Editar Vertical' : 'Crear Nuevo Vertical'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedVertical(null);
        }}
        width={920}
        style={{ maxHeight: '90vh' }}
        bodyStyle={{
          maxHeight: 'calc(90vh - 200px)',
          overflow: 'auto',
          padding: '24px'
        }}
        confirmLoading={loading}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
          style={{ marginTop: '-8px' }}
        >
          <Collapse items={collapseSections} />
        </Form>
      </Modal>
    </div>
  );
}
