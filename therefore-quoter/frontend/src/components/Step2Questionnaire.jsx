import { useState } from 'react';
import './Step.css';

export default function Step2Questionnaire({ initialData, onComplete, onBack }) {
  const [answers, setAnswers] = useState(initialData.answers);
  const [referencia, setReferencia] = useState(initialData.referencia);
  const [tarifa, setTarifa] = useState(initialData.tarifa);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!answers.cliente.trim()) {
      setError('El cliente es obligatorio');
      return;
    }
    onComplete(answers, referencia, tarifa);
  };

  const updateAnswer = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>📋 Paso 2: Cuestionario de Análisis</h2>
        <p>Responde las preguntas sobre el proyecto para estimar el esfuerzo</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="step-content">
        {/* Cliente */}
        <div className="form-group">
          <label className="form-label">* Cliente / Oportunidad</label>
          <input
            type="text"
            placeholder="Ej: VOX España, Ethypharm, BuildingCenter"
            value={answers.cliente}
            onChange={(e) => updateAnswer('cliente', e.target.value)}
          />
        </div>

        {/* Referencia */}
        <div className="form-group">
          <label className="form-label">Referencia / Opportunity ID</label>
          <input
            type="text"
            placeholder="Ej: OP-2024-001"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </div>

        {/* Tipo */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo de Proyecto</label>
            <select value={answers.tipo} onChange={(e) => updateAnswer('tipo', e.target.value)}>
              <option value="nuevo">🆕 Nuevo (Licencias + Servicios)</option>
              <option value="evolutivo">📈 Evolutivo (Solo Servicios)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Plataforma</label>
            <select value={answers.plataforma} onChange={(e) => updateAnswer('plataforma', e.target.value)}>
              <option value="online">☁️ Therefore™ Online</option>
              <option value="onpremise">🖥️ On-Premise (2020+)</option>
            </select>
          </div>
        </div>

        {/* ERP */}
        <div className="form-group">
          <label className="form-label">Sistema ERP o Contable</label>
          <select value={answers.erp} onChange={(e) => updateAnswer('erp', e.target.value)}>
            <option value="">— Sin integración —</option>
            <option value="sap">SAP</option>
            <option value="oracle">Oracle</option>
            <option value="dynamics">Dynamics 365</option>
            <option value="coda">CODA (Certificaciones)</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Usuarios */}
        <div className="form-group">
          <label className="form-label">Número aproximado de usuarios</label>
          <select value={answers.usuarios} onChange={(e) => updateAnswer('usuarios', e.target.value)}>
            <option value="">— No estimado —</option>
            <option value="1-5">1-5 usuarios</option>
            <option value="5-50">5-50 usuarios</option>
            <option value="50-100">50-100 usuarios</option>
            <option value="100+">100+ usuarios</option>
          </select>
        </div>

        {/* eForms */}
        <div className="form-group">
          <label className="form-label">¿Necesitas eForms (formularios web)?</label>
          <select value={answers.eforms} onChange={(e) => updateAnswer('eforms', e.target.value)}>
            <option value="">— Pendiente de decisión —</option>
            <option value="no">No, solo gestión documental</option>
            <option value="simple">Sí, formularios simples (1-3)</option>
            <option value="complejos">Sí, formularios complejos con lógica</option>
          </select>
        </div>

        {/* Firma */}
        <div className="form-group">
          <label className="form-label">¿Necesitas capacidad de firma digital?</label>
          <select value={answers.firma} onChange={(e) => updateAnswer('firma', e.target.value)}>
            <option value="">— Pendiente de decisión —</option>
            <option value="no">No</option>
            <option value="avanzada">Sí, firma avanzada XAdES</option>
          </select>
        </div>

        {/* Enfoque */}
        <div className="form-group">
          <label className="form-label">Enfoque principal del proyecto</label>
          <select value={answers.enfoque} onChange={(e) => updateAnswer('enfoque', e.target.value)}>
            <option value="">— A determinar —</option>
            <option value="procesos">Procesos y workflows</option>
            <option value="captura">Captura y automatización</option>
            <option value="hibrido">Híbrido (ambos)</option>
            <option value="migracion">Migración desde otro DMS</option>
          </select>
        </div>

        {/* Tarifa */}
        <div className="form-group">
          <label className="form-label">Tarifa de consultoría (€/día)</label>
          <input
            type="number"
            value={tarifa}
            onChange={(e) => setTarifa(parseFloat(e.target.value) || 800)}
            min="100"
            max="2000"
            step="100"
          />
        </div>
      </div>

      <div className="step-footer">
        <button className="btn-secondary" onClick={onBack}>
          ← Volver
        </button>
        <button className="btn-primary" onClick={handleContinue}>
          Siguiente: Análisis →
        </button>
      </div>
    </div>
  );
}
