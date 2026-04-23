import { useState } from 'react';
import './Step.css';

export default function Step1Upload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedText, setUploadedText] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Error al subir archivo');
      }

      const result = await res.json();
      setFile(selectedFile.name);
      setUploadedText(result.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const fileContent = uploadedText || notes;
    if (!fileContent.trim()) {
      setError('Por favor sube un documento o escribe requisitos');
      return;
    }
    onComplete(notes || uploadedText, fileContent);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>📎 Paso 1: Documento o Requisitos</h2>
        <p>Sube un archivo (PDF, Word, TXT) o escribe los requisitos directamente</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="step-grid">
        {/* Left: File Upload */}
        <div className="step-section">
          <h3>Sube un documento</h3>
          <label className="upload-box">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <div className="upload-content">
              {file ? (
                <>
                  <div className="upload-icon">✓</div>
                  <p className="upload-name">{file}</p>
                  <p className="upload-hint">Clic para cambiar</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">📁</div>
                  <p className="upload-text">Arrastra o haz clic para seleccionar</p>
                  <p className="upload-hint">PDF, Word o TXT (máx 50MB)</p>
                </>
              )}
              {loading && <div className="spinner"></div>}
            </div>
          </label>

          {uploadedText && (
            <div className="preview-box">
              <p className="preview-label">Contenido extraído:</p>
              <pre className="preview-text">{uploadedText.substring(0, 500)}...</pre>
            </div>
          )}
        </div>

        {/* Right: Manual Input */}
        <div className="step-section">
          <h3>O escribe directamente</h3>
          <textarea
            placeholder="Escribe los requisitos, especificaciones técnicas, o contexto del proyecto..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: '200px' }}
          />
          <p className="step-hint">Se usará tanto el archivo como el texto que escribas aquí</p>
        </div>
      </div>

      <div className="step-footer">
        <button className="btn-primary" onClick={handleContinue}>
          Siguiente: Cuestionario →
        </button>
      </div>
    </div>
  );
}
