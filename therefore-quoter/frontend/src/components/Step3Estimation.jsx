import { useState, useEffect } from 'react';
import './Step.css';
import './Step3Estimation.css';

export default function Step3Estimation({
  estimacion,
  tarifa,
  loading,
  modified,
  onAnalyze,
  onChange,
  onNext,
  onBack
}) {
  const [bloques, setBloques] = useState(estimacion.bloques || []);
  const [totals, setTotals] = useState({});

  useEffect(() => {
    calculateTotals();
  }, [bloques]);

  const calculateTotals = () => {
    let totalDias = 0;
    let totalHoras = 0;
    let totalImporte = 0;

    bloques.forEach(bloque => {
      bloque.tareas.forEach(tarea => {
        const dias = tarea.dias || 0;
        const horas = tarea.horas || dias * 8;
        totalDias += dias;
        totalHoras += horas;
        totalImporte += dias * tarifa;
      });
    });

    setTotals({ dias: totalDias, horas: totalHoras, importe: totalImporte });
  };

  const updateTarea = (bloqueIdx, tareaIdx, field, value) => {
    const newBloques = bloques.map((b, bi) => {
      if (bi === bloqueIdx) {
        const tareas = b.tareas.map((t, ti) => {
          if (ti === tareaIdx) {
            return { ...t, [field]: parseFloat(value) || 0 };
          }
          return t;
        });
        return { ...b, tareas };
      }
      return b;
    });
    setBloques(newBloques);
    onChange(newBloques);
  };

  const addTarea = (bloqueIdx) => {
    const newBloques = bloques.map((b, bi) => {
      if (bi === bloqueIdx) {
        return {
          ...b,
          tareas: [
            ...b.tareas,
            { cod: 'NEW', desc: 'Nueva tarea', perfil: 'Consultor', dias: 0.5, horas: 4 }
          ]
        };
      }
      return b;
    });
    setBloques(newBloques);
    onChange(newBloques);
  };

  const removeTarea = (bloqueIdx, tareaIdx) => {
    const newBloques = bloques.map((b, bi) => {
      if (bi === bloqueIdx) {
        return {
          ...b,
          tareas: b.tareas.filter((_, ti) => ti !== tareaIdx)
        };
      }
      return b;
    });
    setBloques(newBloques);
    onChange(newBloques);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>📊 Paso 3: Estimación de Esfuerzo</h2>
        <p>Revisa y ajusta los días de esfuerzo. Los totales se calculan automáticamente.</p>
      </div>

      <div className="estimation-toolbar">
        <div className="totals-summary">
          <div className="total-item">
            <span className="total-label">Días totales:</span>
            <span className="total-value">{totals.dias.toFixed(1)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Importe aproximado:</span>
            <span className="total-value">€{totals.importe.toFixed(2)}</span>
          </div>
        </div>
        <button
          className="btn-secondary"
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading ? <><span className="spinner"></span>Analizando...</> : '🔄 Regenerar Análisis'}
        </button>
      </div>

      <div className="bloques-list">
        {bloques.map((bloque, bloqueIdx) => (
          <div key={bloqueIdx} className="bloque-card">
            <div className="bloque-header">
              <h3>{bloque.grupo || bloque.label}</h3>
              <span className="bloque-count">{bloque.tareas.length} tareas</span>
            </div>

            <table className="tareas-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Perfil</th>
                  <th>Días</th>
                  <th>Horas</th>
                  <th>€</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bloque.tareas.map((tarea, tareaIdx) => {
                  const diasVal = tarea.dias || 0;
                  const horasVal = tarea.horas || diasVal * 8;
                  const importeVal = diasVal * tarifa;

                  return (
                    <tr key={tareaIdx} className={tareaIdx % 2 === 0 ? '' : 'alternate'}>
                      <td>
                        <input
                          type="text"
                          value={tarea.desc || ''}
                          onChange={(e) => updateTarea(bloqueIdx, tareaIdx, 'desc', e.target.value)}
                          className="input-inline"
                        />
                      </td>
                      <td>
                        <select
                          value={tarea.perfil || 'Consultor'}
                          onChange={(e) => updateTarea(bloqueIdx, tareaIdx, 'perfil', e.target.value)}
                          className="input-inline"
                        >
                          <option>SA</option>
                          <option>Consultor</option>
                          <option>Formación</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={diasVal}
                          onChange={(e) => updateTarea(bloqueIdx, tareaIdx, 'dias', e.target.value)}
                          step="0.5"
                          min="0"
                          className="input-inline text-right"
                        />
                      </td>
                      <td className="text-right">{horasVal.toFixed(0)}</td>
                      <td className="text-right">€{importeVal.toFixed(2)}</td>
                      <td>
                        <button
                          className="btn-remove"
                          onClick={() => removeTarea(bloqueIdx, tareaIdx)}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              className="btn-add-task"
              onClick={() => addTarea(bloqueIdx)}
            >
              + Agregar tarea
            </button>
          </div>
        ))}
      </div>

      <div className="step-footer">
        <button className="btn-secondary" onClick={onBack}>
          ← Volver
        </button>
        <button className="btn-primary" onClick={onNext}>
          Siguiente: Exportar →
        </button>
      </div>
    </div>
  );
}
