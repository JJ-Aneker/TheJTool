import './Dashboard.css';
import apiConfig from '../config';

export default function Dashboard({ quotes, loading, onNewQuote, onEditQuote, onDeleteQuote, onOpenSettings }) {
  if (loading) {
    return <div className="dashboard"><p>Cargando...</p></div>;
  }

  const handleDownload = async (quote) => {
    try {
      const data = typeof quote.data === 'string' ? JSON.parse(quote.data) : quote.data;
      const res = await fetch(apiConfig.endpoints.generate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cliente: quote.cliente,
          referencia: quote.referencia,
          tarifa: quote.tarifa,
          fecha: new Date(quote.created_at).toLocaleDateString('es-ES')
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `COTIZACION_${quote.cliente}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error downloading:', err);
      alert('Error al descargar el documento');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>📊 Therefore™ Quoter</h1>
          <p className="subtitle">Gestor de cotizaciones y propuestas técnicas</p>
        </div>
        <div className="header-buttons">
          <button className="btn-settings" onClick={onOpenSettings}>
            ⚙️ Knowledge Base
          </button>
          <button className="btn-primary" onClick={onNewQuote}>
            ➕ Nueva Cotización
          </button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state">
          <p>No hay cotizaciones todavía</p>
          <button className="btn-primary" onClick={onNewQuote}>
            Crear Primera Cotización
          </button>
        </div>
      ) : (
        <div className="quotes-table">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Referencia</th>
                <th>Tipo</th>
                <th>Días</th>
                <th>Importe €</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote.id}>
                  <td><strong>{quote.cliente}</strong></td>
                  <td>{quote.referencia || '—'}</td>
                  <td>{quote.tipo === 'nuevo' ? '🆕 Nuevo' : '📈 Evolutivo'}</td>
                  <td>{quote.dias ? quote.dias.toFixed(1) : '—'}</td>
                  <td>{quote.importe ? '€' + quote.importe.toFixed(2) : '—'}</td>
                  <td>
                    <span className={`status status-${quote.estado}`}>
                      {quote.estado === 'borrador' ? '📝 Borrador' :
                       quote.estado === 'enviado' ? '📤 Enviado' :
                       '✅ Aceptado'}
                    </span>
                  </td>
                  <td>{new Date(quote.created_at).toLocaleDateString('es-ES')}</td>
                  <td className="actions">
                    <button className="btn-small" onClick={() => handleDownload(quote)} title="Descargar">⬇</button>
                    <button className="btn-small" onClick={() => onEditQuote(quote.id)} title="Editar">✏️</button>
                    <button className="btn-small delete" onClick={() => onDeleteQuote(quote.id)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
