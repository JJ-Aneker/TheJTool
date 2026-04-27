import { useState, useEffect } from 'react';
import './SettingsKnowledge.css';
import apiConfig from '../config';

export default function SettingsKnowledge({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('guide'); // guide, examples, preview
  const [guide, setGuide] = useState(null);
  const [examples, setExamples] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRatio, setEditingRatio] = useState(null);

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiConfig.endpoints.knowledge}`);
      if (res.ok) {
        const data = await res.json();
        setGuide(data.guide);
        setExamples(data.examples);
      }

      const systemRes = await fetch(`${apiConfig.endpoints.knowledge}/system-prompt`);
      if (systemRes.ok) {
        const { systemPrompt: prompt } = await systemRes.json();
        setSystemPrompt(prompt);
      }
    } catch (err) {
      setError('Error cargando knowledge base: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRatio = async (updatedRatios) => {
    try {
      const res = await fetch(`${apiConfig.endpoints.knowledge}/guide`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratios: updatedRatios })
      });

      if (res.ok) {
        const { guide: updatedGuide } = await res.json();
        setGuide(updatedGuide);
        setEditingRatio(null);
        setSuccess('✓ Guía actualizada correctamente');
        setTimeout(() => setSuccess(''), 3000);
        loadKnowledgeBase(); // Reload system prompt
      }
    } catch (err) {
      setError('Error actualizando guía: ' + err.message);
    }
  };

  const handleAddExample = async (newExample) => {
    try {
      const res = await fetch(`${apiConfig.endpoints.knowledge}/examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExample)
      });

      if (res.ok) {
        loadKnowledgeBase();
        setSuccess('✓ Proyecto de referencia añadido');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error añadiendo ejemplo: ' + err.message);
    }
  };

  const handleDeleteExample = async (exampleId) => {
    if (!confirm('¿Eliminar este proyecto de referencia?')) return;

    try {
      const res = await fetch(`${apiConfig.endpoints.knowledge}/examples/${exampleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        loadKnowledgeBase();
        setSuccess('✓ Proyecto eliminado');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error eliminando ejemplo: ' + err.message);
    }
  };

  if (loading) {
    return <div className="settings-container"><p>Cargando...</p></div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>⚙️ Knowledge Base Manager</h1>
          <p>Gestiona la guía de esfuerzo, proyectos de referencia y vista previa del sistema prompt</p>
        </div>
        {onBackToDashboard && (
          <button className="btn-back" onClick={onBackToDashboard}>← Volver al Dashboard</button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          📋 Guía de Esfuerzo
        </button>
        <button
          className={`tab-button ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          📚 Proyectos de Referencia
        </button>
        <button
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          👁️ Vista Previa System Prompt
        </button>
      </div>

      {/* Tab: Guía de Esfuerzo */}
      {activeTab === 'guide' && guide && (
        <GuideTab guide={guide} onUpdateRatio={handleUpdateRatio} editingRatio={editingRatio} setEditingRatio={setEditingRatio} />
      )}

      {/* Tab: Proyectos de Referencia */}
      {activeTab === 'examples' && examples && (
        <ExamplesTab examples={examples} onAddExample={handleAddExample} onDeleteExample={handleDeleteExample} />
      )}

      {/* Tab: System Prompt Preview */}
      {activeTab === 'preview' && (
        <PreviewTab systemPrompt={systemPrompt} />
      )}
    </div>
  );
}

function GuideTab({ guide, onUpdateRatio, editingRatio, setEditingRatio }) {
  return (
    <div className="tab-content">
      <h2>Ratios de Esfuerzo Therefore™</h2>
      <p className="tab-description">Versión {guide.version} · Validado {guide.fecha_validacion}</p>

      <div className="ratios-table-wrapper">
        <table className="ratios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Días Min</th>
              <th>Días Max</th>
              <th>Perfil</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {guide.ratios.map((ratio, idx) => (
              <tr key={ratio.id} className={idx % 2 === 0 ? '' : 'alternate'}>
                <td><strong>{ratio.nombre}</strong></td>
                <td className="desc">{ratio.descripcion}</td>
                <td className="center">
                  {editingRatio === ratio.id ? (
                    <input
                      type="number"
                      step="0.5"
                      value={ratio.diasMin}
                      onChange={(e) => {
                        const updated = guide.ratios.map(r =>
                          r.id === ratio.id ? { ...r, diasMin: parseFloat(e.target.value) } : r
                        );
                        onUpdateRatio(updated);
                      }}
                      className="input-inline"
                    />
                  ) : (
                    ratio.diasMin
                  )}
                </td>
                <td className="center">
                  {editingRatio === ratio.id ? (
                    <input
                      type="number"
                      step="0.5"
                      value={ratio.diasMax}
                      onChange={(e) => {
                        const updated = guide.ratios.map(r =>
                          r.id === ratio.id ? { ...r, diasMax: parseFloat(e.target.value) } : r
                        );
                        onUpdateRatio(updated);
                      }}
                      className="input-inline"
                    />
                  ) : (
                    ratio.diasMax
                  )}
                </td>
                <td><span className="badge">{ratio.perfilRecomendado}</span></td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => setEditingRatio(editingRatio === ratio.id ? null : ratio.id)}
                  >
                    {editingRatio === ratio.id ? '✓' : '✏️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="guide-notes">
        <h3>Parámetros Base</h3>
        <ul>
          <li><strong>Tarifa:</strong> €{guide.tarifa_default}/día</li>
          <li><strong>Jornada:</strong> {guide.horas_jornada} horas (lunes-viernes)</li>
          <li><strong>Perfiles:</strong> SA (Senior Architect) · Consultor · Formación</li>
          <li><strong>Proyectos de referencia:</strong> {guide.proyectos_referencia?.join(', ')}</li>
        </ul>
      </div>
    </div>
  );
}

function ExamplesTab({ examples, onAddExample, onDeleteExample }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    año: new Date().getFullYear(),
    tipo: 'nuevo',
    plataforma: 'online',
    contexto: ''
  });

  const handleAddClick = () => {
    if (formData.nombre.trim()) {
      onAddExample(formData);
      setFormData({ nombre: '', año: new Date().getFullYear(), tipo: 'nuevo', plataforma: 'online', contexto: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Proyectos de Referencia</h2>
      <p className="tab-description">{examples.examples.length} proyectos cargados</p>

      <div className="examples-grid">
        {examples.examples.map(ex => (
          <div key={ex.id} className="example-card">
            <div className="example-header">
              <h3>{ex.nombre}</h3>
              <span className="example-year">{ex.año}</span>
            </div>
            <div className="example-meta">
              <span className="badge">{ex.tipo === 'nuevo' ? '🆕' : '📈'} {ex.tipo}</span>
              <span className="badge">{ex.plataforma === 'online' ? '☁️' : '🖥️'} {ex.plataforma}</span>
            </div>
            <p className="example-context">{ex.contexto}</p>
            <div className="example-stats">
              <div className="stat">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{ex.totalDias} días</span>
              </div>
              <div className="stat">
                <span className="stat-label">Importe:</span>
                <span className="stat-value">€{ex.totalImporte.toLocaleString()}</span>
              </div>
            </div>
            <button className="btn-remove" onClick={() => onDeleteExample(ex.id)}>🗑️ Eliminar</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="add-example-form">
          <h3>Añadir Proyecto de Referencia</h3>
          <input
            type="text"
            placeholder="Nombre del cliente/proyecto"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
          <input
            type="number"
            placeholder="Año"
            value={formData.año}
            onChange={(e) => setFormData({ ...formData, año: parseInt(e.target.value) })}
          />
          <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
            <option value="nuevo">Nuevo</option>
            <option value="evolutivo">Evolutivo</option>
          </select>
          <select value={formData.plataforma} onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}>
            <option value="online">Online</option>
            <option value="onpremise">On-Premise</option>
          </select>
          <textarea
            placeholder="Contexto / Descripción"
            value={formData.contexto}
            onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
          />
          <div className="form-buttons">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleAddClick}>Guardar</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="btn-add" onClick={() => setShowForm(true)}>
          + Añadir Proyecto de Referencia
        </button>
      )}
    </div>
  );
}

function PreviewTab({ systemPrompt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tab-content">
      <h2>Vista Previa del System Prompt</h2>
      <p className="tab-description">Este es el prompt completo que se envía a Claude para analizar cotizaciones</p>

      <button className="btn-copy" onClick={handleCopy}>
        {copied ? '✓ Copiado' : '📋 Copiar'}
      </button>

      <div className="prompt-preview">
        <pre>{systemPrompt}</pre>
      </div>
    </div>
  );
}
