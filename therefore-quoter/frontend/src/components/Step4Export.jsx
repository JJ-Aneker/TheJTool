import { useState } from 'react';
import './Step.css';
import './Step4Export.css';

export default function Step4Export({
  formData,
  estimacion,
  loading,
  onComplete,
  onBack
}) {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDownload = async () => {
    setDownloadLoading(true);
    setError('');

    try {
      const fecha = new Date().toLocaleDateString('es-ES');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...estimacion,
          cliente: formData.answers.cliente,
          referencia: formData.referencia,
          tarifa: formData.tarifa,
          fecha
        })
      });

      if (!res.ok) {
        throw new Error('Error al generar documento');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `COTIZACION_${formData.answers.cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('✓ Documento descargado correctamente');
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSaveQuote = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: formData.answers.cliente,
          referencia: formData.referencia,
          tipo: formData.answers.tipo,
          titulo: estimacion.titulo || `Propuesta ${formData.answers.cliente}`,
          data: estimacion,
          tarifa: formData.tarifa,
          estado: 'borrador'
        })
      });

      if (!res.ok) {
        throw new Error('Error al guardar cotización');
      }

      setSuccess('✓ Cotización guardada correctamente');
      setTimeout(onComplete, 1500);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalDias = estimacion.bloques?.reduce((sum, b) =>
    sum + (b.tareas?.reduce((s, t) => s + (t.dias || 0), 0) || 0)
  , 0) || 0;

  const totalImporte = totalDias * formData.tarifa;

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>📥 Paso 4: Exportar y Guardar</h2>
        <p>Descarga el Word o guarda la cotización para editar después</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="export-summary">
        <div className="summary-section">
          <h3>Resumen de la Cotización</h3>
          <div className="summary-row">
            <span>Cliente:</span>
            <strong>{formData.answers.cliente}</strong>
          </div>
          <div className="summary-row">
            <span>Tipo:</span>
            <strong>{formData.answers.tipo === 'nuevo' ? 'Nuevo' : 'Evolutivo'}</strong>
          </div>
          {formData.referencia && (
            <div className="summary-row">
              <span>Referencia:</span>
              <strong>{formData.referencia}</strong>
            </div>
          )}
          <div className="summary-row">
            <span>Plataforma:</span>
            <strong>{formData.answers.plataforma === 'online' ? 'Therefore™ Online' : 'On-Premise'}</strong>
          </div>
        </div>

        <div className="summary-section">
          <h3>Estimación</h3>
          <div className="summary-row">
            <span>Bloques:</span>
            <strong>{estimacion.bloques?.length || 0}</strong>
          </div>
          <div className="summary-row">
            <span>Tareas totales:</span>
            <strong>
              {estimacion.bloques?.reduce((sum, b) => sum + (b.tareas?.length || 0), 0) || 0}
            </strong>
          </div>
          <div className="summary-row big">
            <span>Días de esfuerzo:</span>
            <strong>{totalDias.toFixed(1)}</strong>
          </div>
          <div className="summary-row big">
            <span>Importe aproximado:</span>
            <strong className="importe">€{totalImporte.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="actions-grid">
        <button className="btn-save" onClick={handleSaveQuote} disabled={saving}>
          {saving ? (
            <><span className="spinner"></span>Guardando...</>
          ) : (
            <>💾 Guardar Cotización</>
          )}
        </button>
        <button className="btn-download" onClick={handleDownload} disabled={downloadLoading}>
          {downloadLoading ? (
            <><span className="spinner"></span>Generando Word...</>
          ) : (
            <>⬇ Descargar Word (.docx)</>
          )}
        </button>
      </div>

      <div className="export-info">
        <p>
          <strong>Guardar:</strong> Almacena la cotización en la base de datos para editarla después
        </p>
        <p>
          <strong>Descargar:</strong> Genera un documento Word listo para enviar al cliente
        </p>
      </div>

      <div className="step-footer">
        <button className="btn-secondary" onClick={onBack}>
          ← Volver a Estimación
        </button>
      </div>
    </div>
  );
}
