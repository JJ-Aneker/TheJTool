module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // GET all quotes
  router.get('/', (req, res) => {
    try {
      const quotes = db.getAll().map(q => ({
        id: q.id,
        cliente: q.cliente,
        referencia: q.referencia,
        tipo: q.tipo,
        titulo: q.titulo,
        dias: q.dias,
        importe: q.importe,
        estado: q.estado,
        created_at: q.created_at
      }));
      res.json(quotes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET single quote
  router.get('/:id', (req, res) => {
    try {
      const quote = db.getById(req.params.id);

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      const result = { ...quote };
      if (typeof result.data === 'string') {
        try {
          result.data = JSON.parse(result.data);
        } catch (e) {
          console.error('Error parsing quote data:', e);
        }
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST new quote
  router.post('/', (req, res) => {
    const { cliente, referencia, tipo, titulo, data, tarifa, estado } = req.body;

    if (!cliente) {
      return res.status(400).json({ error: 'Cliente requerido' });
    }

    try {
      const dataToStore = typeof data === 'string' ? JSON.parse(data) : data || {};
      const dias = dataToStore?.bloques?.reduce((sum, b) => sum + (b.tareas || []).reduce((s, t) => s + (t.dias || 0), 0), 0) || 0;
      const importe = dias * (tarifa || 800);

      const quote = db.insert({
        cliente,
        referencia: referencia || null,
        tipo: tipo || 'nuevo',
        titulo: titulo || '',
        data: dataToStore,
        tarifa: tarifa || 800,
        dias,
        importe,
        estado: estado || 'borrador'
      });

      res.status(201).json({ id: quote.id, dias, importe });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update quote
  router.put('/:id', (req, res) => {
    const { estado, data, tarifa } = req.body;

    try {
      const quote = db.getById(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      const updates = {};

      if (estado !== undefined) {
        updates.estado = estado;
      }

      if (data !== undefined) {
        const dataToStore = typeof data === 'string' ? JSON.parse(data) : data;
        updates.data = dataToStore;

        // Recalculate dias and importe
        const dias = dataToStore?.bloques?.reduce((sum, b) => sum + (b.tareas || []).reduce((s, t) => s + (t.dias || 0), 0), 0) || 0;
        const tar = tarifa || quote.tarifa || 800;
        updates.dias = dias;
        updates.importe = dias * tar;
      } else if (tarifa !== undefined) {
        updates.tarifa = tarifa;
        updates.importe = (quote.dias || 0) * tarifa;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nada que actualizar' });
      }

      db.update(req.params.id, updates);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE quote
  router.delete('/:id', (req, res) => {
    try {
      const success = db.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
