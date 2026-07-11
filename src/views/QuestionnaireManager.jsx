import { useState, useEffect } from 'react';
import {
  Upload,
  Button,
  Card,
  Table,
  Tag,
  Space,
  Progress,
  Typography,
  Statistic,
  Row,
  Col,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Empty,
  Descriptions,
  Collapse
} from 'antd';
import {
  InboxOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { supabase } from '../config/supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;
const { Panel } = Collapse;

export default function QuestionnaireManager() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formularios, setFormularios] = useState([]);
  const [selectedFormulario, setSelectedFormulario] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  // Form state
  const [cliente, setCliente] = useState('');
  const [nombreFormulario, setNombreFormulario] = useState('');
  const [productoAfectado, setProductoAfectado] = useState('Therefore');
  const [fileList, setFileList] = useState([]);

  // Backend URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  // Cargar formularios al montar el componente
  useEffect(() => {
    loadFormularios();
  }, []);

  // Polling cada 5 segundos si hay formularios en procesamiento
  useEffect(() => {
    if (formularios.some(f => f.estado === 'procesando' || f.estado === 'pendiente')) {
      const interval = setInterval(() => {
        loadFormularios();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [formularios]);

  // Cargar lista de formularios desde Supabase
  const loadFormularios = async () => {
    try {
      console.log('[QuestionnaireManager] Cargando formularios...');
      const { data, error } = await supabase
        .from('formularios')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('[QuestionnaireManager] Error:', error);
        throw error;
      }

      console.log('[QuestionnaireManager] Formularios cargados:', data?.length || 0);
      setFormularios(data || []);
    } catch (err) {
      console.error('[QuestionnaireManager] Error cargando formularios:', err);
      message.error('Error al cargar los cuestionarios');
    }
  };

  // Configuración de Upload
  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('Solo se permiten ficheros Excel (.xlsx)');
        return Upload.LIST_IGNORE;
      }
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error('El fichero debe ser menor de 20MB');
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // Prevenir auto-upload
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  // Handler de subida
  const handleUpload = async () => {
    if (!cliente || !nombreFormulario || fileList.length === 0) {
      message.error('Por favor, completa todos los campos requeridos');
      return;
    }

    setUploading(true);

    try {
      // Obtener token de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        message.error('No estás autenticado. Por favor, inicia sesión.');
        setUploading(false);
        return;
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('file', fileList[0]);
      formData.append('cliente', cliente);
      formData.append('nombre_formulario', nombreFormulario);
      formData.append('producto_afectado', productoAfectado);

      // Subir al backend
      const response = await axios.post(`${API_URL}/api/questionnaires/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      message.success(`Cuestionario subido correctamente. ID: ${response.data.id}`);

      // Resetear formulario
      setCliente('');
      setNombreFormulario('');
      setProductoAfectado('Therefore');
      setFileList([]);

      // Recargar lista
      loadFormularios();

    } catch (err) {
      console.error('Error subiendo cuestionario:', err);
      message.error(err.response?.data?.error || 'Error al subir el cuestionario');
    } finally {
      setUploading(false);
    }
  };

  // Ver detalles de un formulario
  const viewDetails = async (formulario) => {
    setSelectedFormulario(formulario);
    setDetailModalVisible(true);

    if (formulario.estado === 'completado') {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await axios.get(
          `${API_URL}/api/questionnaires/${formulario.id}/status`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        setPreguntas(response.data.preguntas || []);
        setEstadisticas(response.data.estadisticas || null);
      } catch (err) {
        console.error('Error cargando detalles:', err);
        message.error('Error al cargar los detalles');
      } finally {
        setLoading(false);
      }
    }
  };

  // Columns de la tabla
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente'
    },
    {
      title: 'Formulario',
      dataIndex: 'nombre_formulario',
      key: 'nombre_formulario'
    },
    {
      title: 'Producto',
      dataIndex: 'producto_afectado',
      key: 'producto_afectado',
      render: (text) => text || '-'
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado, record) => {
        const config = {
          pendiente: { color: 'default', icon: <ClockCircleOutlined />, text: 'Pendiente' },
          procesando: { color: 'processing', icon: <SyncOutlined spin />, text: 'Procesando' },
          completado: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completado' },
          error: { color: 'error', icon: <CloseCircleOutlined />, text: 'Error' }
        };
        const { color, icon, text } = config[estado] || config.pendiente;

        return (
          <Space>
            <Tag color={color} icon={icon}>
              {text}
            </Tag>
            {estado === 'procesando' && record.total_preguntas && (
              <Progress
                percent={Math.round((record.preguntas_procesadas / record.total_preguntas) * 100)}
                size="small"
                style={{ width: 100 }}
              />
            )}
          </Space>
        );
      }
    },
    {
      title: 'Preguntas',
      key: 'preguntas',
      render: (_, record) => {
        if (record.estado === 'completado' && record.total_preguntas) {
          return <Text strong>{record.total_preguntas}</Text>;
        }
        if (record.estado === 'procesando' && record.preguntas_procesadas) {
          return <Text>{record.preguntas_procesadas} / {record.total_preguntas || '?'}</Text>;
        }
        return '-';
      }
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_recepcion',
      key: 'fecha_recepcion'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewDetails(record)}
          >
            Ver
          </Button>
          {record.estado === 'completado' && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => message.info('Descarga en desarrollo')}
            >
              Exportar
            </Button>
          )}
        </Space>
      )
    }
  ];

  // Columns de preguntas en el modal
  const preguntasColumns = [
    {
      title: 'Hoja',
      dataIndex: 'hoja',
      key: 'hoja',
      width: 120
    },
    {
      title: 'Sección',
      dataIndex: 'seccion',
      key: 'seccion',
      width: 200
    },
    {
      title: 'Pregunta',
      dataIndex: 'texto_pregunta',
      key: 'texto_pregunta',
      ellipsis: true
    },
    {
      title: 'Confianza',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence) => (
        <Tag color={confidence === 'alta' ? 'green' : 'orange'}>
          {confidence}
        </Tag>
      )
    },
    {
      title: 'Método',
      dataIndex: 'detection_method',
      key: 'detection_method',
      width: 100,
      render: (method) => (
        <Tag color={method === 'header' ? 'blue' : 'purple'}>
          {method}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <FileExcelOutlined /> Gestión de Cuestionarios de Seguridad IT
      </Title>
      <Paragraph type="secondary">
        Procesa cuestionarios de seguridad IT de proveedores (Excel) mediante extracción inteligente de preguntas con IA.
      </Paragraph>

      {/* Formulario de subida */}
      <Card
        title="Subir Nuevo Cuestionario"
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <label><Text strong>Cliente *</Text></label>
            <Input
              placeholder="Ej: ING"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              style={{ marginTop: 8, marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} md={8}>
            <label><Text strong>Nombre del Formulario *</Text></label>
            <Input
              placeholder="Ej: Third Party IT Security Compliance v3"
              value={nombreFormulario}
              onChange={(e) => setNombreFormulario(e.target.value)}
              style={{ marginTop: 8, marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} md={8}>
            <label><Text strong>Producto Afectado</Text></label>
            <Select
              value={productoAfectado}
              onChange={setProductoAfectado}
              style={{ width: '100%', marginTop: 8, marginBottom: 16 }}
            >
              <Option value="Therefore">Therefore</Option>
              <Option value="DOCAI">DOCAI</Option>
              <Option value="Corporativo">Corporativo</Option>
              <Option value="Mixto">Mixto</Option>
            </Select>
          </Col>
        </Row>

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click o arrastra el fichero Excel aquí</p>
          <p className="ant-upload-hint">
            Solo ficheros .xlsx (máximo 20MB)
          </p>
        </Dragger>

        <Button
          type="primary"
          size="large"
          onClick={handleUpload}
          loading={uploading}
          disabled={!cliente || !nombreFormulario || fileList.length === 0}
          style={{ marginTop: 16, width: '100%' }}
        >
          {uploading ? 'Subiendo...' : 'Subir y Procesar Cuestionario'}
        </Button>
      </Card>

      {/* Lista de formularios */}
      <Card
        title="Cuestionarios Procesados"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={loadFormularios}
          >
            Actualizar
          </Button>
        }
      >
        {formularios.length === 0 ? (
          <Empty description="No hay cuestionarios procesados aún" />
        ) : (
          <Table
            dataSource={formularios}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Modal de detalles */}
      <Modal
        title={`Detalles del Cuestionario #${selectedFormulario?.id}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setPreguntas([]);
          setEstadisticas(null);
        }}
        width={1200}
        footer={null}
      >
        {selectedFormulario && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Cliente">{selectedFormulario.cliente}</Descriptions.Item>
              <Descriptions.Item label="Formulario">{selectedFormulario.nombre_formulario}</Descriptions.Item>
              <Descriptions.Item label="Producto">{selectedFormulario.producto_afectado || '-'}</Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={
                  selectedFormulario.estado === 'completado' ? 'success' :
                  selectedFormulario.estado === 'procesando' ? 'processing' :
                  selectedFormulario.estado === 'error' ? 'error' : 'default'
                }>
                  {selectedFormulario.estado}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Recepción">{selectedFormulario.fecha_recepcion}</Descriptions.Item>
              <Descriptions.Item label="Fichero">{selectedFormulario.ruta_archivo_original?.split('/').pop()}</Descriptions.Item>
            </Descriptions>

            {selectedFormulario.estado === 'error' && (
              <Card type="inner" title="Error" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
                <Text type="danger">{selectedFormulario.mensaje_error}</Text>
              </Card>
            )}

            {selectedFormulario.estado === 'completado' && estadisticas && (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic title="Total Preguntas" value={estadisticas.total} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Alta Confianza"
                        value={estadisticas.por_confianza.alta}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Baja Confianza"
                        value={estadisticas.por_confianza.baja}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Pendientes Revisión"
                        value={estadisticas.pendientes_revision}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Preguntas Extraídas" style={{ marginTop: 16 }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                    </div>
                  ) : (
                    <Table
                      dataSource={preguntas}
                      columns={preguntasColumns}
                      rowKey="id"
                      pagination={{ pageSize: 20 }}
                      scroll={{ x: 1000 }}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '16px', background: '#f5f5f5' }}>
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="Pregunta">{record.texto_pregunta}</Descriptions.Item>
                              {record.respuesta_existente && (
                                <Descriptions.Item label="Respuesta Existente">{record.respuesta_existente}</Descriptions.Item>
                              )}
                              {record.evidencia_nota && (
                                <Descriptions.Item label="Evidencia">{record.evidencia_nota}</Descriptions.Item>
                              )}
                              <Descriptions.Item label="Celda Pregunta">{record.cell_ref}</Descriptions.Item>
                              <Descriptions.Item label="Celda Respuesta">{record.answer_cell_ref}</Descriptions.Item>
                            </Descriptions>
                          </div>
                        )
                      }}
                    />
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
