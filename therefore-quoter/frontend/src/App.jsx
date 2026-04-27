import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import SettingsKnowledge from './components/SettingsKnowledge';
import apiConfig from './config';

export default function App() {
  const [page, setPage] = useState('dashboard'); // 'dashboard' | 'wizard' | 'settings'
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await fetch(apiConfig.endpoints.quotes);
      if (res.ok) {
        setQuotes(await res.json());
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuote = () => {
    setEditingQuoteId(null);
    setPage('wizard');
  };

  const handleEditQuote = (quoteId) => {
    setEditingQuoteId(quoteId);
    setPage('wizard');
  };

  const handleWizardComplete = () => {
    fetchQuotes();
    setPage('dashboard');
    setEditingQuoteId(null);
  };

  const handleWizardCancel = () => {
    setPage('dashboard');
    setEditingQuoteId(null);
  };

  const handleDeleteQuote = async (id) => {
    if (!confirm('¿Eliminar cotización?')) return;
    try {
      await fetch(`${apiConfig.endpoints.quotes}/${id}`, { method: 'DELETE' });
      fetchQuotes();
    } catch (err) {
      console.error('Error deleting quote:', err);
    }
  };

  return (
    <div className="app">
      {page === 'dashboard' && (
        <Dashboard
          quotes={quotes}
          loading={loading}
          onNewQuote={handleNewQuote}
          onEditQuote={handleEditQuote}
          onDeleteQuote={handleDeleteQuote}
          onOpenSettings={() => setPage('settings')}
        />
      )}
      {page === 'wizard' && (
        <Wizard
          quoteId={editingQuoteId}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}
      {page === 'settings' && (
        <SettingsKnowledge onBackToDashboard={() => setPage('dashboard')} />
      )}
    </div>
  );
}
