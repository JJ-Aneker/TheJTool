import { useState, useEffect } from 'react';
import './Wizard.css';
import Step1Upload from './Step1Upload';
import Step2Questionnaire from './Step2Questionnaire';
import Step3Estimation from './Step3Estimation';
import Step4Export from './Step4Export';

export default function Wizard({ quoteId, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Shared state
  const [formData, setFormData] = useState({
    notes: '',
    fileContent: '',
    answers: {
      cliente: '',
      tipo: 'nuevo',
      plataforma: 'online',
      erp: '',
      usuarios: '',
      eforms: '',
      firma: '',
      enfoque: ''
    },
    referencia: '',
    tarifa: 800
  });

  const [estimacion, setEstimacion] = useState(null);
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (quoteId) {
      loadQuote(quoteId);
    }
  }, [quoteId]);

  const loadQuote = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (res.ok) {
        const quote = await res.json();
        const data = typeof quote.data === 'string' ? JSON.parse(quote.data) : quote.data;

        setFormData(prev => ({
          ...prev,
          answers: {
            cliente: quote.cliente,
            ...prev.answers
          },
          referencia: quote.referencia,
          tarifa: quote.tarifa || 800
        }));

        if (data) {
          setEstimacion(data);
          setStep(3);
        }
      }
    } catch (err) {
      setError('Error cargando cotización: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Complete = (notes, fileContent) => {
    setFormData(prev => ({
      ...prev,
      notes,
      fileContent
    }));
    setStep(2);
    setError('');
  };

  const handleStep2Complete = (answers, referencia, tarifa) => {
    setFormData(prev => ({
      ...prev,
      answers,
      referencia,
      tarifa
    }));
    setStep(3);
    setError('');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: formData.notes,
          fileContent: formData.fileContent,
          answers: formData.answers
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error en análisis');
      }

      setEstimacion(result);
      setModified(false);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimacionChange = (bloques) => {
    setEstimacion(prev => ({
      ...prev,
      bloques
    }));
    setModified(true);
  };

  const handleStep4Complete = () => {
    onComplete();
  };

  if (loading && !estimacion) {
    return <div className="wizard"><p>Cargando...</p></div>;
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <h1>💼 Crear Cotización Therefore™</h1>
        <button className="btn-close" onClick={onCancel}>✕</button>
      </div>

      <div className="wizard-nav">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Documento</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Cuestionario</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Estimación</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Exportar</div>
        </div>
      </div>

      {error && <div className="error">⚠ {error}</div>}

      <div className="wizard-content">
        {step === 1 && <Step1Upload onComplete={handleStep1Complete} />}
        {step === 2 && (
          <Step2Questionnaire
            initialData={formData}
            onComplete={handleStep2Complete}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && estimacion && (
          <Step3Estimation
            estimacion={estimacion}
            tarifa={formData.tarifa}
            loading={loading}
            modified={modified}
            onAnalyze={handleAnalyze}
            onChange={handleEstimacionChange}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && estimacion && (
          <Step4Export
            formData={formData}
            estimacion={estimacion}
            loading={loading}
            onComplete={handleStep4Complete}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}
